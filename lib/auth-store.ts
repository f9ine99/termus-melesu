// Client-side auth state management using Supabase Auth
import { supabase, isSupabaseConfigured } from "./supabase"
import type { SafeUser } from "./types"

export interface AuthStore {
  user: SafeUser | null
  isLoggedIn: boolean
}

// Helper to get current session from Supabase
export const getStoredSession = async (): Promise<AuthStore | null> => {
  if (!isSupabaseConfigured() || !supabase) return null

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      return {
        user: {
          id: session.user.id,
          username: session.user.email || session.user.id,
          name: session.user.user_metadata?.adminName || session.user.user_metadata?.full_name || "Admin",
          createdAt: session.user.created_at,
        },
        isLoggedIn: true,
      }
    }
  } catch (e) {
    console.error("Failed to get session:", e)
  }
  return null
}

// Authentication result type
export interface AuthResult {
  success: boolean
  user?: SafeUser
  error?: string
  message?: string
}

// Register a new user with Supabase
export const registerUser = async (email: string, name: string, password: string): Promise<AuthResult> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase not configured" }
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          adminName: name,
          full_name: name, // Standard field for Supabase Dashboard
        },
      },
    })

    if (error) throw error

    if (data.user) {
      // If email confirmation is enabled, the user might not be "fully" created until confirmed
      // but Supabase still returns the user object.
      return {
        success: true,
        user: {
          id: data.user.id,
          username: data.user.email || data.user.id,
          name: name,
          createdAt: data.user.created_at,
        },
        message: data.session ? undefined : "Please check your email to confirm your account.",
      }
    }
    return { success: false, error: "Registration failed" }
  } catch (e: any) {
    console.error("Registration failed:", e)
    return { success: false, error: e.message || "Registration failed" }
  }
}

// Login with Supabase
export const authenticateUser = async (email: string, password: string): Promise<AuthResult> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase not configured" }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      return {
        success: true,
        user: {
          id: data.user.id,
          username: data.user.email || data.user.id,
          name: data.user.user_metadata?.adminName || data.user.user_metadata?.full_name || "Admin",
          createdAt: data.user.created_at,
        },
      }
    }
    return { success: false, error: "Login failed" }
  } catch (e: any) {
    // Only log actual system errors, not expected auth failures
    if (e.message?.includes("Email not confirmed")) {
      return { success: false, error: "Please confirm your email address before signing in. Check your inbox for the confirmation link." }
    }

    if (e.message?.includes("Invalid login credentials")) {
      return { success: false, error: "The email or password you entered is incorrect. Please try again." }
    }

    console.error("Authentication system error:", e)
    return { success: false, error: e.message || "Invalid credentials" }
  }
}

export const logoutUser = async (): Promise<void> => {
  if (!supabase) return
  await supabase.auth.signOut()
}

// Social Sign-In with Supabase
export const signInWithSocial = async (provider: "google" | "apple"): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase) return

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) throw error
  } catch (e) {
    console.error(`Social login with ${provider} failed:`, e)
  }
}

// Re-export lockout utilities (placeholder if needed, but Supabase handles this server-side)
export const isLocked = () => false
export const getRemainingLockTime = () => 0
export const getRemainingAttempts = () => 5

