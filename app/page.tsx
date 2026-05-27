"use client"

import { useEffect, useState } from "react"
import { acceptCurrentPolicyConsent, getStoredSession } from "@/lib/auth-store"
import { LEGAL_CONFIG } from "@/lib/config"
import LoginScreen from "@/components/screens/login-screen"
import DashboardLayout from "@/components/layouts/dashboard-layout"
import type { SafeUser } from "@/lib/types"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<SafeUser | null>(null)
  const [needsPolicyConsent, setNeedsPolicyConsent] = useState(false)
  const [isSavingConsent, setIsSavingConsent] = useState(false)
  const [consentError, setConsentError] = useState("")

  useEffect(() => {
    // Check for stored session
    const checkSession = async () => {
      const session = await getStoredSession()
      if (session?.isLoggedIn && session.user) {
        setUser(session.user)
        setNeedsPolicyConsent(session.needsPolicyConsent)
      }
      setMounted(true)
    }
    checkSession()
  }, [])

  // Wait for hydration to avoid flash
  if (!mounted) {
    return null
  }

  // Show login if not authenticated
  if (!user) {
    return (
      <LoginScreen
        onLoginSuccess={async (loggedInUser) => {
          setUser(loggedInUser)
          const session = await getStoredSession()
          setNeedsPolicyConsent(Boolean(session?.needsPolicyConsent))
        }}
      />
    )
  }

  if (needsPolicyConsent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 space-y-5">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">Privacy consent required</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Before continuing, please review and accept our current Terms of Service and Privacy Policy.
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <button
              type="button"
              onClick={() => window.open(LEGAL_CONFIG.TERMS_OF_SERVICE_URL, "_blank", "noopener,noreferrer")}
              className="w-full text-left underline font-semibold text-foreground hover:text-primary transition-colors"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => window.open(LEGAL_CONFIG.PRIVACY_POLICY_URL, "_blank", "noopener,noreferrer")}
              className="w-full text-left underline font-semibold text-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </button>
          </div>

          {consentError && (
            <p className="text-sm text-red-600">{consentError}</p>
          )}

          <button
            type="button"
            disabled={isSavingConsent}
            onClick={async () => {
              setConsentError("")
              setIsSavingConsent(true)
              const result = await acceptCurrentPolicyConsent()
              setIsSavingConsent(false)
              if (result.success) {
                setNeedsPolicyConsent(false)
                return
              }
              setConsentError(result.error || "Failed to save consent. Please try again.")
            }}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-60"
          >
            {isSavingConsent ? "Saving..." : "I Agree and Continue"}
          </button>
        </div>
      </div>
    )
  }

  // Show dashboard if authenticated
  return (
    <DashboardLayout
      user={user}
      onLogout={async () => {
        const { logoutUser } = await import("@/lib/auth-store")
        await logoutUser()
        setUser(null)
      }}
    />
  )
}
