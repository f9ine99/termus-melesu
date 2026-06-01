import {
  hashPassword,
  verifyPassword,
  isLocked,
  getRemainingLockTime,
  recordFailedAttempt,
  clearLockout,
} from "./secure-auth"

const PIN_HASHES_KEY = "bottletrack_action_pin_hashes"
const MIN_PIN_LENGTH = 4
const MAX_PIN_LENGTH = 6

type PinHashStore = Record<string, string>

function readStore(): PinHashStore {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(PIN_HASHES_KEY)
    return raw ? (JSON.parse(raw) as PinHashStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: PinHashStore): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PIN_HASHES_KEY, JSON.stringify(store))
}

export function isValidPinFormat(pin: string): boolean {
  return /^\d+$/.test(pin) && pin.length >= MIN_PIN_LENGTH && pin.length <= MAX_PIN_LENGTH
}

export function hasActionPin(userId: string): boolean {
  const store = readStore()
  return Boolean(store[userId])
}

export async function setActionPin(userId: string, pin: string): Promise<{ success: boolean; error?: string }> {
  if (!isValidPinFormat(pin)) {
    return { success: false, error: "invalid_format" }
  }

  const hash = await hashPassword(pin)
  const store = readStore()
  store[userId] = hash
  writeStore(store)
  clearLockout()
  return { success: true }
}

export async function verifyActionPin(
  userId: string,
  pin: string,
): Promise<{ success: boolean; error?: "not_set" | "incorrect" | "locked" | "invalid_format" }> {
  if (isLocked()) {
    return { success: false, error: "locked" }
  }

  if (!isValidPinFormat(pin)) {
    return { success: false, error: "invalid_format" }
  }

  const hash = readStore()[userId]
  if (!hash) {
    return { success: false, error: "not_set" }
  }

  const valid = await verifyPassword(pin, hash)
  if (valid) {
    clearLockout()
    return { success: true }
  }

  recordFailedAttempt()
  return { success: false, error: "incorrect" }
}

export { isLocked, getRemainingLockTime }

export function formatPinLockoutTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export type PinVerifyError = "not_set" | "incorrect" | "locked" | "invalid_format"

export function getPinErrorMessage(
  error: PinVerifyError,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (error === "not_set") return t("pinRequiredInSettings")
  if (error === "incorrect") return t("incorrectPin")
  if (error === "invalid_format") return t("pinLengthError")
  if (error === "locked") {
    return t("pinLocked", { time: formatPinLockoutTime(getRemainingLockTime()) })
  }
  return t("incorrectPin")
}
