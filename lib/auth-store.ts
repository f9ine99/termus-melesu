// Client-side auth state management using React hooks pattern
// This simulates localStorage for session persistence

import type { User, SafeUser } from "./types"
import { mockUsers } from "./mock-data"
import { verifyPin, isLocked, recordFailedAttempt, clearLockout, getRemainingLockTime, getRemainingAttempts } from "./secure-auth"

const SESSION_KEY = "bottletrack_session"

export interface AuthStore {
  user: SafeUser | null  // Changed from User to SafeUser - no PIN stored
  isLoggedIn: boolean
}

// Helper to create SafeUser from User (strips sensitive data)
function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    username: user.username,
    adminName: user.adminName,
    createdAt: user.createdAt,
  }
}

// Simulate localStorage for session persistence
export const getStoredSession = (): AuthStore | null => {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(SESSION_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const saveSession = (store: AuthStore): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(store))
  } catch (e) {
    console.error("Failed to save session:", e)
  }
}

export const clearSession = (): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(SESSION_KEY)
  } catch (e) {
    console.error("Failed to clear session:", e)
  }
}

// Authentication result type
export interface AuthResult {
  success: boolean
  user?: SafeUser
  error?: string
  remainingAttempts?: number
  lockoutTime?: number
}

// Secure authentication with hash verification and brute-force protection
export const authenticateUser = async (username: string, pin: string): Promise<AuthResult> => {
  // Check lockout status first
  if (isLocked()) {
    return {
      success: false,
      error: "locked",
      lockoutTime: getRemainingLockTime(),
    }
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const user = mockUsers.find((u) => u.username === username)

  if (user) {
    // Verify PIN using secure hash comparison
    const isValid = await verifyPin(pin, user.pinHash)

    if (isValid) {
      // Clear any lockout state on successful login
      clearLockout()

      const safeUser = toSafeUser(user)
      const store: AuthStore = {
        user: safeUser,
        isLoggedIn: true,
      }
      saveSession(store)

      return {
        success: true,
        user: safeUser,
      }
    }
  }

  // Record failed attempt
  recordFailedAttempt()

  return {
    success: false,
    error: "invalid",
    remainingAttempts: getRemainingAttempts(),
  }
}

// Verify PIN for sensitive operations (like import)
export const verifyCurrentUserPin = async (pin: string): Promise<boolean> => {
  const session = getStoredSession()
  if (!session?.user) return false

  const user = mockUsers.find((u) => u.id === session.user!.id)
  if (!user) return false

  return verifyPin(pin, user.pinHash)
}

export const logoutUser = (): void => {
  clearSession()
}

// Re-export lockout utilities for UI
export { isLocked, getRemainingLockTime, getRemainingAttempts } from "./secure-auth"

