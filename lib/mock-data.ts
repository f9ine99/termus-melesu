// Mock data for offline-first development

import type { User, Customer, Transaction } from "./types"

export const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    // SHA-256 hash of "3312"
    pinHash: "2ee62f16ca41fe7879853975d5fcb4cb858f6edb5fd0355cfb7948d997e6b6a9",
    adminName: "Firaol",
    createdAt: new Date("2025-01-01"),
  },
]

// Cleared mock data for a fresh start
export const mockCustomers: Customer[] = []

export const mockTransactions: Transaction[] = []
