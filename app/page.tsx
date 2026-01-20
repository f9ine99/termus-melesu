"use client"

import { useEffect, useState } from "react"
import { getStoredSession } from "@/lib/auth-store"
import SplashScreen from "@/components/screens/splash-screen"
import LoginScreen from "@/components/screens/login-screen"
import DashboardLayout from "@/components/layouts/dashboard-layout"
import type { SafeUser } from "@/lib/types"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<SafeUser | null>(null)

  useEffect(() => {
    setMounted(true)

    // Check for stored session
    const session = getStoredSession()
    if (session?.isLoggedIn && session.user) {
      setUser(session.user)
    }

    // Simulate splash screen duration (1.5s)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Show splash during initial load
  if (isLoading) {
    return <SplashScreen />
  }

  // Show login if not authenticated
  if (!mounted || !user) {
    return <LoginScreen onLoginSuccess={setUser} />
  }

  // Show dashboard if authenticated
  return <DashboardLayout user={user} onLogout={() => setUser(null)} />
}
