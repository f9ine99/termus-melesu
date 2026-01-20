"use client"

import { BottleIcon } from "@/components/ui/icons"

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center safe-area-inset overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] animate-pulse delay-700" />

      <div className="relative z-10 text-center space-y-12 animate-in fade-in zoom-in duration-1000">
        {/* Logo area with Glassmorphism */}
        <div className="relative inline-block">
          <div className="w-32 h-32 bg-card/40 backdrop-blur-xl border border-border rounded-[3rem] flex items-center justify-center mx-auto shadow-premium relative overflow-hidden group">
            <BottleIcon className="w-16 h-16 text-primary animate-pulse-subtle" />
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg border-4 border-background animate-in zoom-in delay-500">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        </div>

        {/* App name & Tagline */}
        <div className="space-y-3">
          <h1 className="text-5xl font-black text-foreground tracking-tighter">Retra</h1>
          <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.4em] opacity-60">Retail Ledger</p>
        </div>

        {/* Professional Loading Indicator */}
        <div className="pt-4 max-w-[200px] mx-auto w-full">
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden border border-border/50">
            <div className="h-full bg-primary rounded-full w-1/3 animate-[loading_2s_ease-in-out_infinite]" />
          </div>
          <p className="mt-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Initializing Core...</p>
        </div>
      </div>

      {/* Offline indicator - Refined */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 bg-card/30 backdrop-blur-md border border-border/50 rounded-full shadow-soft animate-in slide-in-from-bottom-4 duration-1000 delay-300">
        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          Secure Local Authentication Only
        </p>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 60%; }
          100% { transform: translateX(350%); width: 30%; }
        }
      `}</style>
    </div>
  )
}
