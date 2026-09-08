import { ArrowLeft, Compass, Home } from "lucide-react";
import Link from "next/link";
import { AnimatedGradient } from "@/components/AnimatedGradient";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <AnimatedGradient className="opacity-50" />

      <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-emerald-700 uppercase dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          Error 404
        </p>

        <h1 className="font-heading bg-linear-to-r from-teal-600 via-emerald-500 to-cyan-600 bg-clip-text text-[clamp(5rem,16vw,10rem)] leading-none font-bold tracking-tighter text-transparent dark:from-teal-400 dark:via-emerald-300 dark:to-cyan-400">
          404
        </h1>

        <h2 className="font-heading mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          This page got lost in the foundary
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist, was moved, or is
          still being forged by the furnace.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="group inline-flex h-11 items-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-6 text-[13px] font-semibold text-white shadow-md shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-95"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
          <Link
            href="/projects"
            className="group inline-flex h-11 items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-6 text-[13px] font-semibold text-foreground backdrop-blur-xl transition-all hover:border-emerald-500/40 hover:bg-card active:scale-95"
          >
            <Compass className="h-4 w-4 text-emerald-500" />
            Go to projects
          </Link>
        </div>

        <Link
          href="/"
          className="group mt-10 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Take me somewhere safe
        </Link>
      </div>
    </main>
  );
}