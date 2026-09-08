"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CodePenal } from "./CodePenal";
import { FileData, Message, StatusStep, WorkspaceData } from "@/types/workspace";
import ChatPenal from "./ChatPenal";
import { MIN_CREDITS_TO_GENERATE } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LayoutGrid, MessageSquare } from "lucide-react";

interface WorkspaceClientProps {
  initialPrompt: string | null;
  userCredits: number;
  userId: string;
  userPlan: string;
  workspace: WorkspaceData | null;
}

function parseMesssages(raw: unknown): Message[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter(
    (m): m is Message =>
      typeof m === "object" && m !== null && "role" in m && "content" in m,
  );
}

function parseFileData(raw:unknown): FileData | null {
  if(!raw || typeof raw !== "object") return null;

  const f = raw as Record<string, string>

  if(!f.files || !f.dependencies) return null;

  return raw as FileData
} 

const WorkspaceClient = ({
  initialPrompt,
  userCredits,
  userId,
  workspace,
  userPlan,
}: WorkspaceClientProps) => {
  const [workspaceId, setWorkspaceId] = useState<string | null>(workspace?.id ?? null);
  const [fileData, setFileData] = useState<FileData | null>(parseFileData(workspace?.fileData));
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusLog, setStatusLog] = useState<StatusStep[]>([]);
  const [messages, setMessages] = useState<Message[]>(parseMesssages(workspace?.messages));
  const [credits, setCredits] = useState(userCredits);
  const [isImproving, setIsImproving] = useState(false)
  const [activeView, setActiveView] = useState<"chat" | "web">("chat");

  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const fileDataRef = useRef<FileData | null>(fileData);

  useEffect(() => {
    fileDataRef.current = fileData;
  }, [fileData]);

  const workspaceIdRef = useRef<string | null>(workspaceId);

  useEffect(() => {
    workspaceIdRef.current = workspaceId;
  }, [workspaceId]);

  const generateAbortRef = useRef<AbortController | null>(null)
  const improveAbortRef = useRef<AbortController | null>(null)

  const handleFilePatch = useCallback((patches: FileData) => {
    setFileData(patches);
  }, []);

  const pushStep = (label: string) => {
    setStatusLog((prev) => [
      ...prev.map((s, i) =>
        i === prev.length - 1 ? { ...s, status: "done" as const } : s,
      ),
      { label, status: "running" as const },
    ]);
  };

  const completeSteps = () => {
    setStatusLog((prev) =>
      prev.map((s, i) =>
        i === prev.length - 1 ? { ...s, status: "done" as const } : s,
      ),
    );
  };

  const handleImprove = useCallback(
    async (userRequest:string) => {
      if(isGenerating || isImproving)return;
      if(credits<MIN_CREDITS_TO_GENERATE) return;
      if(!workspaceIdRef.current)return;

      const currentFileData = fileDataRef.current;
      if(!currentFileData) return;

      setIsImproving(true);

      setMessages((prev)=>[
        ...prev,
        {role:"user", content: userRequest},
        {role:"assistant", content:""}
      ])

      const abortController = new AbortController();
      improveAbortRef.current = abortController;

      try {
        const res = await fetch("/api/improve",{
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            userId,
            workspaceId: workspaceIdRef.current,
            userRequest,
            fileData: currentFileData,
          })
        })

        if(res.status === 403){
          toast.error("Upgrade to Starter or Pro to use Improve with AI.");
          setMessages((prev)=>prev.slice(0, -2))
          return;
        }
        if(res.status === 402){
          toast.error("Not enough credits.")
          setMessages((prev)=> prev.slice(0, -2));
          return;
        }
        if(!res.ok || !res.body) throw new Error("Improve failed")
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedThinking = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            let event: { type: string; [key: string]: unknown };
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (event.type === "thinking") {
              accumulatedThinking += event.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: accumulatedThinking,
                };
                return updated;
              });
            } else if (event.type === "done") {
              setFileData(event.fileData as FileData);
              setCredits(event.creditsRemaining as number);

              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: event.summary as string,
                };
                return updated;
              });
            } else if (event.type === "error") {
              throw new Error(event.message as string);
            }
          }
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Improving failed.");
        setMessages((prev) => prev.slice(0, -2));
      } finally {
        setIsImproving(false);
        improveAbortRef.current = null;
      }
    },
    [credits, isGenerating, isImproving, userId]
  )

  const handleGenerate = useCallback(
    async (prompt: string, imageUrl?: string) => {
      if (isGenerating) return;
      if (credits < MIN_CREDITS_TO_GENERATE) return;
      const userMessage: Message = {
        role: "user",
        content: prompt,
        ...(imageUrl ? { imageUrl } : {}),
      };

      const currentMessages = messagesRef.current;
      const currentWorkspaceId = workspaceIdRef.current;

      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);
      setStatusLog([{ label: "Thinking", status: "running" }]);

      const abortController = new AbortController();
      generateAbortRef.current = abortController;

      try {
        const res = await fetch("/api/gen-ai-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
          body: JSON.stringify({
            workspaceId: currentWorkspaceId,
            userId,
            messages: [...currentMessages, userMessage],
            fileData: fileDataRef.current,
          }),
        });

        if (res.status === 402) {
          toast.error("Not enough credits.");
          setMessages((prev) => prev.slice(0, -1));
          return;
        }

        if (res.status === 429) {
          toast.error("Too many requests. Please slow down.");
          setMessages((prev) => prev.slice(0, -1));
          return;
        }

        if (!res.ok || !res.body) {
          throw new Error("Generation failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              // Strip the "data:" prefix (6 characters) and parse the JSON payload
              const event = JSON.parse(line.slice(6));

              if (event.type === "status") {
                // Gemini thought label adds a new step to the status log
                // e.g. "Designing layout", "Adding interactivity"
                pushStep(event.message);
              } else if (event.type === "done") {
                completeSteps();

                setWorkspaceId(event.workspaceId);
                setFileData(event.fileData);
                setCredits(event.creditsRemaining);

                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: event.assistantMessage,
                  },
                ]);

                window.history.replaceState(
                  null,
                  "",
                  `/workspace?id=${event.workspaceId}`,
                );
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (error) {}
          }
        }
      } catch (err) {
        if(err instanceof Error && err.name === "AbortError"){
          setMessages((prev)=>prev.slice(0, -1));
          return;
        }
        toast.error(
          err instanceof Error ? err.message : "Something went wrong",
        );
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        generateAbortRef.current = null;
        setIsGenerating(false);
        setStatusLog([]);
      }
    },
    [credits, isGenerating, userId],
  );

  const handleStop = useCallback(()=>{
    generateAbortRef.current?.abort();
    improveAbortRef.current?.abort();
  },[])
  return (
    <div
      data-lenis-prevent
      className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background md:flex-row"
    >
      {/* Mobile view switcher */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border/60 bg-card/80 p-1.5 backdrop-blur-md md:hidden">
        <button
          onClick={() => setActiveView("chat")}
          className={cn(
            "flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition-colors",
            activeView === "chat"
              ? "bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </button>
        <button
          onClick={() => setActiveView("web")}
          className={cn(
            "flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition-colors",
            activeView === "web"
              ? "bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Web
        </button>
      </div>

      {/* Chat panel */}
      <div
        className={cn(
          "min-h-0 flex-1 flex-col",
          activeView === "chat" ? "flex" : "hidden",
          "md:flex md:w-[320px] md:flex-none md:shrink-0",
        )}
      >
        <ChatPenal
          messages={messages}
          isGenerating={isGenerating}
          isImproving={isImproving}
          statusLog={statusLog}
          credits={credits}
          initialPrompt={initialPrompt}
          onGenerate={handleGenerate}
          userId={userId}
          workspaceId={workspaceId}
          appTitle={fileData?.title ?? workspace?.title ?? null}
          onStop={handleStop}
        />
      </div>

      {/* Code/Web panel */}
      <div
        className={cn(
          "min-h-0 flex-1 flex-col",
          activeView === "web" ? "flex" : "hidden",
          "md:flex",
        )}
      >
        <CodePenal
          isImproving={isImproving}
          fileData={fileData}
          isGenerating={isGenerating}
          statusLog={statusLog}
          onFilePatch={handleFilePatch}
          onFixError={(error) => handleGenerate(`There is an error in the preview:\n\n\`\`\`\n${error}\n\`\`\`\n\nPlease fix it.`)}
          isProUser={userPlan === "pro"}
          appTitle={fileData?.title ?? workspace?.title ?? null}
          onImprove={handleImprove}
        />
      </div>
    </div>
  );
};

export default WorkspaceClient;
