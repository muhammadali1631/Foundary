import React from "react"
import { AnimatedGradient } from "@/components/AnimatedGradient"

const AuthLayout = ({children}: Readonly<{children: React.ReactNode}>)=>{
    return (
        <div className="relative flex min-h-screen justify-center overflow-hidden bg-background pt-40">
            <AnimatedGradient className="absolute inset-0 opacity-60" />
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.06)_1px,transparent_1px)] bg-[size:44px_44px]"
              style={{
                maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)",
              }}
            />
            <div className="relative z-10 w-full px-4">
                {children}
            </div>
        </div>
    )
}

export default AuthLayout;