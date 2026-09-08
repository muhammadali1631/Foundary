"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.05 }}
      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-card/60 text-muted-foreground shadow-sm transition-colors duration-300 hover:border-emerald-500/40 hover:text-foreground hover:shadow-md hover:shadow-emerald-500/10 focus-visible:ring-4 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <motion.span
        key={isDark ? "moon" : "sun"}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute flex items-center justify-center"
      >
        {isDark ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </motion.span>
    </motion.button>
  );
}