"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const next = params.get("next") || "/auth/reset-password"
    const safeNext = next.startsWith("/") ? next : "/auth/reset-password"

    if (!code) {
      router.replace("/?auth_error=missing_code")
      return
    }

    if (!isSupabaseConfigured() || !supabase) {
      router.replace("/?auth_error=supabase_not_configured")
      return
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error("Auth callback failed:", error)
        router.replace("/?auth_error=invalid_link")
        return
      }
      router.replace(safeNext)
    })
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">Signing you in...</p>
    </div>
  )
}
