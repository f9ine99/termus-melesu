"use client"

import { useState, useEffect } from "react"
import { authenticateUser, registerUser, isLocked, getRemainingLockTime, signInWithSocial } from "@/lib/auth-store"
import type { SafeUser } from "@/lib/types"
import { AppleIcon, GoogleIcon, MailIcon, ShieldCheckIcon, CheckIcon, BottleIcon, EyeIcon, EyeOffIcon, AlertIcon, InfoIcon } from "@/components/ui/icons"
import { NotificationToast } from "@/components/ui/notification-toast"
import { cn } from "@/lib/utils"

interface LoginScreenProps {
  onLoginSuccess: (user: SafeUser) => void
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [lockoutTime, setLockoutTime] = useState(0)
  const [shake, setShake] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Check lockout status
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

  // Auto-hide notifications
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError("")
        setSuccessMessage("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, successMessage])

  const isLockedOut = lockoutTime > 0

  const formatLockoutTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill all fields")
      return
    }

    setError("")
    setIsLoading(true)

    const result = await authenticateUser(email, password)

    if (result.success && result.user) {
      setIsSuccess(true)
      setTimeout(() => {
        onLoginSuccess(result.user!)
      }, 800)
    } else {
      setError(result.error || "Invalid credentials")
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !name || !password) {
      setError("Please fill all fields")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setError("")
    setIsLoading(true)

    const result = await registerUser(email, name, password)

    if (result.success) {
      setIsSuccess(true)
      if (result.message) {
        setSuccessMessage(result.message)
        setIsLoading(false)
      } else {
        setSuccessMessage("Account created successfully! Redirecting to sign in...")
        setTimeout(() => {
          setMode("login")
          setIsSuccess(false)
          setIsLoading(false)
          setSuccessMessage("")
          setPassword("")
          setError("")
        }, 2000)
      }
    } else {
      setError(result.error || "Registration failed")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Floating Notifications */}
      {(error || successMessage) && (
        <NotificationToast
          message={error || successMessage}
          type={error ? "error" : "success"}
          onClose={() => {
            setError("")
            setSuccessMessage("")
          }}
        />
      )}

      {/* Background Accents */}
      <div className="w-full max-w-[320px] space-y-8 animate-in fade-in duration-700">

        {/* Logo Container */}
        <div className="flex flex-col items-center space-y-6">
          <div className="w-12 h-12 bg-[#003d3d] rounded-[1rem] flex items-center justify-center shadow-lg">
            <BottleIcon className="w-6 h-6 text-white" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">
              {mode === "login" ? "Sign In" : "Create Account"}
            </h1>
            <p className="text-sm text-[#8e8e93] max-w-[280px] mx-auto leading-tight">
              {mode === "login"
                ? "To sign in to an account in the application, enter your email and password"
                : "Join us today to start managing your digital ledger with ease."}
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={mode === "login" ? handleLogin : handleRegister}
          className={cn("space-y-4", shake && "animate-shake")}
        >
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e93]">
                <MailIcon className="w-5 h-5" />
              </div>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isSuccess || isLockedOut}
                className="w-full pl-12 pr-4 py-3.5 bg-[#f2f2f7] border-none rounded-[1rem] text-[15px] font-medium placeholder:text-[#8e8e93] focus:ring-2 focus:ring-[#003d3d]/10 transition-all outline-none disabled:opacity-50"
              />
            </div>

            {mode === "register" && (
              <div className="relative animate-in slide-in-from-top-2 duration-300">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e93]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading || isSuccess}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#f2f2f7] border-none rounded-[1rem] text-[15px] font-medium placeholder:text-[#8e8e93] focus:ring-2 focus:ring-[#003d3d]/10 transition-all outline-none"
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e93]">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isSuccess || isLockedOut}
                className="w-full pl-12 pr-12 py-3.5 bg-[#f2f2f7] border-none rounded-[1rem] text-[15px] font-medium placeholder:text-[#8e8e93] focus:ring-2 focus:ring-[#003d3d]/10 transition-all outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e8e93] hover:text-[#1a1a1a] transition-colors"
              >
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              className="text-[14px] font-bold text-[#003d3d] hover:opacity-70 transition-opacity"
            >
              Forgot password?
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || isSuccess || isLockedOut}
              className="w-full py-3.5 bg-[#003d3d] text-white rounded-[1rem] font-bold text-[16px] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isSuccess ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                "Continue"
              )}
            </button>
          </div>

          <div className="relative py-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#f2f2f7]"></div>
            </div>
            <span className="relative px-4 bg-white text-[13px] text-[#8e8e93] font-medium">
              {mode === "login" ? "Don't have an account yet?" : "Already have an account?"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login")
              setError("")
              setSuccessMessage("")
              setPassword("")
            }}
            className="w-full py-3.5 bg-[#f2f2f7] text-[#1a1a1a] rounded-[1rem] font-bold text-[15px] hover:bg-[#e5e5ea] transition-colors"
          >
            {mode === "login" ? "Create an account" : "Sign in to account"}
          </button>

          <div className="grid grid-cols-1 gap-3 pt-2">
            <button
              type="button"
              onClick={() => signInWithSocial("apple")}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-[#f2f2f7] rounded-[1rem] font-bold text-[15px] hover:bg-[#f2f2f7] transition-all"
            >
              <AppleIcon className="w-5 h-5" />
              <span>Sign in with Apple</span>
            </button>
            <button
              type="button"
              onClick={() => signInWithSocial("google")}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-[#f2f2f7] rounded-[1rem] font-bold text-[15px] hover:bg-[#f2f2f7] transition-all"
            >
              <GoogleIcon className="w-5 h-5" />
              <span>Sign in with Google</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="pt-4 text-center">
          <p className="text-[12px] text-[#8e8e93] leading-relaxed">
            By clicking "Continue", I have read and agree<br />
            with the <button className="underline font-bold text-[#1a1a1a]">Term Sheet</button>, <button className="underline font-bold text-[#1a1a1a]">Privacy Policy</button>
          </p>
        </div>

        {/* Status Messages - Lockout Only */}
        <div className="space-y-4 min-h-[48px]">
          {isLockedOut && (
            <div className="flex items-center gap-3 p-3.5 bg-[#f2f2f7] border border-[#e5e5ea] rounded-[1rem] animate-pulse">
              <div className="flex-shrink-0 w-8 h-8 bg-[#8e8e93] rounded-lg flex items-center justify-center shadow-sm">
                <ShieldCheckIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-[13px] text-[#1a1a1a] font-bold uppercase tracking-wider">
                Locked: {formatLockoutTime(lockoutTime)}
              </p>
            </div>
          )}
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
