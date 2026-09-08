"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BlueTitle,
  GrayTitle,
  SectionHeading,
  SectionLabel,
} from "@/components/reusable";
import { cn } from "@/lib/utils";
import { PricingTable, SignInButton, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FEATURES, PLACEHOLDERS, STEPS, SUGGESTIONS } from "@/lib/data";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Flame,
  Mail,
  MessageSquare,
  Sparkles,
  Star,
  Terminal,
} from "lucide-react";
import { FiGithub, FiLinkedin, FiTwitter } from "react-icons/fi";
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  MotionReveal,
  staggerContainer,
  fadeUp,
  scaleIn,
} from "@/components/motion-primitives";
import { EmberBackground } from "@/components/EmberBackground";
import { AnimatedGradient } from "@/components/AnimatedGradient";

const CONSOLE_LINES = [
  "> foundary create kanban-board",
  "  ✓ scaffolding React Vite app…",
  "  ✓ installing @dnd-kit/core…",
  "  ✓ building 3 columns…",
  "  ✓ rendering live preview…",
];

function Stat({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) =>
    v.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );

  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, value, spring]);

  return (
    <span ref={ref} className="inline-flex items-baseline gap-1">
      <span className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
        <MotionValueText value={display} />
      </span>
      <span className="text-base font-semibold text-primary">{suffix}</span>
    </span>
  );
}

function MotionValueText({ value }: { value: MotionValue<string> }) {
  return <motion.span>{value}</motion.span>;
}

export default function Home() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  useEffect(() => {
    if (isFocused || prompt) return;
    const t = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);

    return () => {
      clearInterval(t);
    };
  }, [isFocused, prompt]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [prompt]);

  const handleSubmit = () => {
    if (!prompt.trim() || !isSignedIn) return;
    router.push(`/workspace?prompt=${encodeURIComponent(prompt.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (s: string) => {
    setPrompt(s);
    textareaRef.current?.focus();
  };

  return (
    <main className="relative min-h-screen overflow-x-clip bg-background">
      {/* ══ Hero — split editorial ═══════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden px-4 pt-32 pb-16 sm:px-6 sm:pt-40"
      >
        {/* Background layers */}
        <AnimatedGradient className="absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.07)_1px,transparent_1px)] bg-[size:44px_44px]"
          style={{
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)",
          }}
        />
        <EmberBackground className="opacity-40" density={36} />

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2 lg:gap-10"
        >
          {/* ── Left: copy ── */}
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Badge
                variant="outline"
                className="glass-surface mb-7 gap-2 rounded-full px-4 py-1.5 text-[12px] font-medium shadow-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Powered by Gemini 3.5 Flash
                <Sparkles className="h-3 w-3 text-teal-500 dark:text-teal-400" />
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 32, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.8,
                delay: 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-heading text-left text-4xl leading-[1.02] font-bold tracking-tight text-balance sm:text-6xl xl:text-7xl"
            >
              <GrayTitle>Turn a prompt</GrayTitle>
              <br />
              <BlueTitle>into a living app</BlueTitle>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 w-[80%] sm:w-auto max-w-lg text-left text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Describe what you want to build. AI writes the code, picks the
              packages, and renders a live preview — all inside your browser.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <a href="#composer">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button size="lg" className="h-12 gap-2 rounded-xl px-4 sm:px-7 shadow-xl shadow-emerald-600/25">
                    Start building
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </a>
              <a href="#features">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 gap-2 rounded-xl px-4 sm:px-7"
                  >
                    See how it works
                    <ChevronRight className="h-4 w-4 opacity-60" />
                  </Button>
                </motion.div>
              </a>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5 text-[13px] font-medium text-muted-foreground"
            >
              {[
                "No credit card required",
                "10 free generations",
                "Signed in with Clerk",
              ].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  {t}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* ── Right: animate console ── */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative sm:mx-auto w-[85%] sm:w-full max-w-lg"
            style={{ perspective: 1400 }}
          >
            <motion.div
              className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-emerald-500/25 via-teal-400/20 to-cyan-500/25 blur-3xl sm:-inset-8"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
              whileHover={{ rotateY: 0, rotateX: 0 }}
              initial={{ rotateY: -10, rotateX: 4 }}
              animate={{ rotateY: -8, rotateX: 3 }}
              transition={{ type: "spring", stiffness: 60, damping: 16 }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl"
            >
              {/* Window chrome */}
              <div className="flex items-center gap-3 border-b border-border/50 bg-background/50 px-5 py-3.5">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                </div>
                <div className="mx-auto flex h-7 w-56 items-center justify-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-3">
                  <Terminal className="h-3 w-3 text-emerald-500" />
                  <span className="text-[11px] tracking-wide text-muted-foreground">
                    foundary.aurahub.dev
                  </span>
                </div>
                <div className="w-14" />
              </div>

              <div className="space-y-4 p-6">
                {/* Console lines */}
                <div className="rounded-xl border border-border/40 bg-black/40 p-4 font-mono text-[11px] leading-loose sm:text-xs">
                  {CONSOLE_LINES.map((line, i) =>
                    line.startsWith(">") ? (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.45, duration: 0.35 }}
                        className="text-emerald-400"
                      >
                        {line}
                        <motion.span
                          className="ml-1 inline-block h-3.5 w-[7px] translate-y-[2px] bg-emerald-400"
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: 2.8,
                          }}
                        />
                      </motion.p>
                    ) : (
                      <motion.p
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.65 + i * 0.45, duration: 0.35 }}
                        className="text-sky-300"
                      >
                        {line}
                      </motion.p>
                    )
                  )}
                </div>

                {/* Render widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.6, duration: 0.6 }}
                  className="rounded-xl border border-border/40 bg-background/60 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold tracking-tight">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600">
                        <Flame className="h-3 w-3 fill-white text-white" />
                      </span>
                      Live preview
                    </span>
                    <Badge
                      variant="outline"
                      className="h-5 border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      Running
                    </Badge>
                  </div>

                  {/* mini kanban */}
                  <div className="flex gap-2.5">
                    {[
                      { title: "Todo", cards: 3, color: "text-muted-foreground" },
                      { title: "In progress", cards: 2, color: "text-emerald-600 dark:text-emerald-400" },
                      { title: "Done", cards: 3, color: "text-emerald-600 dark:text-emerald-400" },
                    ].map((col, ci) => (
                      <div
                        key={col.title}
                        className="flex-1 rounded-lg border border-border/40 bg-card/60 p-2"
                      >
                        <span
                          className={cn(
                            "mb-2 block text-center text-[9px] font-semibold tracking-wider uppercase",
                            col.color
                          )}
                        >
                          {col.title}
                        </span>
                        {Array.from({ length: col.cards }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: 2.7 + ci * 0.2 + i * 0.12,
                              duration: 0.35,
                            }}
                            className="mb-1.5 h-2.5 rounded bg-muted-foreground/20"
                            style={{ width: `${65 + (i % 3) * 10}%` }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Status list */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3.2, duration: 0.5 }}
                  className="flex flex-wrap gap-2"
                >
                  {["Clerk auth added", "Sandpack ready", "Deployable"].map(
                    (t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                      >
                        <Check className="h-3 w-3" />
                        {t}
                      </span>
                    )
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* Floating chips */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
              transition={{ delay: 2.8, duration: 0.5 }}
              className="absolute -top-4 -right-2 rounded-2xl border border-border/60 bg-card/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:-right-6"
            >
              <p className="text-[11px] font-semibold text-foreground">
                First build
              </p>
              <p className="font-heading text-xl font-bold text-emerald-600 dark:text-emerald-400">
                27s
              </p>
            </motion.div>
            {/* <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 3.1, duration: 0.5 }}
              className="absolute -bottom-4 -left-2 flex items-center gap-2 rounded-2xl border border-border/60 bg-card/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:-left-6"
            >
              <div className="flex -space-x-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-5 w-5 rounded-full border-2 border-card bg-gradient-to-br from-emerald-400 to-teal-600"
                  />
                ))}
              </div>
              <p className="text-[11px] font-semibold text-foreground">
                10k+ apps
              </p>
            </motion.div> */}
          </motion.div>
        </motion.div>
      </section>

      {/* ══ Stats band ═══════════════════════════════════════════════════ */}
      {/* <section className="px-4 sm:px-6">
        <MotionReveal
          variants={scaleIn}
          className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl"
        >
          <AnimatedGradient className="opacity-40" />
          <div className="relative z-10 grid grid-cols-2 divide-x divide-border/50 lg:grid-cols-4">
            {(
              [
                { label: "Apps generated", value: 10000, suffix: "+" },
                { label: "Avg. time to live", value: 30, suffix: "s" },
                { label: "Browsers supported", value: 99, suffix: "%" },
                { label: "Builder rating", value: 4.9, suffix: "★", decimals: 1 },
              ] as { label: string; value: number; suffix: string; decimals?: number }[]
            ).map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 px-6 py-8 text-center">
                <Stat value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </MotionReveal>
      </section> */}

      {/* ══ Prompt composer ═════════════════════════════════════════════ */}
      <section id="composer" className="relative scroll-mt-24 px-4 py-24 sm:px-6">
        <div className="relative mx-auto max-w-6xl">
          <AnimatedGradient className="opacity-30" />
          <div
            className="relative z-10 overflow-hidden rounded-[2rem] border border-border/60 bg-card/70 p-3 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl sm:p-4"
          >
            <motion.div
              className={cn(
                "rounded-[1.6rem] border transition-all duration-300",
                isFocused
                  ? "border-emerald-500/60 glow-primary"
                  : "border-transparent"
              )}
              whileHover={{ scale: 1.005 }}
              animate={isFocused ? { scale: 1.005 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="w-full resize-none bg-transparent px-6 pt-6 pb-4 text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none sm:text-lg"
                style={{ minHeight: 64, maxHeight: 200 }}
                placeholder={PLACEHOLDERS[placeholderIndex]}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-5">
                <span className="hidden items-center gap-2 text-xs text-muted-foreground/60 sm:flex">
                  Press{" "}
                  <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-sans text-[10px]">
                    ⏎
                  </kbd>{" "}
                  to generate ·{" "}
                  <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-sans text-[10px]">
                    Shift
                  </kbd>
                  +{" "}
                  <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-sans text-[10px]">
                    ⏎
                  </kbd>{" "}
                  new line
                </span>

                {isSignedIn ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!prompt.trim()}
                    className={cn(
                      "gap-2 rounded-xl px-6 transition-all",
                      prompt.trim()
                        ? "shadow-lg shadow-emerald-600/25"
                        : "bg-secondary text-muted-foreground",
                    )}
                    variant={prompt.trim() ? "default" : "secondary"}
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate my app
                    <ArrowRight className="h-4 w-4 opacity-70" />
                  </Button>
                ) : (
                  <SignInButton mode="modal">
                    <Button className="gap-2 rounded-xl px-6 shadow-lg shadow-emerald-600/25">
                      Generate my app
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </SignInButton>
                )}
              </div>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap items-center gap-2 px-4 pb-4"
            >
              <span className="mr-1 text-[11px] font-semibold tracking-wide text-muted-foreground/60 uppercase">
                Try one:
              </span>
              {SUGGESTIONS.map((s) => (
                <motion.button
                  key={s}
                  variants={fadeUp}
                  onClick={() => handleSuggestion(s)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-full border border-border/60 bg-background/60 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-colors duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-foreground focus-visible:ring-4 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
                >
                  {s}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ Features — bento ════════════════════════════════════════════ */}
      <section id="features" className="relative scroll-mt-20 px-4 pb-24 sm:px-6">
        <div className="mx-auto mb-16 max-w-5xl text-center">
          <MotionReveal>
            <SectionLabel>Everything you need</SectionLabel>
            <SectionHeading gray="From prompt" blue="to production" />
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground/80">
              A full build pipeline in the browser — scaffold, generate, preview,
              iterate.
            </p>
          </MotionReveal>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="mx-auto grid max-w-7xl grid-cols-1 gap-5 md:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-border/50 bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/10",
                i === 0 && "md:col-span-2",
                i === 1 && "md:row-span-2 bg-gradient-to-br from-emerald-500/[0.07] to-card"
              )}
            >
              {/* Hover gradient wash */}
              <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex h-full flex-col gap-4 p-8">
                <motion.div
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
                  whileHover={{ rotate: 5, scale: 1.06 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </motion.div>

                <div className="flex flex-1 flex-col">
                  <p className="font-heading mb-2 text-lg font-semibold tracking-tight text-foreground">
                    {label}
                  </p>
                  <p
                    className={cn(
                      "text-sm leading-relaxed text-muted-foreground",
                      i === 0 && "max-w-xl"
                    )}
                  >
                    {desc}
                  </p>
                </div>

                {i === 0 && (
                  <div className="pointer-events-none mt-2 flex flex-wrap gap-2">
                    {["React", "Tailwind", "Prisma", "Supabase", "Next.js"].map(
                      (t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-medium text-muted-foreground"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {t}
                        </span>
                      )
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══ How it works — timeline ══════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="relative scroll-mt-20 border-y border-border/40 bg-gradient-to-b from-transparent via-emerald-500/[0.03] to-transparent px-4 py-24 sm:px-6"
      >
        <div className="mx-auto mb-16 max-w-5xl text-center">
          <MotionReveal>
            <SectionLabel>How it works</SectionLabel>
            <SectionHeading gray="Four steps" blue="to a working app" />
          </MotionReveal>
        </div>

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-9 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-teal-500/0 lg:block"
          />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <MotionReveal key={step.number} variants={fadeUp} delay={i * 0.12}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="group relative flex h-full flex-col items-center text-center"
                >
                  <motion.span
                    className="relative z-10 mb-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-emerald-500/25 bg-background shadow-lg shadow-emerald-950/10"
                    whileHover={{ rotate: 6, scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <span className="font-heading text-2xl font-bold text-gradient">
                      {step.number}
                    </span>
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                  </motion.span>

                  <p className="font-heading mb-2 text-lg font-semibold tracking-tight">
                    {step.label}
                  </p>
                  <p className="max-w-[260px] text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                </motion.div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Pricing ═════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="mx-auto mb-16 max-w-5xl text-center">
          <MotionReveal>
            <SectionLabel>Simple pricing</SectionLabel>
            <SectionHeading gray="Start free" blue="scale when ready" />
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground/80">
              No credit card required. Upgrade or downgrade anytime.
            </p>
          </MotionReveal>
        </div>

        <MotionReveal variants={scaleIn} className="mx-auto max-w-5xl">
          <PricingTable
            checkoutProps={{
              appearance: {
                elements: {
                  drawerRoot: {
                    zIndex: 2000,
                  },
                },
              },
            }}
          />
        </MotionReveal>
      </section>

      {/* ══ CTA ═════════════════════════════════════════════════════════ */}
      <section className="px-4 pb-24 sm:px-6">
        <MotionReveal variants={scaleIn} className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-500/25 bg-gradient-to-br from-emerald-600/15 via-background to-teal-600/15 px-10 py-20 text-center">
            <AnimatedGradient className="opacity-70" />
            <EmberBackground className="opacity-30" density={30} />

            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.07, type: "spring", stiffness: 260, damping: 16 }}
                    className="text-lg text-amber-500"
                  >
                    <Star className="h-5 w-5 fill-amber-500" />
                  </motion.span>
                ))}
                {/* <span className="ml-2 text-xs font-medium text-muted-foreground">
                  Join 10,000+ builders
                </span> */}
              </div>

              <SectionHeading gray="Your next app is" blue="one prompt away" />

              <p className="mx-auto mb-10 mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
                Get 10 free generations on sign up. No credit card required.
                <br />
                Upgrade when you&apos;re ready.
              </p>

                  {isSignedIn ? 
              <SignInButton mode="modal">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    size="lg"
                    className="h-12 rounded-xl px-8 shadow-xl shadow-emerald-600/30 transition-all hover:shadow-2xl hover:shadow-emerald-600/40"
                  >
                    Get started free
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </SignInButton> : <a href="#composer">
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Button size="lg" className="h-12 gap-2 rounded-xl px-4 sm:px-7 shadow-xl shadow-emerald-600/25">
                    Start building
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </a>}
            </div>
          </div>
        </MotionReveal>
      </section>

      {/* ══ Footer ══════════════════════════════════════════════════════ */}
      <footer className="border-t border-border/50 bg-card/40">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-heading text-lg font-bold tracking-tight">
                Foundary
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Turn a single prompt into a fully working app — generated, previewed,
              and deployable straight from your browser.
            </p>
            <div className="mt-6 flex gap-2">
              {[{icon:FiGithub, link: 'https://github.com/muhammadali1631'}, {icon:FiTwitter, link: "https://x.com/Alishahzad2000M"}, {icon:FiLinkedin, link: "https://www.linkedin.com/in/ali-web-dev/"}, {icon:Mail, link: "mailto:m.alishahzad2004@gmail.com"}].map((Icon, i) => (
                <a
                  key={Icon.link}
                  href={Icon.link}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-foreground"
                >
                  <Icon.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title: "Product",
              links: ["Features", "How it works", "Pricing"],
            },
            // {
            //   title: "Resources",
            //   links: ["Documentation", "API reference", "Status", "Community"],
            // },
            // {
            //   title: "Company",
            //   links: ["About", "Blog", "Careers", "Contact"],
            // },
          ].map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href={`#${l.toLowerCase().replaceAll(" ", "-")}`}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/40 px-6 py-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Foundary. All rights reserved.</span>
            <span className="flex items-center gap-1.5">
              Built with <span className="text-red-500">♥</span> by Ali,
              powered by Gemini &amp; Clerk
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
              m.alishahzad2004@gmail.com
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}