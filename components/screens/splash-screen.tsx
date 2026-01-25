"use client"

import { BottleIcon } from "@/components/ui/icons"

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center safe-area-inset overflow-hidden">
      {/* Subtle Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-8 animate-in fade-in duration-700">
        {/* Minimal Logo */}
        <div className="relative">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20">
            <BottleIcon className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        {/* App Name */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tight">Retra</h1>
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.25em]">Bottle Manager</p>
        </div>

        {/* Minimal Loading Spinner */}
        <div className="mt-4">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
