"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { completePasswordReset } from "@/lib/auth-store"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { BottleIcon, ShieldCheckIcon, EyeIcon, EyeOffIcon, CheckIcon } from "@/components/ui/icons"
import { NotificationToast } from "@/components/ui/notification-toast"

export default function ResetPasswordScreen() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (!isSupabaseConfigured() || !supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true)
      }
    })

    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")

    const finishReady = () => setReady(true)

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) finishReady()
      })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) finishReady()
      })
    }

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!password || !confirmPassword) {
      setError("Please fill all fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    const result = await completePasswordReset(password)
    setIsLoading(false)

    if (result.success) {
      setIsSuccess(true)
      setSuccessMessage(result.message || "Password updated successfully")
      setTimeout(() => {
        router.replace("/")
      }, 1200)
      return
    }

    setError(result.error || "Failed to update password")
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
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

      <div className="w-full max-w-[320px] space-y-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-12 h-12 bg-primary rounded-[1rem] flex items-center justify-center shadow-lg">
            <BottleIcon className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Set new password</h1>
            <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-tight">
              Choose a new password for your account.
            </p>
          </div>
        </div>

        {!ready ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Verifying your reset link...
            </p>
            <Link href="/" className="text-sm font-bold text-primary underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isSuccess}
                className="w-full pl-12 pr-12 py-3.5 bg-secondary border-none rounded-[1rem] text-[15px] font-medium placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || isSuccess}
                className="w-full pl-12 pr-4 py-3.5 bg-secondary border-none rounded-[1rem] text-[15px] font-medium placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-[1rem] font-bold text-[16px] shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : isSuccess ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                "Update password"
              )}
            </button>
          </form>
        )}

        {ready && (
          <div className="text-center">
            <Link href="/" className="text-sm font-bold text-primary hover:opacity-70 transition-opacity">
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
