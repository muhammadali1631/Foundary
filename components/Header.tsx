import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ArrowRight, Zap, LayoutGrid } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import PricingModal from "./PricingModal";
import { checkUser } from "@/lib/checkUser";
import { ThemeToggle } from "./ThemeToggle";
import { HeaderMobileMenu } from "./HeaderMobileMenu";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
];

const Header = async () => {
  const user = await checkUser();

  return (
    <header className="fixed top-0 left-0 z-50 h-16 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent" />
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href={"/"} className="group flex items-center gap-3">
          <span className="flex items-baseline gap-2">
            <span className="font-heading text-lg font-bold tracking-tight text-foreground">
              Foundary
            </span>
            <span className="hidden text-[10px] font-semibold tracking-[0.2em] text-primary uppercase sm:inline">
              AI App Builder
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="group relative text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <div className="hidden items-center gap-2.5 md:flex">
            <Show when="signed-in">
              <Link
                href={"/projects"}
                className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-[13px] font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-foreground focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:outline-none"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Projects
              </Link>

              {user && (
                <PricingModal>
                  <span className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 text-[13px] font-semibold text-emerald-700 transition-all dark:text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/15 active:scale-95">
                    <Zap className="h-3.5 w-3.5 fill-emerald-500 text-emerald-500 dark:fill-emerald-300 dark:text-emerald-300" />
                    {user.credits} credits
                  </span>
                </PricingModal>
              )}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "size-9 rounded-full border-2 border-emerald-500/40 shadow-sm hover:border-emerald-500 transition-all",
                  },
                }}
              />
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="px-5">
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </SignUpButton>
            </Show>
          </div>

          <HeaderMobileMenu credits={user?.credits} />
        </div>
      </nav>
    </header>
  );
};

export default Header;