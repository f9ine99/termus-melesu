"use client"

import { useState, useMemo } from "react"
import { getCustomers, deleteCustomer } from "@/lib/data-store"
import { getStoredSession, verifyCurrentUserPin } from "@/lib/auth-store"
import { ArrowLeftIcon, UserPlusIcon, XIcon, SearchIcon, UndoIcon, TrashIcon } from "@/components/ui/icons"
import ConfirmModal from "@/components/ui/confirm-modal"

interface CustomersScreenProps {
  onSelectCustomer: (customerId: string) => void
  onBack: () => void
  onRefresh?: () => void
  onNotifySuccess?: (message: string) => void
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void
  t: (key: any, params?: any) => string
  language: string
}

export default function CustomersScreen({ onSelectCustomer, onBack, onRefresh, onNotifySuccess, onNotify, t, language }: CustomersScreenProps) {
  const allCustomers = useMemo(() => getCustomers(), [])
  const [searchTerm, setSearchTerm] = useState("")
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setCustomerToDelete(id)
  }

  const confirmDelete = async () => {
    if (!customerToDelete) return

    const isValidPin = await verifyCurrentUserPin(pin)
    if (!isValidPin) {
      setError(t("incorrectPin"))
      return
    }

    deleteCustomer(customerToDelete)
    onNotifySuccess?.(t("customerDeleted"))
    onRefresh?.()
    setCustomerToDelete(null)
    setPin("")
    setError("")
  }

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return allCustomers
    return allCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    )
  }, [allCustomers, searchTerm])

  return (
    <div className="min-h-full bg-background flex flex-col relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center gap-4 sticky top-0 bg-background/60 backdrop-blur-xl z-20">
        <button
          onClick={onBack}
          className="p-3 bg-secondary/50 border border-border rounded-2xl active:scale-90 transition-transform"
        >
          <ArrowLeftIcon className="w-5 h-5 text-foreground" />
        </button>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t("customers")}</h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("customerManagement")}</p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 mb-8 relative z-10">
        <div className="relative group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={t("searchByNameOrPhone")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-secondary/50 border border-border rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 shadow-inner-soft"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-muted/20 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Customer List */}
      <main className="flex-1 px-6 pb-32 overflow-y-auto no-scrollbar relative z-10">
        <div className="space-y-4">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => onSelectCustomer(customer.id)}
                className="w-full text-left bg-card/50 backdrop-blur-sm border border-border rounded-[2rem] p-5 shadow-soft flex items-center justify-between active:scale-[0.98] transition-all hover:border-primary/20 group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center font-black text-primary text-xl group-hover:bg-primary group-hover:text-white transition-all">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-black text-sm tracking-tight text-foreground">{customer.name}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right space-y-2">
                    <div className={`text-[8px] font-black px-2.5 py-1 rounded-full inline-block uppercase tracking-widest ${customer.trustStatus === 'approved' ? 'bg-green-500/10 text-green-600' :
                      customer.trustStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'
                      }`}>
                      {customer.trustStatus}
                    </div>
                    <p className="text-[10px] font-black text-foreground/70 tracking-tighter">
                      {customer.bottlesOutstanding} {t("units")}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(e, customer.id)}
                    className="p-2.5 bg-secondary/50 text-muted-foreground hover:bg-red-500 hover:text-white rounded-xl transition-all shrink-0"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center space-y-6 bg-secondary/20 rounded-[3rem] border border-dashed border-border">
              <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto opacity-50">
                <UserPlusIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-foreground tracking-tight">{t("noMatchingRecords")}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{t("searchByNameOrPhone")}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Password Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-card border border-border rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">{t("deleteCustomer")}</h3>
              <p className="text-xs text-muted-foreground">{t("deleteConfirm")}</p>
              <p className="text-xs text-muted-foreground mt-2">{t("enterPinToConfirm")}</p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value)
                  setError("")
                }}
                placeholder="PIN"
                className="w-full px-6 py-4 bg-secondary/50 border border-border rounded-xl text-center text-lg font-black tracking-widest focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus
              />
              {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCustomerToDelete(null)
                  setPin("")
                  setError("")
                }}
                className="flex-1 py-4 bg-secondary text-foreground rounded-xl font-bold text-xs transition-all active:scale-95"
              >
                {t("cancel")}
              </button>
              <button
                onClick={confirmDelete}
                disabled={!pin}
                className="flex-1 py-4 bg-red-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
