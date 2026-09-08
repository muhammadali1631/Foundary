"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, LayoutGrid, Menu, X, Zap } from "lucide-react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./ui/button";
import PricingModal from "./PricingModal";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
];

export function HeaderMobileMenu({ credits }: { credits?: number }) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/60 text-muted-foreground shadow-sm transition-colors duration-200 hover:text-foreground md:hidden"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="fixed inset-0 z-40 md:hidden"
              onClick={close}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-3 top-[4.25rem] z-50 overflow-hidden rounded-2xl border border-border/60 bg-card/95 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl md:hidden"
            >
              <nav className="flex flex-col">
                {NAV_LINKS.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={close}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-primary/10 hover:text-foreground"
                  >
                    {label}
                  </Link>
                ))}
              </nav>

              <div className="my-2 h-px bg-border/60" />

              <Show when="signed-in">
                <Link
                  href={"/projects"}
                  onClick={close}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-primary/10 hover:text-foreground"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Projects
                </Link>

                {credits !== undefined && (
                  <div className="px-2 py-1.5">
                    <PricingModal>
                      <span className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 text-[13px] font-semibold text-emerald-700 transition-all dark:text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/15">
                        <Zap className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500 dark:fill-emerald-300 dark:text-emerald-300" />
                        {credits} credits
                      </span>
                    </PricingModal>
                  </div>
                )}

                <div className="flex items-center justify-between px-3 py-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Account
                  </span>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox:
                          "size-9 rounded-full border-2 border-emerald-500/40 shadow-sm",
                      },
                    }}
                  />
                </div>
              </Show>

              <Show when="signed-out">
                <div className="flex flex-col gap-2 px-2 py-2">
                  <SignInButton mode="modal">
                    <Button
                      variant="outline"
                      className="h-10 w-full justify-center rounded-xl text-sm"
                      onClick={close}
                    >
                      Sign in
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button
                      className="h-10 w-full justify-center rounded-xl text-sm"
                      onClick={close}
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4 opacity-60" />
                    </Button>
                  </SignUpButton>
                </div>
              </Show>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}