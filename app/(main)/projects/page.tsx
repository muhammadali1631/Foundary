import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight, FolderKanban, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BlueTitle } from "@/components/reusable";
import { getUserProjects } from "@/actions/projects";
import { ProjectCard } from "@/components/ProjectCard";
import { AnimatedGradient } from "@/components/AnimatedGradient";

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-28 text-center">
      <div className="relative mb-7">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-emerald-500/20 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
          <FolderKanban className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
      <p className="font-heading mb-1.5 text-lg font-semibold tracking-tight text-foreground">
        No projects yet
      </p>
      <p className="mb-8 max-w-xs text-sm leading-relaxed text-muted-foreground">
        Head to the homepage and describe what you want to build.
      </p>
      <Link
        href="/"
        className="group inline-flex h-10 items-center gap-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 px-6 text-[13px] font-semibold text-white shadow-md shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-95"
      >
        <Zap className="h-3.5 w-3.5" />
        Start building
        <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const projects = await getUserProjects();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background px-4 py-12 sm:py-16">
      <AnimatedGradient className="opacity-40" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-[11px] font-semibold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
              Your builds
            </p>
            <BlueTitle className="text-4xl sm:text-5xl">Projects</BlueTitle>
            <p className="mt-3 text-sm text-muted-foreground">
              All your AI-generated apps in one place.
            </p>
          </div>
          <Link href="/" className="shrink-0">
            <Button className="gap-2 px-5">
              <Zap className="h-3.5 w-3.5 fill-white text-white" />
              New project
            </Button>
          </Link>
        </div>

        {/* Grid */}
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <ProjectCard projects={projects} />
        )}
      </div>
    </main>
  );
}