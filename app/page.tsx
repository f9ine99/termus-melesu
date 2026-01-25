"use client"

import { useEffect, useState } from "react"
import { getStoredSession } from "@/lib/auth-store"
import LoginScreen from "@/components/screens/login-screen"
import DashboardLayout from "@/components/layouts/dashboard-layout"
import type { SafeUser } from "@/lib/types"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<SafeUser | null>(null)

  useEffect(() => {
    // Check for stored session
    const session = getStoredSession()
    if (session?.isLoggedIn && session.user) {
      setUser(session.user)
    }
    setMounted(true)
  }, [])

  // Wait for hydration to avoid flash
  if (!mounted) {
    return null
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginScreen onLoginSuccess={setUser} />
  }

  // Show dashboard if authenticated
  return <DashboardLayout user={user} onLogout={() => setUser(null)} />
}
