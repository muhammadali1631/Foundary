import React from "react";

export const GrayTitle = ({ children }: { children: React.ReactNode }) => {
  return <span className="text-foreground">{children}</span>;
};

export const BlueTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={`font-heading bg-linear-to-r from-teal-600 via-emerald-500 to-cyan-600 bg-clip-text text-transparent dark:from-teal-400 dark:via-emerald-300 dark:to-cyan-400 ${className}`}
    >
      {children}
    </span>
  );
};

export const SectionLabel = ({ children }: { children: React.ReactNode }) => {
  return (
    <span className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-emerald-700 uppercase dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
      {children}
    </span>
  );
};

export const SectionHeading = ({
  gray,
  blue,
}: {
  gray: string;
  blue: string;
}) => {
  return (
    <h2 className="font-heading mt-3 text-[clamp(2.25rem,4.5vw,3.25rem)] leading-[1.08] tracking-tight">
      <GrayTitle>{gray}</GrayTitle>
      <br />
      <BlueTitle>{blue}</BlueTitle>
    </h2>
  );
};