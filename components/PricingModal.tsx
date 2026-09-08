import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BlueTitle } from "./reusable";
import { PricingTable } from "@clerk/nextjs";

interface PricingModalProps {
  children: React.ReactNode;
  reason?: "credits" | "upgrade";
}

const PricingModal = ({ children, reason = "upgrade" }: PricingModalProps) => {
  const title = reason === "credits" ? "You're out of credits" : "Upgrade your plan";

  const description =
    reason === "credits"
      ? "You've used all your credits. Upgrade to keep building."
      : "Choose a plan that fits how much you build.";
  return (
    <Dialog>
      <DialogTrigger className={"cursor-pointer"}>{children}</DialogTrigger>
      <DialogContent
        className={
          "border-border/60 bg-background/95 p-0 text-foreground sm:max-w-6xl max-h-[90dvh] overflow-y-auto backdrop-blur-2xl"
        }
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-heading text-2xl tracking-tight text-foreground">
            <BlueTitle className="text-3xl">{title}</BlueTitle>
          </DialogTitle>
          <DialogDescription className={"text-sm text-muted-foreground"}>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;