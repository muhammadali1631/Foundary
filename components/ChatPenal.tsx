"use client";

import { Message, StatusStep } from "@/types/workspace";
import React, { useEffect, useRef, useState } from "react";
import PricingModal from "./PricingModal";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import {
  ArrowUp,
  Check,
  Loader2,
  Paperclip,
  Sparkle,
  Square,
  Wand2,
  X,
  LayoutGrid,
} from "lucide-react";
import { Button } from "./ui/button";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
interface ChatPenalProps {
  messages: Message[];
  isGenerating: boolean;
  isImproving: boolean;
  statusLog: StatusStep[];
  credits: number;
  initialPrompt: string | null;
  onGenerate: (prompt: string, imageUrl?: string) => Promise<void>;
  userId: string;
  workspaceId: string | null;
  appTitle: string | null;
  onStop: () => void;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const ChatPenal = ({
  messages,
  isGenerating,
  isImproving,
  statusLog,
  credits,
  initialPrompt,
  onGenerate,
  userId,
  workspaceId,
  onStop,
  appTitle,
}: ChatPenalProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasAutoSubmittedRef = useRef(false);
  const { user } = useUser();

  const noCredits = credits <= 0;
  const canSubmit =
    input.trim().length > 0 && !isGenerating && !isImproving && !noCredits;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isGenerating, isImproving]);
  useEffect(() => {
    if (!initialPrompt || hasAutoSubmittedRef.current || messages.length > 0)
      return;
    hasAutoSubmittedRef.current = true;
    onGenerate(initialPrompt);
  }, []);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating || isImproving || noCredits) return;
    setInput("");
    setPendingImageUrl(null);
    await onGenerate(trimmed, pendingImageUrl ?? undefined);
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${workspaceId ?? "new"}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("workspace-images")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage
        .from("workspace-images")
        .getPublicUrl(path);
      setPendingImageUrl(data.publicUrl);
    } catch {
      // silent
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const lastMsg = messages[messages.length - 1];
  const isStreamingAssistant = isImproving && lastMsg?.role === "assistant";
  return (
    <div className="flex min-h-0 h-full w-full flex-col border-r border-border/60 bg-gradient-to-b from-secondary/20 to-background dark:from-background dark:to-background">
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-border/60 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20">
            <LayoutGrid className="h-3.5 w-3.5 text-white" />
          </span>
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
            {appTitle ?? "New Workspace"}
          </p>
        </div>
        <PricingModal reason={noCredits ? "credits" : "upgrade"}>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1   text-[11px] font-medium transition-colors",
              noCredits
                ? "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-500/15",
            )}
          >
            {noCredits
              ? "No credits • Upgrade"
              : `${credits} credit${credits !== 1 ? "s" : ""}`}
          </span>
        </PricingModal>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3.5 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20"
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && !isGenerating && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="flex h-full flex-col items-center justify-center gap-2 px-6"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
              >
                <Sparkle className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              </motion.div>
              <p className="text-center text-sm font-medium text-muted-foreground">
                Describe what you want to build
              </p>
              <p className="text-center text-xs leading-relaxed text-muted-foreground/50">
                Type a prompt below and let the AI turn it into a working app.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1;
              const isLiveStream = isLast && isStreamingAssistant;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {msg.role === "user" ? (
                    <div className="flex items-start justify-end gap-2">
                      <div className="max-w-[85%] space-y-1.5">
                        {msg.imageUrl && (
                          <motion.img
                            src={msg.imageUrl}
                            alt="uploaded"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="max-h-40 w-full rounded-xl border border-border/50 object-cover"
                          />
                        )}

                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className="rounded-2xl rounded-br-md bg-gradient-to-br from-emerald-600 to-teal-600 px-3.5 py-2.5 shadow-md shadow-emerald-500/20"
                        >
                          <p className="wrap-break-word text-[13px] leading-relaxed text-white">
                            {msg.content}
                          </p>
                        </motion.div>
                      </div>
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={user.fullName ?? "User"}
                          className="mt-0.5 h-6 w-6 shrink-0 rounded-full ring-2 ring-border"
                        />
                      ) : (
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground ring-2 ring-border">
                          {user?.firstName?.[0] ?? "U"}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Image
                        src={"/logo-short.png"}
                        alt="Foundary"
                        width={24}
                        height={24}
                        className="mt-0.5 h-6 w-6 shrink-0 rounded-lg ring-1 ring-border"
                      />
                      <div className="min-w-0 rounded-2xl rounded-tl-md border border-border/50 bg-card px-3.5 py-2.5 shadow-sm">
                        {isLiveStream && !msg.content ? (
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <Wand2 className="h-3 w-3 shrink-0 text-emerald-500 dark:text-emerald-400" />
                            </motion.div>
                            <span className="text-[12px] text-muted-foreground animate-pulse">
                              Cline is thinking...
                            </span>
                          </div>
                        ) : isLiveStream && msg.content ? (
                          <div>
                            <div className="mb-1.5 flex items-center gap-1.5">
                              <Wand2 className="h-3 w-3 shrink-0 text-emerald-500 dark:text-emerald-400" />
                              <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-500/70 dark:text-emerald-400/70">
                                Agent reasoning
                              </span>
                            </div>

                            <p className="text-[12px] leading-relaxed text-muted-foreground wrap-break-word">
                              {msg.content}
                              <span className="ml-0.5 inline-block h-3 w-0.5 animate-[blink_1s_ease-in-out_infinite] bg-emerald-500 align-middle dark:bg-emerald-400" />
                            </p>
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none text-[13px] leading-relaxed text-foreground/80 dark:prose-invert wrap-break-word [&_code]:rounded [&_code]:bg-emerald-500/10 [&_code]:px-1 [&_code]:text-emerald-600 [&_code]:text-xs dark:[&_code]:bg-emerald-400/10 dark:[&_code]:text-emerald-300 [&_li]:my-0.5 [&_p]:my-1 [&_ul]:my-1 ">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-2"
              >
                <Image
                  src="/logo-short.png"
                  alt="Foundary"
                  width={24}
                  height={24}
                  className="mt-0.5 h-6 w-6 shrink-0 rounded-lg ring-1 ring-border"
                />

                <div className="rounded-2xl rounded-tl-md border border-border/50 bg-card px-3.5 py-3 shadow-sm">
                  <div className="space-y-2">
                    <AnimatePresence>
                      {statusLog.map((step, i) => (
                        <motion.div
                          key={`${step.label}-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                          className="flex items-center gap-2.5"
                        >
                          <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                            {step.status === "running" ? (
                              <Loader2 className="h-3 w-3 animate-spin text-emerald-500 dark:text-emerald-400" />
                            ) : (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500/15"
                              >
                                <Check className="h-2 w-2 text-emerald-500 dark:text-emerald-400" />
                              </motion.span>
                            )}
                          </div>

                          <span
                            className={cn(
                              "text-[12px] transition-colors duration-300",
                              step.status === "running"
                                ? "text-foreground/80"
                                : "text-muted-foreground/50",
                            )}
                          >
                            {step.label}
                          </span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {noCredits && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="mx-3 mb-2 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3"
          >
            <p className="mb-2.5 text-[12px] font-medium text-destructive">
              You&apos;ve used all your credits
            </p>
            <PricingModal reason="credits">
              <motion.span
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-md shadow-emerald-500/25 transition-all hover:bg-primary/85"
              >
                <Sparkle className="h-3 w-3" />
                Upgrade plan
              </motion.span>
            </PricingModal>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t border-border/60 p-3">
        <AnimatePresence>
          {pendingImageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative mb-2 w-fit"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImageUrl}
                alt="pending"
                className="h-16 w-16 rounded-xl border border-border/50 object-cover"
              />

              <button
                onClick={() => setPendingImageUrl(null)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-background shadow-md transition-all hover:bg-foreground hover:scale-110"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className={cn(
            "rounded-xl border bg-card/80 transition-all duration-200",
            isGenerating || isImproving || noCredits
              ? "border-border/50 opacity-60"
              : "border-border/60 hover:border-emerald-500/40 focus-within:border-emerald-500/40 focus-within:shadow-lg focus-within:shadow-emerald-500/10",
          )}
          animate={
            isGenerating || isImproving || noCredits
              ? { scale: 1, opacity: 0.6 }
              : { scale: 1, opacity: 1 }
          }
          transition={{ duration: 0.3 }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating || isImproving || noCredits}
            placeholder={
              noCredits
                ? "Upgrade to keep building..."
                : isImproving
                  ? "Cline is improving your app..."
                  : isGenerating
                    ? "Generating..."
                    : "Ask AI to modify..."
            }
            className="w-full resize-none bg-transparent px-3.5 pb-2 pt-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            style={{ maxHeight: 160 }}
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileRef.current?.click()}
              disabled={isGenerating || isImproving || isUploading || noCredits}
              className={
                "h-8 w-8 rounded-lg text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-40"
              }
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Paperclip className="h-3.5 w-3.5" />
              )}
            </Button>

            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {isGenerating || isImproving ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={onStop}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background shadow-md transition-all hover:bg-foreground/80"
              >
                <Square className="h-3 w-3 fill-current" />
              </motion.button>
            ) : (
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  "h-8 w-8 rounded-lg transition-all",
                  canSubmit
                    ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95"
                    : "bg-muted text-muted-foreground/40 shadow-none",
                )}
              >
                {isGenerating || isImproving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </motion.div>

        <p className="mt-2 text-center text-[10px] text-muted-foreground/40">
          {isGenerating || isImproving
            ? "Click to stop generation."
            : "Press ⏎ Enter to send. Shift + ⏎ Enter for new line."}
        </p>
      </div>
    </div>
  );
};

export default ChatPenal;
