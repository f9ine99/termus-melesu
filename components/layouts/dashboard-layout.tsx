"use client"

import { useState } from "react"
import DashboardScreen from "@/components/screens/dashboard-screen"
import CustomersScreen from "@/components/screens/customers-screen"
import TransactionScreen from "@/components/screens/transaction-screen"
import ReportsScreen from "@/components/screens/reports-screen"
import SettingsScreen from "@/components/screens/settings-screen"
import CustomerDetailScreen from "@/components/screens/customer-detail-screen"
import AiInsightsScreen from "@/components/screens/ai-insights-screen"
import RiskManagementScreen from "@/components/screens/risk-management-screen"
import type { SafeUser } from "@/lib/types"
import { ChartIcon, PeopleIcon, SettingsIcon, AddIcon, LogoutIcon, XIcon, CheckIcon, UndoIcon, AlertIcon, InfoIcon, GridIcon } from "@/components/ui/icons"
import { NotificationToast } from "@/components/ui/notification-toast"
import { PullToRefresh } from "@/components/ui/pull-to-refresh"
import { getCustomers, getTransactions, deleteTransaction } from "@/lib/data-store"
import { translations, type Language } from "@/lib/translations"
import { useEffect } from "react"
import { onSyncStatusChange, getSyncStatus, getPendingChangesCount, pushAllDataToCloud, triggerSync, getLastSyncTime, onLastSyncTimeChange, type SyncStatus } from "@/lib/sync-service"
import type { SummaryPeriod } from "@/lib/ai-service"

interface DashboardLayoutProps {
  user: SafeUser
  onLogout: () => void
}

type ScreenType = "transaction" | "dashboard" | "customers" | "customer-detail" | "reports" | "settings" | "ai-insights" | "risk-management"

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

    // Check network connectivity first
    if (syncStatus === 'offline') {
      notify(t("offlineError"), "error")
      return
    }

    // Then validate if there is any data to sync
    const customers = getCustomers()
    const transactions = getTransactions()

    if (customers.length === 0 && transactions.length === 0) {
      notify(t("noData"), "info")
      return
    }

    notify(t("startingSync"), "info")
    const result = await triggerSync()

    if (result) {
      notify(t("syncSuccess"), "success")
    } else {
      if (getPendingChangesCount() === 0) {
        notify(t("alreadySynced"), "info")
      } else {
        notify(t("syncFailed"), "error")
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
            user={user}
            onNavigateToIssue={() => navigateTo("transaction", { type: "issue" })}
            onNavigateToReturn={() => navigateTo("transaction", { type: "return" })}
            onNavigateToReports={() => navigateTo("reports")}
            onNavigateToAiInsights={() => navigateTo("ai-insights")}
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
            onNavigateToAiInsights={(period: SummaryPeriod) => navigateTo("ai-insights", { period })}
            onNavigateToRiskManagement={() => navigateTo("risk-management")}
            onNotify={notify}
            t={t}
            language={language}
          />
        )
      case "ai-insights":
        return (
          <AiInsightsScreen
            key={`ai-insights-${dataVersion}`}
            onBack={goBack}
            onNotify={notify}
            initialPeriod={currentScreen.params?.period}
            t={t}
            language={language}
          />
        )
      case "risk-management":
        return (
          <RiskManagementScreen
            key={`risk-management-${dataVersion}`}
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

      {/* Screen container with slide animation */}
      <div
        key={navigationStack.length}
        className={`flex-1 overflow-hidden pb-24 ${slideDirection === "left" ? "slide-in-left" : "slide-in-right"
          }`}
      >
        {/* Main Content Area */}
        <main className="h-full overflow-y-auto no-scrollbar">
          <PullToRefresh onRefresh={async () => {
            refreshData()
            // Add a small artificial delay to show the spinner
            await new Promise(resolve => setTimeout(resolve, 800))
          }}>
            {renderScreen()}
          </PullToRefresh>
        </main>
      </div>

      {/* Modern Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto relative pointer-events-auto">
          {/* Curved Background SVG */}
          <div className="absolute inset-0 -z-10 h-[72px] top-0">
            <svg width="100%" height="100%" viewBox="0 0 400 72" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="drop-shadow-[0_-10px_25px_rgba(0,0,0,0.15)]">
              {/* Main Background with Clean Notch */}
              <path
                d="M0 36C0 16.1177 16.1177 0 36 0H145C155 0 160 5 165 12C175 28 185 45 200 45C215 45 225 28 235 12C240 5 245 0 255 0H364C383.882 0 400 16.1177 400 36V36C400 55.8823 383.882 72 364 72H36C16.1177 72 0 55.8823 0 36V36Z"
                className="fill-card/90"
              />
              {/* Minimalist Top Border */}
              <path
                d="M0 36C0 16.1177 16.1177 0 36 0H145C155 0 160 5 165 12C175 28 185 45 200 45C215 45 225 28 235 12C240 5 245 0 255 0H364C383.882 0 400 16.1177 400 36"
                className="stroke-white/10"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 backdrop-blur-2xl -z-20 rounded-[2.5rem] overflow-hidden" />
          </div>

          <nav className="flex items-center justify-between px-8 relative h-[72px]">

            <NavTab
              icon={<GridIcon className="w-6 h-6" />}
              active={currentScreen.screen === "dashboard"}
              onClick={() => navigateTo("dashboard")}
            />
            <NavTab
              icon={<PeopleIcon className="w-6 h-6" />}
              active={currentScreen.screen === "customers" || currentScreen.screen === "customer-detail"}
              onClick={() => navigateTo("customers")}
            />

            {/* Central Record Button - Enhanced Design */}
            <div className="relative -mt-10 group flex flex-col items-center">
              {/* Subtle Outer Glow */}
              <div className="absolute top-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-700 scale-150 w-16 h-16 opacity-30" />

              <button
                onClick={() => navigateTo("transaction")}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-[0_15px_35px_-5px_rgba(var(--primary),0.4)] active:scale-90 ${currentScreen.screen === "transaction"
                  ? "bg-foreground text-background rotate-45"
                  : "bg-primary text-primary-foreground hover:scale-105"
                  }`}
              >
                <AddIcon className="w-8 h-8" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </button>
            </div>

            <NavTab
              icon={<ChartIcon className="w-6 h-6" />}
              active={currentScreen.screen === "reports" || currentScreen.screen === "ai-insights"}
              onClick={() => navigateTo("reports")}
            />
            <NavTab
              icon={<SettingsIcon className="w-6 h-6" />}
              active={currentScreen.screen === "settings"}
              onClick={() => navigateTo("settings")}
            />
          </nav>
        </div>
      </div>

      {/* Global Notification - Modern & Professional (Moved outside animated container) */}
      {/* Global Notification - Modern & Professional */}
      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
          onUndo={lastTransactionId && notification.type === 'success' ? handleUndo : undefined}
        />
      )}
    </div>
  )
}

function NavTab({ icon, onClick, active }: { icon: any, onClick: () => void, active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-4 transition-all duration-500 relative group/tab ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
    >
      <div className={`transition-all duration-500 z-10 ${active ? "translate-y-[-2px] scale-110" : "group-hover/tab:translate-y-[-1px]"}`}>
        {icon}
      </div>

      {/* Active Dot */}
      {active && (
        <div className="absolute bottom-2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)] animate-spring-up" />
      )}
    </button>
  )
}
