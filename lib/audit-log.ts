import { LEGAL_CONFIG } from "./config"
import { getCurrentUserId } from "./session-user"

const AUDIT_LOG_KEY = "bottletrack_audit_log"
const MAX_EVENTS_PER_USER = 100

export type AuditAction =
  | "policy_consent_accepted"
  | "account_registered"
  | "data_exported"
  | "data_imported"
  | "account_delete_requested"
  | "account_delete_completed"
  | "account_delete_failed"
  | "ai_consent_enabled"
  | "ai_consent_disabled"

export interface AuditEvent {
  id: string
  userId: string
  action: AuditAction
  timestamp: string
  policyVersion?: string
  success?: boolean
}

type AuditStore = Record<string, AuditEvent[]>

function readStore(): AuditStore {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY)
    return raw ? (JSON.parse(raw) as AuditStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: AuditStore): void {
  if (typeof window === "undefined") return
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(store))
}

export function recordAuditEvent(
  action: AuditAction,
  options?: { userId?: string; policyVersion?: string; success?: boolean },
): void {
  if (typeof window === "undefined") return

  const userId = options?.userId ?? getCurrentUserId()
  if (!userId) return

  const store = readStore()
  const events = store[userId] ?? []

  events.push({
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId,
    action,
    timestamp: new Date().toISOString(),
    policyVersion: options?.policyVersion,
    success: options?.success,
  })

  store[userId] = events.slice(-MAX_EVENTS_PER_USER)
  writeStore(store)
}

export function getAuditEvents(userId?: string | null): AuditEvent[] {
  if (typeof window === "undefined") return []
  const id = userId ?? getCurrentUserId()
  if (!id) return []
  return readStore()[id] ?? []
}

export function clearUserAuditLog(userId: string): void {
  if (typeof window === "undefined") return
  const store = readStore()
  delete store[userId]
  writeStore(store)
}

export function recordPolicyConsent(userId: string): void {
  recordAuditEvent("policy_consent_accepted", {
    userId,
    policyVersion: LEGAL_CONFIG.POLICY_VERSION,
    success: true,
  })
}
