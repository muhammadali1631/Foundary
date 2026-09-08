"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/actions/projects";
import { ProjectSummary } from "@/types/projects";
import { motion } from "motion/react";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DeleteProjectModalProps {
  project: ProjectSummary;
  children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeleteProjectModal({
  project,
  children,
}: DeleteProjectModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteProject(project.id);
        toast.success("Project deleted.");
        router.refresh();
      } catch {
        toast.error("Failed to delete project. Please try again.");
      }
    });
  };

  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer">{children}</DialogTrigger>
      <DialogContent className="border-border/60 bg-background/95 text-foreground sm:max-w-sm backdrop-blur-2xl">
        <DialogHeader className="flex flex-col items-center gap-3 text-center sm:items-center">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10"
          >
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </motion.span>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-base font-semibold text-foreground">
              Delete project?
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              &ldquo;{project.title ?? "Untitled project"}&rdquo; will be
              permanently deleted. This cannot be undone.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <DialogClose>
            <span className="flex h-9 items-center rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground">
              Cancel
            </span>
          </DialogClose>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="h-9 rounded-xl bg-destructive px-5 text-[13px] font-semibold text-destructive-foreground shadow-md shadow-destructive/20 hover:bg-destructive/90 disabled:opacity-50"
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Delete
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}