"use client";

import { motion } from "motion/react";

interface AnimatedGradientProps {
  className?: string;
  colorLeft?: string;
  colorRight?: string;
}

export function AnimatedGradient({
  className = "",
  colorLeft = "rgba(16, 185, 129, 0.22)",
  colorRight = "rgba(20, 184, 166, 0.22)",
}: AnimatedGradientProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <motion.div
        className="absolute -top-1/4 left-1/4 h-[600px] w-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${colorLeft}, transparent 70%)`,
          filter: "blur(60px)",
          willChange: "transform",
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, 30, -10, 0],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full"
        style={{
          background: `radial-gradient(ellipse, ${colorRight}, transparent 70%)`,
          filter: "blur(70px)",
          willChange: "transform, opacity",
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
