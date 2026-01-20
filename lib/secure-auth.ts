// Secure Authentication Utilities
// Handles PIN hashing and brute-force protection

const LOCKOUT_KEY = "bottletrack_lockout"
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 5 * 60 * 1000 // 5 minutes

interface LockoutState {
    failedAttempts: number
    lockoutUntil: number | null
}

// SHA-256 hash function with fallback for non-secure contexts (mobile/IP access)
export async function hashPin(pin: string): Promise<string> {
    // Try native Web Crypto API first (requires secure context: HTTPS or localhost)
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
        try {
            const encoder = new TextEncoder()
            const data = encoder.encode(pin)
            const hashBuffer = await crypto.subtle.digest('SHA-256', data)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        } catch (e) {
            console.warn("Native crypto failed, falling back to JS implementation", e)
        }
    }

    // Fallback: Pure JS SHA-256 implementation
    return sha256(pin)
}

/**
 * Pure JavaScript SHA-256 implementation
 * Used when crypto.subtle is unavailable (non-secure contexts)
 */
function sha256(ascii: string): string {
    function rightRotate(value: number, amount: number) {
        return (value >>> amount) | (value << (32 - amount));
    }

    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
    let i, j; // Used as a counter across the whole file
    let result = '';

    const words: any[] = [];
    const asciiBitLength = ascii[lengthProperty] * 8;

    /* caching results of Math.pow(x, 1/y) is faster than calling it every time */
    let hash: any[] = [];
    const k: any[] = [];
    let primeCounter = 0;

    const isPrime = (n: number) => {
        for (let factor = 2; factor * factor <= n; factor++) {
            if (n % factor === 0) return false;
        }
        return true;
    };

    let candidate = 2;
    while (primeCounter < 64) {
        if (isPrime(candidate)) {
            if (primeCounter < 8) {
                hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
            }
            k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            primeCounter++;
        }
        candidate++;
    }

    ascii += '\x80'; // Append '1' bit (plus zero padding)
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00'; // More zero padding

    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        if (j >> 8) return ''; // ASCII check: only accept characters in range 0-255
        words[i >> 2] |= j << ((3 - i % 4) * 8);
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength | 0);

    // process each chunk
    for (j = 0; j < words[lengthProperty]; j += 16) {
        const w = words.slice(j, j + 16);
        const oldHash = hash.slice(0);

        for (i = 0; i < 64; i++) {
            const w15 = w[i - 15], w2 = w[i - 2];

            const a = hash[0], e = hash[4];
            const temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
                + ((e & hash[5]) ^ ((~e) & hash[6])) // ch
                + k[i]
                + (w[i] = (i < 16) ? w[i] : (
                    w[i - 16]
                    + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) // s0
                    + w[i - 7]
                    + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)) // s1
                ) | 0);

            const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
                + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
            hash.length = 8;
        }

        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }

    for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) {
            const b = (hash[i] >> (j * 8)) & 255;
            result += ((b < 16) ? '0' : '') + b.toString(16);
        }
    }
    return result;
}

// Verify PIN against stored hash
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
    const inputHash = await hashPin(pin)
    return inputHash === storedHash
}

// Get current lockout state
function getLockoutState(): LockoutState {
    if (typeof window === "undefined") {
        return { failedAttempts: 0, lockoutUntil: null }
    }

    try {
        const stored = localStorage.getItem(LOCKOUT_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch {
        // Ignore parse errors
    }

    return { failedAttempts: 0, lockoutUntil: null }
}

// Save lockout state
function saveLockoutState(state: LockoutState): void {
    if (typeof window === "undefined") return

    try {
        localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state))
    } catch {
        // Ignore storage errors
    }
}

// Check if account is currently locked
export function isLocked(): boolean {
    const state = getLockoutState()

    if (state.lockoutUntil && Date.now() < state.lockoutUntil) {
        return true
    }

    // Clear expired lockout
    if (state.lockoutUntil && Date.now() >= state.lockoutUntil) {
        clearLockout()
    }

    return false
}

// Get remaining lockout time in milliseconds
export function getRemainingLockTime(): number {
    const state = getLockoutState()

    if (state.lockoutUntil && Date.now() < state.lockoutUntil) {
        return state.lockoutUntil - Date.now()
    }

    return 0
}

// Get remaining attempts before lockout
export function getRemainingAttempts(): number {
    const state = getLockoutState()
    return Math.max(0, MAX_ATTEMPTS - state.failedAttempts)
}

// Record a failed login attempt
export function recordFailedAttempt(): void {
    const state = getLockoutState()
    state.failedAttempts += 1

    if (state.failedAttempts >= MAX_ATTEMPTS) {
        state.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS
    }

    saveLockoutState(state)
}

// Clear lockout state (on successful login)
export function clearLockout(): void {
    if (typeof window === "undefined") return

    try {
        localStorage.removeItem(LOCKOUT_KEY)
    } catch {
        // Ignore storage errors
    }
}
