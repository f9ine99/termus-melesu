import { recordAuditEvent } from "./audit-log"

const AI_CONSENT_KEY = "bottletrack_ai_consent"

export function hasAiConsent(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(AI_CONSENT_KEY) === "true"
}

export function setAiConsent(enabled: boolean): void {
  if (typeof window === "undefined") return
  localStorage.setItem(AI_CONSENT_KEY, enabled ? "true" : "false")
  recordAuditEvent(enabled ? "ai_consent_enabled" : "ai_consent_disabled", { success: true })
}
