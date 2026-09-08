import { CREDIT_COST_PER_GENERATION } from "@/lib/constants";
import { db } from "@/lib/prisma";
import { FileData } from "@/types/workspace";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { Agent, createTool } from "@cline/sdk";
import z from "zod";

function sseEvent(type: string, payload: unknown): string {
  return `data: ${JSON.stringify({ type, ...(payload as object) })}\n\n`;
}

/**
 * Detect whether the error is related to Gemini quota/rate limits.
 *
 * We only fallback to the Lite model for quota/rate-limit type errors.
 * Other errors are returned normally instead of blindly retrying.
 */
function isGeminiQuotaError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);

  const normalized = message.toLowerCase();

  return (
    normalized.includes("429") ||
    normalized.includes("resource_exhausted") ||
    normalized.includes("resource exhausted") ||
    normalized.includes("quota exceeded") ||
    normalized.includes("quota_exceeded") ||
    normalized.includes("rate limit") ||
    normalized.includes("rate_limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("limit exceeded")
  );
}

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const {
    workspaceId,
    userRequest,
    fileData,
  } = body as {
    workspaceId: string;
    userRequest: string;
    fileData: FileData;
  };

  /**
   * Get the authenticated user from Clerk.
   *
   * We intentionally don't trust userId coming from the client.
   */
  const user = await db.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      credits: true,
      plan: true,
    },
  });

  if (!user) {
    return Response.json(
      { message: "User Not Found" },
      { status: 404 },
    );
  }

  if (user.plan !== "pro") {
    return Response.json(
      { message: "Upgrade required" },
      { status: 403 },
    );
  }

  if (user.credits < CREDIT_COST_PER_GENERATION) {
    return Response.json(
      { message: "Insufficient credits" },
      { status: 402 },
    );
  }

  /**
   * Verify that this workspace belongs to the authenticated user.
   *
   * This prevents users from modifying another user's workspace
   * by sending a different userId/workspaceId from the frontend.
   */
  const workspace = await db.workspace.findFirst({
    where: {
      id: workspaceId,
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!workspace) {
    return Response.json(
      { message: "Workspace Not Found" },
      { status: 404 },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (chunk: string) => {
        controller.enqueue(encoder.encode(chunk));
      };

      /**
       * Start with the files supplied by the frontend.
       *
       * We keep this object outside the model-run function so that
       * file changes made by the first model can be preserved if
       * a fallback is needed.
       */
      const patchedFile: Record<string, { code: string }> = {
        ...fileData.files,
      };

      let finalSummary = "";

      /**
       * Current model being used.
       */
      let activeModel = "gemini-3.5-flash";

      /**
       * Create the agent for a specific Gemini model.
       */
      const createGeminiAgent = (modelId: string) => {
        const updateFileTool = createTool({
          name: "update_file",
          description:
            "Update or rewrite a file in the React Sandbox. Call once per file you need to change.",
          inputSchema: z.object({
            path: z
              .string()
              .describe(
                "File path exactly as it appears, e.g /App.js",
              ),

            code: z
              .string()
              .describe(
                "Complete new contents of the file.",
              ),

            reason: z
              .string()
              .describe(
                "One sentence explaining what you changed and why",
              ),
          }),

          async execute({ path, code, reason }) {
            patchedFile[path] = { code };

            enqueue(
              sseEvent("file_patch", {
                path,
                code,
                reason,
              }),
            );

            return `Updated ${path}: ${reason}`;
          },
        });

        const doneImprovingTool = createTool({
          name: "done_improving",

          description:
            "Call this when you have finished making all improvements.",

          inputSchema: z.object({
            summary: z
              .string()
              .describe(
                "A short friendly summary of all the improvements you made (1-3 sentences)",
              ),
          }),

          lifecycle: {
            completesRun: true,
          },

          async execute({ summary }) {
            finalSummary = summary;

            return "Done";
          },
        });

        const fileContext = Object.entries(patchedFile)
          .map(
            ([path, { code }]) =>
              `// ${path}\n${code}`,
          )
          .join("\n\n---\n\n");

        const agent = new Agent({
          providerId: "gemini",

          modelId,

          apiKey: process.env.GEMINI_API_KEY!,

          maxIterations: 15,

          systemPrompt: `You are an expert React developer improving a live browser preview app.

The app uses React (functional components), Tailwind CSS for styling, and runs in Sandpack.

You CANNOT use:
- TypeScript
- CSS modules
- real npm install

Only use packages that are already available.

Available packages:
- react
- react-dom
- tailwindcss (CDN)
- lucide-react
- recharts
- react-router-dom
- framer-motion
- date-fns
- zod
- react-hook-form

Here are the current files:

${fileContext}

WORKFLOW:

1. Understand what the user wants improved.
2. Identify which files need to change.
3. Call update_file for each file that needs changes.
4. Always provide the COMPLETE contents of every changed file.
5. Once all files are updated, call done_improving with a short summary.

RULES:

- Always write complete file contents — never partial snippets.
- Keep all existing functionality unless the user explicitly asks to remove it.
- Do not change business logic unnecessarily.
- Do not remove existing features.
- The entry point is always /App.js with a default export.
- All imports must reference files you've updated or packages in the available list.
- Do not use TypeScript.
- Do not create package.json changes.
- Do not install packages.
- Focus primarily on improving UI/UX, styling, responsiveness, accessibility and visual quality.
- Make sure the resulting code remains valid React and works in Sandpack.
- If the user asks for a redesign, make the design substantially different from the existing design while preserving functionality.`,

          tools: [
            updateFileTool,
            doneImprovingTool,
          ],

          toolPolicies: {
            update_file: {
              autoApprove: true,
            },

            done_improving: {
              autoApprove: true,
            },
          },
        });

        /**
         * Subscribe to this specific agent.
         */
        agent.subscribe((event) => {
          if (
            event.type === "assistant-text-delta" &&
            event.text
          ) {
            enqueue(
              sseEvent("thinking", {
                text: event.text,
              }),
            );
          }

          if (event.type === "tool-started") {
            const name = event.toolCall?.toolName;

            if (name === "update_file") {
              const path =
                (
                  event.toolCall?.input as {
                    path?: string;
                  }
                )?.path ?? "a file";

              enqueue(
                sseEvent("thinking", {
                  text: `\n\nUpdating \`${path}\`...`,
                }),
              );
            }

            if (name === "done_improving") {
              enqueue(
                sseEvent("thinking", {
                  text:
                    "\n\nFinalizing improvements...",
                }),
              );
            }
          }
        });

        return agent;
      };

      /**
       * Run Gemini with automatic fallback.
       */
      const runAgentWithFallback = async () => {
        /**
         * ============================
         * FIRST ATTEMPT
         * Gemini 3.5 Flash
         * ============================
         */
        activeModel = "gemini-3.5-flash";

        enqueue(
          sseEvent("status", {
            message:
              "Starting Gemini 3.5 Flash...",
            model: activeModel,
          }),
        );

        try {
          const agent =
            createGeminiAgent(
              "gemini-3.5-flash",
            );

          const result =
            await agent.run(userRequest);

          if (result.status === "failed") {
            throw new Error(
              result.error?.message ??
                "Gemini 3.5 Flash agent run failed",
            );
          }

          return result;
        } catch (primaryError) {
          console.error(
            "[Improve] Primary Gemini error:",
            primaryError,
          );

          /**
           * Only fallback for quota/rate-limit errors.
           */
          if (
            !isGeminiQuotaError(
              primaryError,
            )
          ) {
            throw primaryError;
          }

          /**
           * ============================
           * FALLBACK
           * Gemini 3.5 Flash Lite
           * ============================
           */
          activeModel =
            "gemini-3.5-flash-lite";

          enqueue(
            sseEvent("status", {
              message:
                "Gemini 3.5 Flash limit reached. Switching to Gemini 3.5 Flash Lite...",
              model: activeModel,
              fallback: true,
            }),
          );

          enqueue(
            sseEvent("thinking", {
              text:
                "\n\n⚡ Primary model limit reached. Switching to Gemini 3.5 Flash Lite...",
            }),
          );

          try {
            const fallbackAgent =
              createGeminiAgent(
                "gemini-3.5-flash-lite",
              );

            const fallbackResult =
              await fallbackAgent.run(
                userRequest,
              );

            if (
              fallbackResult.status ===
              "failed"
            ) {
              throw new Error(
                fallbackResult.error
                  ?.message ??
                  "Gemini 3.5 Flash Lite agent run failed",
              );
            }

            return fallbackResult;
          } catch (fallbackError) {
            console.error(
              "[Improve] Fallback Gemini error:",
              fallbackError,
            );

            throw fallbackError;
          }
        }
      };

      try {
        const result =
          await runAgentWithFallback();

        /**
         * Prepare final file data.
         */
        const newFileData: FileData = {
          files: patchedFile,

          dependencies:
            fileData.dependencies,

          title: fileData.title,
        };

        /**
         * Save the generated files.
         *
         * Use the authenticated user's ID.
         */
        await db.workspace.update({
          where: {
            id: workspaceId,
          },

          data: {
            fileData:
              newFileData as never,
          },
        });

        /**
         * Deduct credits ONLY after successful generation.
         *
         * This happens once even if fallback was used.
         */
        const updatedUser =
          await db.user.update({
            where: {
              id: user.id,
            },

            data: {
              credits: {
                decrement:
                  CREDIT_COST_PER_GENERATION,
              },
            },

            select: {
              credits: true,
            },
          });

        /**
         * Tell frontend generation is complete.
         */
        enqueue(
          sseEvent("done", {
            fileData: newFileData,

            summary:
              finalSummary ||
              result.outputText,

            creditsRemaining:
              updatedUser.credits,

            modelUsed:
              activeModel,

            fallbackUsed:
              activeModel ===
              "gemini-3.5-flash-lite",
          }),
        );
      } catch (error) {
        console.error(
          "[Improve] error:",
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong";

        enqueue(
          sseEvent("error", {
            message,

            modelUsed:
              activeModel,

            fallbackAttempted:
              activeModel ===
              "gemini-3.5-flash-lite",
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":
        "text/event-stream",

      "Cache-Control":
        "no-cache, no-transform",

      Connection: "keep-alive",

      "X-Accel-Buffering": "no",
    },
  });
}

export const runtime = "nodejs";

export const maxDuration = 300;

