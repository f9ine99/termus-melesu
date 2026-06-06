import { supabase, isSupabaseConfigured } from "./supabase"

let cachedUserId: string | null = null

/** Sync read of the active Supabase user id (updated via refreshCurrentUserId / auth listener). */
export const getCurrentUserId = (): string | null => cachedUserId

export const refreshCurrentUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured() || !supabase) {
    cachedUserId = null
    return null
  }

  const { data: { session } } = await supabase.auth.getSession()
  cachedUserId = session?.user?.id ?? null
  return cachedUserId
}

function initAuthUserCache(): void {
  if (typeof window === "undefined" || !supabase) return

  void refreshCurrentUserId()
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id ?? null
  })
}

initAuthUserCache()
