"use client"

import { useState } from "react"
import DashboardScreen from "@/components/screens/dashboard-screen"
import CustomersScreen from "@/components/screens/customers-screen"
import TransactionScreen from "@/components/screens/transaction-screen"
import ReportsScreen from "@/components/screens/reports-screen"
import SettingsScreen from "@/components/screens/settings-screen"
import CustomerDetailScreen from "@/components/screens/customer-detail-screen"
import type { SafeUser } from "@/lib/types"
import { ChartIcon, PeopleIcon, SettingsIcon, AddIcon, LogoutIcon, XIcon, CheckIcon, UndoIcon, AlertIcon, InfoIcon } from "@/components/ui/icons"
import { getCustomers, getTransactions, deleteTransaction } from "@/lib/data-store"
import { translations, type Language } from "@/lib/translations"
import { useEffect } from "react"
import { onSyncStatusChange, getSyncStatus, getPendingChangesCount, pushAllDataToCloud, triggerSync, getLastSyncTime, onLastSyncTimeChange, type SyncStatus } from "@/lib/sync-service"

interface DashboardLayoutProps {
  user: SafeUser
  onLogout: () => void
}

type ScreenType = "transaction" | "dashboard" | "customers" | "customer-detail" | "reports" | "settings"

interface StackEntry {
  screen: ScreenType
  params?: Record<string, any>
}

export default function DashboardLayout({ user, onLogout }: DashboardLayoutProps) {
  const [navigationStack, setNavigationStack] = useState<StackEntry[]>([{ screen: "dashboard" }])
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>("en")
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('online')
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Load language preference and setup sync status listener
  useEffect(() => {
    const saved = localStorage.getItem("bottletrack_language") as Language
    if (saved) setLanguage(saved)

    // Initialize sync status
    setSyncStatus(getSyncStatus())
    setPendingCount(getPendingChangesCount())
    setLastSyncTime(getLastSyncTime())

    // Listen for sync status changes
    const unsubscribeSync = onSyncStatusChange((status) => {
      setSyncStatus(status)
      setPendingCount(getPendingChangesCount())
    })

    // Listen for last sync time changes
    const unsubscribeTime = onLastSyncTimeChange((time) => {
      setLastSyncTime(time)
    })

    return () => {
      unsubscribeSync()
      unsubscribeTime()
    }
  }, [])

  const handleFixSync = async () => {
    if (syncStatus === 'syncing') return

    notify("Starting sync...", "info")
    const result = await triggerSync()

    if (result) {
      notify("Sync completed successfully", "success")
    } else {
      if (getPendingChangesCount() === 0) {
        notify("Already Synced: All your data is safely stored in the cloud.", "info")
      } else {
        notify("Sync failed. Please check your connection.", "error")
      }
    }
    refreshData()
  }

  const toggleLanguage = () => {
    const newLang = language === "en" ? "am" : "en"
    setLanguage(newLang)
    localStorage.setItem("bottletrack_language", newLang)
  }

  const t = (key: keyof typeof translations.en, params?: Record<string, string | number>) => {
    let text = translations[language][key] || translations.en[key] || key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, String(v))
      })
    }
    return text
  }

  const refreshData = () => setDataVersion(v => v + 1)

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success', transactionId?: string) => {
    setNotification({ message, type })
    if (transactionId) setLastTransactionId(transactionId)
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(null)
      setLastTransactionId(null)
    }, 5000)
  }

  const notifySuccess = (message: string, transactionId?: string) => notify(message, 'success', transactionId)

  const handleUndo = () => {
    if (lastTransactionId) {
      deleteTransaction(lastTransactionId)
      setLastTransactionId(null)
      notify("Transaction undone", "info")
      refreshData()
    }
  }

  const currentScreen = navigationStack[navigationStack.length - 1]

  const navigateTo = (screen: ScreenType, params?: Record<string, any>) => {
    setSlideDirection("left")
    setNavigationStack([...navigationStack, { screen, params }])
    setIsMenuOpen(false)
  }

  const goBack = () => {
    if (navigationStack.length > 1) {
      setSlideDirection("right")
      setNavigationStack(navigationStack.slice(0, -1))
    }
  }

  const renderScreen = () => {
    switch (currentScreen.screen) {
      case "transaction":
        return (
          <TransactionScreen
            key={`transaction-${dataVersion}`}
            onNavigateToDashboard={() => navigateTo("dashboard")}
            onTransactionComplete={refreshData}
            onNotifySuccess={notifySuccess}
            onNotify={notify}
            initialCustomerId={currentScreen.params?.customerId}
            type={currentScreen.params?.type}
            t={t}
            language={language}
          />
        )
      case "dashboard":
        return (
          <DashboardScreen
            key={`dashboard-${dataVersion}`}
            onNavigateToIssue={() => navigateTo("transaction", { type: "issue" })}
            onNavigateToReturn={() => navigateTo("transaction", { type: "return" })}
            onNavigateToReports={() => navigateTo("reports")}
            onNavigateToSettings={() => navigateTo("settings")}
            onNavigateToCustomers={() => navigateTo("customers")}
            t={t}
            language={language}
            syncStatus={syncStatus}
            pendingCount={pendingCount}
            lastSyncTime={lastSyncTime}
            onFixSync={handleFixSync}
          />
        )
      case "customers":
        return (
          <CustomersScreen
            key={`customers-${dataVersion}`}
            onSelectCustomer={(customerId) => navigateTo("customer-detail", { customerId })}
            onBack={goBack}
            onRefresh={refreshData}
            onNotifySuccess={notifySuccess}
            onNotify={notify}
            t={t}
            language={language}
          />
        )
      case "customer-detail":
        return (
          <CustomerDetailScreen
            key={`customer-detail-${dataVersion}-${currentScreen.params?.customerId}`}
            customerId={currentScreen.params?.customerId}
            onBack={goBack}
            onNavigateToIssue={() => navigateTo("transaction", { customerId: currentScreen.params?.customerId, type: "issue" })}
            onNavigateToReturn={() => navigateTo("transaction", { customerId: currentScreen.params?.customerId, type: "return" })}
            onRefresh={refreshData}
            onNotifySuccess={notifySuccess}
            onNotify={notify}
            t={t}
            language={language}
          />
        )
      case "reports":
        return (
          <ReportsScreen
            key={`reports-${dataVersion}`}
            onBack={goBack}
            onNotify={notify}
            t={t}
            language={language}
          />
        )
      case "settings":
        return (
          <SettingsScreen
            key={`settings-${dataVersion}`}
            user={user}
            onLogout={onLogout}
            onBack={goBack}
            t={t}
            language={language}
            onToggleLanguage={toggleLanguage}
            onNavigateToCustomers={() => navigateTo("customers")}
            onNotifySuccess={notifySuccess}
            onNotify={notify}
          />
        )
      default:
        return (
          <TransactionScreen
            key={`transaction-default-${dataVersion}`}
            onNavigateToDashboard={() => navigateTo("dashboard")}
            onTransactionComplete={refreshData}
            onNotifySuccess={notifySuccess}
            onNotify={notify}
            t={t}
            language={language}
          />
        )
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background safe-area-inset overflow-hidden relative">

      {/* Floating Menu Button */}
      <button
        onClick={() => setIsMenuOpen(true)}
        className="fixed bottom-8 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-premium z-40 flex items-center justify-center active:scale-90 transition-transform"
      >
        <div className="space-y-1">
          <div className="w-5 h-0.5 bg-current rounded-full" />
          <div className="w-5 h-0.5 bg-current rounded-full" />
          <div className="w-3 h-0.5 bg-current rounded-full" />
        </div>
      </button>

      {/* Side Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-card shadow-premium p-8 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-xl font-black">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-secondary rounded-xl">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              <MenuButton
                icon={<AddIcon className="w-5 h-5" />}
                label="Record"
                active={currentScreen.screen === "transaction"}
                onClick={() => navigateTo("transaction")}
              />
              <MenuButton
                icon={<ChartIcon className="w-5 h-5" />}
                label="Dashboard"
                active={currentScreen.screen === "dashboard"}
                onClick={() => navigateTo("dashboard")}
              />
              <MenuButton
                icon={<PeopleIcon className="w-5 h-5" />}
                label="Customers"
                active={currentScreen.screen === "customers"}
                onClick={() => navigateTo("customers")}
              />
              <MenuButton
                icon={<ChartIcon className="w-5 h-5" />}
                label="Reports"
                active={currentScreen.screen === "reports"}
                onClick={() => navigateTo("reports")}
              />
              <MenuButton
                icon={<SettingsIcon className="w-5 h-5" />}
                label="Settings"
                active={currentScreen.screen === "settings"}
                onClick={() => navigateTo("settings")}
              />
            </nav>

            <button
              onClick={onLogout}
              className="mt-auto flex items-center gap-3 p-4 text-destructive font-bold text-sm hover:bg-destructive/5 rounded-2xl transition-colors"
            >
              <LogoutIcon className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Screen container with slide animation */}
      <div
        key={navigationStack.length}
        className={`flex-1 overflow-hidden ${slideDirection === "left" ? "slide-in-left" : "slide-in-right"
          }`}
      >
        {/* Main Content Area */}
        <main className="h-full overflow-y-auto no-scrollbar">{renderScreen()}</main>
      </div>

      {/* Global Notification - Modern & Professional (Moved outside animated container) */}
      {notification && (
        <div className="fixed top-6 left-6 right-6 z-[100] animate-in slide-in-from-top-4 duration-500 ease-out">
          <div className={`backdrop-blur-xl border px-6 py-4 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4 transition-all ${notification.type === 'error' ? 'bg-red-500/90 border-red-500/20 text-white' :
            notification.type === 'info' ? 'bg-blue-500/90 border-blue-500/20 text-white' :
              'bg-foreground/90 border-white/10 text-background'
            }`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${notification.type === 'error' ? 'bg-white/20' :
                notification.type === 'info' ? 'bg-white/20' :
                  'bg-background/20'
                }`}>
                {notification.type === 'error' ? <AlertIcon className="w-5 h-5" /> :
                  notification.type === 'info' ? <InfoIcon className="w-5 h-5" /> :
                    <CheckIcon className="w-5 h-5" />
                }
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  {notification.type === 'error' ? 'Error' : notification.type === 'info' ? 'Info' : 'Success'}
                </p>
                <p className="text-xs font-bold tracking-tight">{notification.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lastTransactionId && notification.type === 'success' && (
                <button
                  onClick={handleUndo}
                  className="px-4 py-2 bg-background text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Undo
                </button>
              )}
              <button
                onClick={() => setNotification(null)}
                className={`p-2 rounded-xl transition-all active:scale-95 ${notification.type === 'error' || notification.type === 'info' ? 'hover:bg-white/10' : 'hover:bg-background/10'}`}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuButton({ icon, label, onClick, active }: { icon: any, label: string, onClick: () => void, active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-sm transition-all ${active ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" : "text-muted-foreground hover:bg-secondary"
        }`}
    >
      {icon}
      {label}
    </button>
  )
}
