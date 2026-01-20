"use client"

import { useState, useEffect } from "react"
import { authenticateUser, isLocked, getRemainingLockTime } from "@/lib/auth-store"
import type { SafeUser } from "@/lib/types"
import { BottleIcon, CheckIcon, LockIcon, DeleteIcon } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

interface LoginScreenProps {
  onLoginSuccess: (user: SafeUser) => void
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username] = useState("admin")
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [lockoutTime, setLockoutTime] = useState(0)
  const [shake, setShake] = useState(false)

  // Check lockout status on mount and periodically
  useEffect(() => {
    const checkLockout = () => {
      if (isLocked()) {
        setLockoutTime(getRemainingLockTime())
      } else {
        setLockoutTime(0)
      }
    }

    checkLockout()
    const interval = setInterval(checkLockout, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-submit when PIN reaches 4 digits
  useEffect(() => {
    if (pin.length === 4) {
      handleLogin(pin)
    }
  }, [pin])

  const formatLockoutTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleLogin = async (currentPin: string) => {
    setError("")
    setRemainingAttempts(null)
    setIsLoading(true)

    // Small delay for UX to see the last dot fill
    await new Promise(resolve => setTimeout(resolve, 300))

    const result = await authenticateUser(username, currentPin)

    if (result.success && result.user) {
      setIsSuccess(true)
      setTimeout(() => {
        onLoginSuccess(result.user!)
      }, 800)
    } else if (result.error === "locked") {
      setLockoutTime(result.lockoutTime || 0)
      setIsLoading(false)
      setPin("")
    } else {
      setError("Invalid PIN")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setRemainingAttempts(result.remainingAttempts || 0)
      setIsLoading(false)
      setPin("")
    }
  }

  const handleKeyPadPress = (key: string) => {
    if (isLoading || isSuccess || isLockedOut) return
    if (key === "backspace") {
      setPin(prev => prev.slice(0, -1))
    } else if (pin.length < 4) {
      setPin(prev => prev + key)
    }
  }

  const isLockedOut = lockoutTime > 0

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 safe-area-inset relative overflow-hidden">
      {/* Sophisticated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-subtle" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse-subtle delay-700" />

      <div className="w-full max-w-sm relative z-10 flex flex-col h-full justify-center">
        {/* Logo & Header */}
        <div className="text-center mb-8 space-y-6">
          <div className="relative inline-block">
            <div className="w-20 h-20 bg-card border border-border rounded-[2rem] flex items-center justify-center mx-auto shadow-premium animate-pulse-subtle">
              <BottleIcon className="w-10 h-10 text-primary" />
            </div>
            {isSuccess && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-background animate-in zoom-in">
                <CheckIcon className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground">Retra</h1>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.3em]">Ledger</p>
          </div>
        </div>

        {/* PIN Display */}
        <div className="mb-8">
          <div className={cn("flex justify-center gap-4 mb-4", shake && "animate-shake")}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all duration-300",
                  i < pin.length
                    ? "bg-primary border-primary scale-110"
                    : "bg-transparent border-muted-foreground/30"
                )}
              />
            ))}
          </div>

          <div className="h-6 text-center">
            {error ? (
              <p className="text-[10px] text-destructive font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                {error}
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <span className="opacity-70 ml-2">({remainingAttempts} left)</span>
                )}
              </p>
            ) : isLockedOut ? (
              <p className="text-[10px] text-destructive font-black uppercase tracking-widest animate-pulse">
                Locked: {formatLockoutTime(lockoutTime)}
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-50">
                Enter Security PIN
              </p>
            )}
          </div>
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPadPress(num.toString())}
              disabled={isLoading || isSuccess || isLockedOut}
              className="aspect-square rounded-full bg-card/30 backdrop-blur-sm border border-border/50 text-2xl font-medium text-foreground hover:bg-primary/10 active:bg-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-sm"
            >
              {num}
            </button>
          ))}
          <div className="aspect-square" /> {/* Empty slot */}
          <button
            onClick={() => handleKeyPadPress("0")}
            disabled={isLoading || isSuccess || isLockedOut}
            className="aspect-square rounded-full bg-card/30 backdrop-blur-sm border border-border/50 text-2xl font-medium text-foreground hover:bg-primary/10 active:bg-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-sm"
          >
            0
          </button>
          <button
            onClick={() => handleKeyPadPress("backspace")}
            disabled={isLoading || isSuccess || isLockedOut || pin.length === 0}
            className="aspect-square rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all disabled:opacity-30"
          >
            <DeleteIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-30">
            Secure Local Authentication
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  )
}

