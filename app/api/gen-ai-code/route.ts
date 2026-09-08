import { CREDIT_COST_PER_GENERATION } from "@/lib/constants";
import { db } from "@/lib/prisma";
import { FileData, Message } from "@/types/workspace";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { aj } from "@/lib/arcjet";

function trimmedHistory(messages: Message[]): Message[] {
  if (messages.length <= 10) return messages;
  return [messages[0], ...messages.slice(-8)];
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const SYSTEM_PROMPT = `You are an expert React developer. Your job is to generate complete, working React applications based on user prompts.

RULES:
1. Always respond with a valid JSON object — no markdown fences, no extra text.
2. The JSON must match this exact shape:
{
  "assistantMessage": "<brief explanation of what you built/changed>",
  "title": "<short 2-4 word title for the app, e.g. 'Todo List App'>",
  "files": {
    "/App.js": { "code": "<full file content>" },
    "/components/SomeComponent.js": { "code": "<full file content>" }
  },
  "dependencies": {
    "some-package": "latest"
  }
}
3. Use React (functional components + hooks). Do NOT use TypeScript in generated files.
4. Use Tailwind CSS for all styling. Do not use CSS modules or inline styles unless absolutely necessary.
5. The entry point must always be /App.js and must export a default component.
6. All imports must reference files you include in "files" or packages in "dependencies".
7. Do not include react, react-dom, or tailwindcss in "dependencies" — they are always available.
8. When modifying existing code, include ALL files (both changed and unchanged) in "files".
9. Keep code clean, readable, and production-quality.
10. If the user attaches an image, use it as a design reference and match the layout/style as closely as possible.`;

function extractThoughtLabel(text: string): string | null {
  const boldMatch = text.match(/\*\*([^*]{4,60})\*\*/);

  if (boldMatch) {
    return boldMatch[1].trim();
  }

  const sentence = text.split(/[.\n]/)[0].trim();

  if (sentence.length >= 8 && sentence.length <= 80) {
    return sentence;
  }

  return null;
}

function sseEvent(type: string, payload: unknown): string {
  return `data: ${JSON.stringify({
    type,
    ...(payload as object),
  })}\n\n`;
}

/**
 * Check whether the Gemini error is a quota/rate-limit error.
 *
 * We only fallback to the Lite model for these errors.
 * Normal API errors should not automatically trigger fallback.
 */
function isGeminiQuotaError(error: unknown): boolean {
  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else {
    try {
      message = JSON.stringify(error);
    } catch {
      message = String(error);
    }
  }

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

async function validateDependencies(
  deps: Record<string, string>,
): Promise<Record<string, string>> {
  const valid: Record<string, string> = {};

  await Promise.all(
    Object.entries(deps).map(async ([pkg, version]) => {
      try {
        const res = await fetch(
          `https://registry.npmjs.org/${pkg}/latest`,
          {
            signal: AbortSignal.timeout(1500),
          },
        );

        if (res.ok) {
          valid[pkg] = version;
        }
      } catch {
        // Silently skip invalid/hallucinated packages
      }
    }),
  );

  return valid;
}

function buildContents(
  messages: Message[],
  fileData: FileData | null,
) {
  const trimmed = trimmedHistory(messages);

  return trimmed.map((msg, idx) => {
    const role =
      msg.role === "assistant" ? "model" : "user";

    if (msg.role === "user") {
      const parts: object[] = [];

      let text = msg.content;

      if (msg.imageUrl) {
        text = `The user has attached an image. Use this URL directly in the generated app where relevant (as img src, background-image, etc.): ${msg.imageUrl}

${text}`;
      }

      const isLast =
        idx === trimmed.length - 1;

      if (isLast && fileData) {
        text +=
          "\n\nCurrent project files for context:\n" +
          JSON.stringify(fileData, null, 2);
      }

      parts.push({ text });

      return {
        role,
        parts,
      };
    }

    return {
      role,
      parts: [{ text: msg.content }],
    };
  });
}

/**
 * Runs Gemini streaming generation.
 *
 * If the primary model hits quota/rate-limit,
 * the caller can retry using the fallback model.
 */
async function generateWithModel(
  model: string,
  contents: ReturnType<typeof buildContents>,
  enqueue: (chunk: string) => void,
) {
  const geminiStream =
    await ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,

        responseMimeType: "application/json",

        thinkingConfig: {
          includeThoughts: true,
        },
      },
    });

  let accumulated = "";
  let lastEmitTime = 0;

  for await (const chunk of geminiStream) {
    const parts =
      chunk.candidates?.[0]?.content?.parts ?? [];

    for (const part of parts) {
      if (!part.text) continue;

      if (part.thought) {
        const now = Date.now();

        if (now - lastEmitTime > 600) {
          const label =
            extractThoughtLabel(part.text);

          if (label) {
            enqueue(
              sseEvent("status", {
                message: label,
              }),
            );

            lastEmitTime = now;
          }
        }
      } else {
        accumulated += part.text;
      }
    }
  }

  return accumulated;
}

export async function POST(
  request: NextRequest,
) {
  const { userId: clerkId } =
    await auth();

  if (!clerkId) {
    return Response.json(
      { message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();

  const {
    workspaceId,
    messages,
    fileData,
  } = body as {
    workspaceId: string | null;
    userId: string;
    messages: Message[];
    fileData: FileData | null;
  };

  if (!messages.length) {
    return Response.json(
      {
        message: "No messages provided",
      },
      { status: 400 },
    );
  }

  /**
   * Arcjet protection
   */
  const arcjetReq = new Request(
    request.url,
    {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(body),
    },
  );

  const lastUserMessage =
    [...messages]
      .reverse()
      .find(
        (m) => m.role === "user",
      )?.content ?? "";

  const decision =
    await aj.protect(arcjetReq, {
      requested: 1,
      userId: clerkId,
      detectPromptInjectionMessage:
        lastUserMessage,
      sensitiveInfoValue:
        lastUserMessage,
    });

  if (decision.isDenied()) {
    return Response.json(
      {
        message:
          decision.reason?.type ??
          "Request Blocked",
      },
      { status: 429 },
    );
  }

  /**
   * Get authenticated user.
   */
  const user =
    await db.user.findUnique({
      where: {
        clerkId,
      },
      select: {
        id: true,
        credits: true,
      },
    });

  if (!user) {
    return Response.json(
      {
        message: "User Not Found",
      },
      { status: 404 },
    );
  }

  if (
    user.credits <
    CREDIT_COST_PER_GENERATION
  ) {
    return Response.json(
      {
        message:
          "Insufficient credits",
      },
      { status: 402 },
    );
  }

  /**
   * If editing an existing workspace,
   * verify that it belongs to the authenticated user.
   */
  if (workspaceId) {
    const workspace =
      await db.workspace.findFirst({
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
        {
          message:
            "Workspace Not Found",
        },
        { status: 404 },
      );
    }
  }

  const encoder = new TextEncoder();

  const stream =
    new ReadableStream({
      async start(controller) {
        const enqueue = (
          chunk: string,
        ) => {
          controller.enqueue(
            encoder.encode(chunk),
          );
        };

        /**
         * Track which model successfully generated the result.
         */
        let modelUsed =
          "gemini-3.5-flash";

        let fallbackUsed = false;

        try {
          const contents =
            buildContents(
              messages,
              fileData,
            );

          /**
           * ========================================
           * PRIMARY MODEL
           * gemini-3.5-flash
           * ========================================
           */
          enqueue(
            sseEvent("status", {
              message:
                "Starting Gemini 3.5 Flash...",
              model:
                "gemini-3.5-flash",
            }),
          );

          let accumulated = "";

          try {
            accumulated =
              await generateWithModel(
                "gemini-3.5-flash",
                contents,
                enqueue,
              );

            modelUsed =
              "gemini-3.5-flash";
          } catch (primaryError) {
            console.error(
              "[gen-ai-code] Primary model error:",
              primaryError,
            );

            /**
             * Only fallback when Gemini's quota
             * or rate limit has been reached.
             */
            if (
              !isGeminiQuotaError(
                primaryError,
              )
            ) {
              throw primaryError;
            }

            /**
             * ========================================
             * FALLBACK MODEL
             * gemini-3.5-flash-lite
             * ========================================
             */
            fallbackUsed = true;
            modelUsed =
              "gemini-3.5-flash-lite";

            enqueue(
              sseEvent("status", {
                message:
                  "Gemini 3.5 Flash limit reached. Switching to Gemini 3.5 Flash Lite...",
                model:
                  "gemini-3.5-flash-lite",
                fallback: true,
              }),
            );

            enqueue(
              sseEvent("thinking", {
                text:
                  "\n\n⚡ Flash limit reached. Switching to Flash Lite...",
              }),
            );

            try {
              /**
               * IMPORTANT:
               * We start a completely new generation
               * using the Lite model.
               *
               * This avoids continuing a broken stream.
               */
              accumulated =
                await generateWithModel(
                  "gemini-3.5-flash-lite",
                  contents,
                  enqueue,
                );
            } catch (fallbackError) {
              console.error(
                "[gen-ai-code] Fallback model error:",
                fallbackError,
              );

              throw fallbackError;
            }
          }

          /**
           * ========================================
           * PARSE AI RESPONSE
           * ========================================
           */
          let parsed: {
            assistantMessage: string;
            title?: string;
            files: Record<
              string,
              { code: string }
            >;
            dependencies: Record<
              string,
              string
            >;
          };

          try {
            parsed =
              JSON.parse(accumulated);
          } catch (error) {
            console.error(
              "[gen-ai-code] Invalid JSON:",
              error,
            );

            enqueue(
              sseEvent("error", {
                message:
                  "AI returned invalid JSON. Please try again.",
              }),
            );

            controller.close();
            return;
          }

          const {
            assistantMessage,
            title: aiTitle,
            files,
            dependencies,
          } = parsed;

          if (
            !files ||
            typeof files !==
              "object"
          ) {
            enqueue(
              sseEvent("error", {
                message:
                  "AI response missing files. Please try again.",
              }),
            );

            controller.close();
            return;
          }

          /**
           * ========================================
           * VALIDATE DEPENDENCIES
           * ========================================
           */
          enqueue(
            sseEvent("status", {
              message:
                "Validating Packages...",
            }),
          );

          const validatedDeps =
            await validateDependencies(
              dependencies ?? {},
            );

          const newFileData: FileData =
            {
              files,
              dependencies:
                validatedDeps,
              title: aiTitle,
            };

          /**
           * ========================================
           * SAVE TO DATABASE
           * ========================================
           */
          enqueue(
            sseEvent("status", {
              message: "Saving...",
            }),
          );

          const lastUserMsg =
            messages[
              messages.length - 1
            ];

          const updatedMessages: Message[] =
            [
              ...messages,
              {
                role: "assistant",
                content:
                  assistantMessage,
              },
            ];

          /**
           * IMPORTANT:
           * Use authenticated user.id,
           * NOT userId received from frontend.
           */
          const workspace =
            await db.$transaction(
              async (tx) => {
                const ws =
                  workspaceId
                    ? await tx.workspace.update(
                        {
                          where: {
                            id: workspaceId,
                            userId:
                              user.id,
                          },

                          data: {
                            messages:
                              updatedMessages as never,

                            fileData:
                              newFileData as never,
                          },
                        },
                      )
                    : await tx.workspace.create(
                        {
                          data: {
                            userId:
                              user.id,

                            title:
                              aiTitle ??
                              lastUserMsg.content.slice(
                                0,
                                80,
                              ),

                            messages:
                              updatedMessages as never,

                            fileData:
                              newFileData as never,
                          },
                        },
                      );

                /**
                 * Deduct exactly ONE credit
                 * after successful generation.
                 *
                 * Flash + fallback Lite still = ONE generation.
                 */
                await tx.user.update({
                  where: {
                    id: user.id,
                  },

                  data: {
                    credits: {
                      decrement:
                        CREDIT_COST_PER_GENERATION,
                    },
                  },
                });

                return ws;
              },
              {
                maxWait: 10000,
                timeout: 30000,
              },
            );

          /**
           * Get latest credits.
           */
          const updatedUser =
            await db.user.findUnique({
              where: {
                id: user.id,
              },

              select: {
                credits: true,
              },
            });

          /**
           * ========================================
           * COMPLETE
           * ========================================
           */
          enqueue(
            sseEvent("done", {
              workspaceId:
                workspace.id,

              assistantMessage,

              fileData:
                newFileData,

              creditsRemaining:
                updatedUser?.credits ??
                user.credits -
                  CREDIT_COST_PER_GENERATION,

              modelUsed,

              fallbackUsed,
            }),
          );
        } catch (error) {
          console.error(
            "[gen-ai-code] stream error:",
            error,
          );

          const errorMessage =
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.";

          enqueue(
            sseEvent("error", {
              message: errorMessage,
              modelUsed,
              fallbackUsed,
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

      Connection:
        "keep-alive",

      "X-Accel-Buffering":
        "no",
    },
  });
}

export const runtime = "nodejs";

export const maxDuration = 300;