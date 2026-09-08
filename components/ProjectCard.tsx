"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Trash2, MessageSquare, ArrowUpRight, FolderKanban } from "lucide-react";
import { ProjectSummary } from "@/types/projects";
import { DeleteProjectModal } from "./DeleteProjectModal";
import { motion, type Variants } from "motion/react";

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

interface ProjectCardProps {
  projects: ProjectSummary[];
}

export function ProjectCard({ projects }: ProjectCardProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, i) => {
        const title = project.title ?? "Untitled project";
        const timeAgo = formatDistanceToNow(new Date(project.updatedAt), {
          addSuffix: true,
        });
        const msgCount = Math.floor(project.messageCount / 2);

        return (
          <motion.div
            key={project.id}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-colors duration-300 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-950/10"
          >
            {/* Gradient accent on hover */}
            <motion.div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.4 }}
              style={{ originX: 0.5 }}
            />

            <Link
              href={`/workspace?id=${project.id}`}
              className="absolute inset-0 rounded-2xl"
              aria-label={`Open ${title}`}
            />

            {/* Top row */}
            <div className="mb-3 flex items-start justify-between gap-2">
              <motion.span
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 transition-colors duration-300 group-hover:border-emerald-500/40"
              >
                <FolderKanban className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </motion.span>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 transition-all duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                <DeleteProjectModal project={project}>
                  <span className="relative z-10 rounded-lg p-1.5 text-muted-foreground/40 transition-all hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                </DeleteProjectModal>
              </div>
            </div>

            {/* Title */}
            <p className="line-clamp-1 text-[15px] font-semibold tracking-tight text-foreground">
              {title}
            </p>

            {/* First prompt preview */}
            {project.firstPrompt && (
              <p className="mb-4 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground/70">
                {project.firstPrompt}
              </p>
            )}

            {/* Meta */}
            <div className="mt-auto flex items-center gap-3 border-t border-border/60 pt-3">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                <MessageSquare className="h-3 w-3" />
                {msgCount} message{msgCount !== 1 ? "s" : ""}
              </span>
              <span className="ml-auto text-[11px] text-muted-foreground/50">
                {timeAgo}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}