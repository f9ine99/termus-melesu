"use client"

import { useState, useEffect } from "react"
import { authenticateUser, isLocked, getRemainingLockTime } from "@/lib/auth-store"
import type { SafeUser } from "@/lib/types"
import { BottleIcon, CheckIcon, LockIcon } from "@/components/ui/icons"

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

  const formatLockoutTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setRemainingAttempts(null)
    setIsLoading(true)

    const result = await authenticateUser(username, pin)

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
      setRemainingAttempts(result.remainingAttempts || 0)
      setIsLoading(false)
      setPin("")
    }
  }

  const isLockedOut = lockoutTime > 0

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 safe-area-inset relative overflow-hidden">
      {/* Sophisticated Background Elements */}
      {/* Sophisticated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-subtle" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse-subtle delay-700" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-12 space-y-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-card border border-border rounded-[2.5rem] flex items-center justify-center mx-auto shadow-premium animate-pulse-subtle">
              <BottleIcon className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg border-4 border-background">
              <CheckIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-foreground">Retra</h1>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-[0.3em]">Ledger</p>
          </div>
        </div>

        {/* Login Card with Glassmorphism */}
        <div className="bg-card/50 backdrop-blur-xl border border-border rounded-[3rem] p-8 shadow-premium space-y-8">
          {isLockedOut ? (
            /* Lockout State */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
                <LockIcon className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-black text-foreground">Account Locked</h2>
                <p className="text-xs text-muted-foreground">Too many failed attempts</p>
              </div>
              <div className="text-3xl font-black text-destructive tracking-widest">
                {formatLockoutTime(lockoutTime)}
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Until unlock
              </p>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3 text-center">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Security PIN</label>
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full py-6 px-6 text-center text-4xl font-black tracking-[0.8em] bg-secondary/50 border-none rounded-3xl focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/20 shadow-inner-soft"
                    maxLength={4}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 px-6 py-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-[10px] text-destructive font-black text-center uppercase tracking-widest">
                    {error}
                    {remainingAttempts !== null && remainingAttempts > 0 && (
                      <span className="block mt-1 opacity-70">
                        {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                      </span>
                    )}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={pin.length < 4 || isLoading || isSuccess}
                className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-premium transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${isSuccess
                  ? "bg-green-600 text-white"
                  : "bg-primary text-primary-foreground disabled:opacity-50 disabled:grayscale"
                  }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isSuccess ? (
                  <>
                    <CheckIcon className="w-5 h-5" />
                    Authenticated
                  </>
                ) : (
                  "Access Ledger"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-50">
            v1.0.5 • Secure Access
          </p>
          <div className="flex items-center justify-center gap-4 opacity-30">
            <div className="h-[1px] w-8 bg-muted-foreground" />
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            <div className="h-[1px] w-8 bg-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  )
}

