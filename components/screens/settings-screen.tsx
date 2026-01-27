"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useColorTheme, type ColorTheme } from "@/components/color-theme-provider"
import { logoutUser, updateUserName, updateUserPassword } from "@/lib/auth-store"
import { exportData, importData, getCustomers, getTransactions } from "@/lib/data-store"
import { pushAllDataToCloud, pullAllDataFromCloud, isSupabaseConfigured } from "@/lib/sync-service"
import type { SafeUser } from "@/lib/types"
import { ArrowLeftIcon, LogoutIcon, SettingsIcon, PeopleIcon, ChartIcon, SunIcon, MoonIcon, CheckIcon, DownloadIcon, UploadIcon, SendIcon, LockIcon, CloudIcon, ShieldCheckIcon } from "@/components/ui/icons"
import { LEGAL_CONFIG } from "@/lib/config"

import { PwaInstallPrompt } from "@/components/pwa-install-prompt"

interface SettingsScreenProps {
  user: SafeUser
  onLogout: () => void
  onBack: () => void
  t: (key: any, params?: any) => string
  language: string
  onToggleLanguage: () => void
  onNavigateToCustomers: () => void
  onNotifySuccess?: (message: string) => void
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void
}

export default function SettingsScreen({ user, onLogout, onBack, t, language, onToggleLanguage, onNavigateToCustomers, onNotifySuccess, onNotify }: SettingsScreenProps) {
  const { theme, setTheme } = useTheme()
  const { colorTheme, setColorTheme } = useColorTheme()
  const [mounted, setMounted] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Import State
  const [importFile, setImportFile] = useState<string | null>(null)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [isSyncing, setIsSyncing] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [newName, setNewName] = useState(user.name)
  const [newPassword, setNewPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    logoutUser()
    onLogout()
  }

  const handleExport = () => {
    const jsonString = exportData()
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url

    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.getHours().toString().padStart(2, '0') + '-' + now.getMinutes().toString().padStart(2, '0')

    a.download = `retra_backup_${date}_${time}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    onNotifySuccess?.(t("exportSuccess"))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setImportFile(content)
      setShowImportConfirm(true)
      // Reset input
      e.target.value = ""
    }
    reader.readAsText(file)
  }

  const confirmImport = async () => {
    if (!importFile) return

    const result = importData(importFile)
    if (result.success) {
      onNotifySuccess?.(t("importSuccess"))
      setShowImportConfirm(false)
      setImportFile(null)
      setError("")
      // Reload to reflect changes
      window.location.reload()
    } else {
      setError(t("importError"))
    }
  }

  const handleCloudRestore = () => {
    setShowRestoreConfirm(true)
  }

  const confirmRestore = async () => {
    setIsRestoring(true)
    const result = await pullAllDataFromCloud()
    setIsRestoring(false)

    if (result.success && result.customers && result.transactions) {
      // Safety check: Don't restore if cloud is empty
      if (result.customers.length === 0 && result.transactions.length === 0) {
        setError(t("noDataFoundInCloud"))
        return
      }

      // Rebuild local storage
      const importResult = importData(JSON.stringify({
        customers: result.customers,
        transactions: result.transactions
      }))

      if (importResult.success) {
        onNotifySuccess?.(t("restoreSuccess"))
        setShowRestoreConfirm(false)
        setError("")
        // Reload to reflect changes
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setError(t("restoreError"))
      }
    } else {
      setError(result.error || t("restoreError"))
    }
  }

  const handlePushToCloud = async () => {
    // Check network connectivity first
    if (!navigator.onLine) {
      onNotify?.("You're offline. Please check your internet connection and try again.", "error")
      return
    }

    const customers = getCustomers()
    const transactions = getTransactions().map(({ customerName, ...t }) => t) // Strip customerName

    if (customers.length === 0 && transactions.length === 0) {
      onNotify?.("No Data to Sync: Your local database is currently empty. Please add some customers or transactions before syncing to the cloud.", "error")
      return
    }

    setIsSyncing(true)
    const result = await pushAllDataToCloud(customers, transactions)
    setIsSyncing(false)

    if (result.success) {
      onNotifySuccess?.(t("pushSuccess"))
    } else if (result.error === 'already_synced') {
      onNotify?.("Already Synced: All your local data is already up to date in the cloud.", "info")
    } else if (result.error === 'Offline') {
      onNotify?.("You're offline. Please check your internet connection and try again.", "error")
    } else {
      // Use alert for critical configuration errors if notifySuccess is not enough
      if (result.error === 'Supabase not configured') {
        onNotify?.("Supabase is not configured. Please check your .env.local file.", "error")
      }
      onNotifySuccess?.(t("pushError") + ": " + result.error)
    }
  }

  const supabaseReady = isSupabaseConfigured()

  const handleUpdateName = async () => {
    if (!newName.trim()) return
    setIsUpdating(true)
    const result = await updateUserName(newName)
    setIsUpdating(false)
    if (result.success) {
      onNotifySuccess?.(t("updateSuccess"))
      // Keep modal open or close? User might want to change password too.
      // But name change triggers reload, so it will close anyway.
      setTimeout(() => window.location.reload(), 1000)
    } else {
      setError(result.error || t("updateError"))
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    setIsUpdating(true)
    const result = await updateUserPassword(newPassword)
    setIsUpdating(false)
    if (result.success) {
      onNotifySuccess?.(t("updateSuccess"))
      setNewPassword("")
    } else {
      setError(result.error || t("updateError"))
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="min-h-full bg-background flex flex-col relative overflow-hidden">
      <PwaInstallPrompt />
      {/* Background Accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] animate-pulse-subtle" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-secondary/20 rounded-full blur-[100px]" />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex items-center gap-4 sticky top-0 bg-background/60 backdrop-blur-xl z-20">
        <button
          onClick={onBack}
          className="p-3 bg-secondary/50 border border-border rounded-2xl active:scale-90 transition-transform"
        >
          <ArrowLeftIcon className="w-5 h-5 text-foreground" />
        </button>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-foreground">{t("settings")}</h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t("profileSettings")}</p>
        </div>
      </header>

      <main className="flex-1 px-6 pt-6 pb-32 overflow-y-auto no-scrollbar space-y-8 relative z-10">
        {/* User Profile Card - Premium */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2.5rem] p-8 shadow-premium space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-secondary flex items-center justify-center font-black text-3xl text-primary shadow-inner-soft">
              {user.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <p className="font-black text-xl tracking-tight text-foreground">{user.name.length > 10 ? `${user.name.slice(0, 10)}...` : user.name}</p>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">@{user.username}</p>
              <div className="mt-2 inline-block px-3 py-1 bg-primary/10 text-primary text-[8px] font-black rounded-full uppercase tracking-widest">
                Administrator
              </div>
            </div>
          </div>
        </div>

        {/* Settings Groups - Professional */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-1">Application</h3>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2.5rem] overflow-hidden shadow-soft">
              <SettingsItem
                icon={<PeopleIcon className="w-4 h-4" />}
                label={t("manageCustomers")}
                onClick={onNavigateToCustomers}
              />
              <SettingsItem
                icon={<SettingsIcon className="w-4 h-4" />}
                label={t("language")}
                value={language === "en" ? "English" : "አማርኛ"}
                onClick={onToggleLanguage}
              />
              <SettingsItem
                icon={<LockIcon className="w-4 h-4" />}
                label={t("manageAccount")}
                onClick={() => setShowAccountModal(true)}
              />

              {/* Theme Selector */}
              <div className="px-6 py-5 border-b border-border/50 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                    <div className="w-4 h-4 rounded-full bg-primary" />
                  </div>
                  <span className="text-sm font-black tracking-tight text-foreground/80">{t("theme")}</span>
                </div>
                <div className="grid grid-cols-4 gap-3 pl-14">
                  {(["violet", "blue", "green", "orange", "slate", "teal", "rose"] as ColorTheme[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setColorTheme(c)}
                      className={`h-12 rounded-2xl border-2 transition-all active:scale-95 flex items-center justify-center ${colorTheme === c
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-secondary hover:bg-secondary/80"
                        }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full shadow-sm"
                        style={{
                          backgroundColor:
                            c === "violet" ? "oklch(0.40 0.16 270)" :
                              c === "blue" ? "oklch(0.40 0.16 250)" :
                                c === "green" ? "oklch(0.40 0.16 150)" :
                                  c === "orange" ? "oklch(0.40 0.16 50)" :
                                    c === "slate" ? "oklch(0.35 0.04 260)" :
                                      c === "teal" ? "oklch(0.40 0.12 180)" :
                                        "oklch(0.50 0.15 10)" // rose
                        }}
                      />
                      {colorTheme === c && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckIcon className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <SettingsItem
                icon={mounted && theme === "dark" ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
                label={t("darkMode")}
                value={mounted ? (theme === "dark" ? "ON" : "OFF") : "..."}
                onClick={toggleTheme}
                isLast
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-1">{t("dataManagement")}</h3>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2.5rem] overflow-hidden shadow-soft">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors border-b border-border/50 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <DownloadIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm text-foreground">{t("backupData")}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t("downloadBackup")}</p>
                  </div>
                </div>
                <ArrowLeftIcon className="w-4 h-4 text-muted-foreground/30 rotate-180" />
              </button>

              <button
                onClick={() => document.getElementById('import-file')?.click()}
                className="w-full flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors border-b border-border/50 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <UploadIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm text-foreground">{t("restoreData")}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t("importBackup")}</p>
                  </div>
                </div>
                <ArrowLeftIcon className="w-4 h-4 text-muted-foreground/30 rotate-180" />
              </button>
              <input
                type="file"
                id="import-file"
                accept=".json"
                className="hidden"
                onChange={handleFileSelect}
              />

              <button
                onClick={handlePushToCloud}
                disabled={isSyncing}
                className="w-full flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors group disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${supabaseReady
                    ? "bg-green-500/10 text-green-600 group-hover:bg-green-500 group-hover:text-white"
                    : "bg-red-500/10 text-red-600"
                    }`}>
                    {isSyncing ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : !supabaseReady ? (
                      <LockIcon className="w-5 h-5" />
                    ) : (
                      <SendIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm text-foreground">
                      {t("syncToCloud")} {!supabaseReady && "(Not Configured)"}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      {isSyncing ? t("syncing") : t("pushAllData")}
                    </p>
                  </div>
                </div>
                <ArrowLeftIcon className="w-4 h-4 text-muted-foreground/30 rotate-180" />
              </button>

              <button
                onClick={handleCloudRestore}
                disabled={isRestoring || !supabaseReady}
                className="w-full flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors group disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${supabaseReady
                    ? "bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white"
                    : "bg-red-500/10 text-red-600"
                    }`}>
                    {isRestoring ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CloudIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm text-foreground">
                      {t("restoreFromCloud")} {!supabaseReady && "(Not Configured)"}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      {isRestoring ? t("restoring") : t("restoreData")}
                    </p>
                  </div>
                </div>
                <ArrowLeftIcon className="w-4 h-4 text-muted-foreground/30 rotate-180" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-1">{t("legal")}</h3>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2.5rem] overflow-hidden shadow-soft">
              <SettingsItem
                icon={<ShieldCheckIcon className="w-4 h-4" />}
                label={t("termsOfService")}
                onClick={() => window.open(LEGAL_CONFIG.TERMS_OF_SERVICE_URL, "_blank", "noopener,noreferrer")}
              />
              <SettingsItem
                icon={<LockIcon className="w-4 h-4" />}
                label={t("privacyPolicy")}
                onClick={() => window.open(LEGAL_CONFIG.PRIVACY_POLICY_URL, "_blank", "noopener,noreferrer")}
                isLast
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-1">Security</h3>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2.5rem] overflow-hidden shadow-soft">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-6 hover:bg-destructive/5 active:bg-destructive/10 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive group-hover:bg-destructive group-hover:text-white transition-all">
                    <LogoutIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm text-destructive">{t("logout")}</p>
                    <p className="text-[9px] font-bold text-destructive/60 uppercase tracking-widest">{t("logout")}</p>
                  </div>
                </div>
                <ArrowLeftIcon className="w-4 h-4 text-destructive/30 rotate-180" />
              </button>
            </div>
          </div>
        </div>

        {/* Manage Account Modal */}
        {showAccountModal && (
          <div className="fixed inset-0 bg-background/90 backdrop-blur-2xl flex items-center justify-center z-[100] animate-in fade-in duration-300 p-4">
            <div className="w-full max-w-sm bg-card border border-border rounded-[2.5rem] p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-300 h-fit overflow-hidden">
              <div className="space-y-1 text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <SettingsIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground">{t("manageAccount")}</h3>
              </div>

              <div className="space-y-4">
                {/* Name Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("newName")}</label>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={t("enterNewName")}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border/50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={isUpdating || !newName.trim() || newName === user.name}
                      className="w-full py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("confirm")}
                    </button>
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Password Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("newPassword")}</label>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t("enterNewPassword")}
                      className="w-full px-4 py-3 bg-secondary/50 border border-border/50 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                    <button
                      onClick={handleUpdatePassword}
                      disabled={isUpdating || !newPassword || newPassword.length < 6}
                      className="w-full py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("confirm")}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-[9px] font-black text-red-500 text-center uppercase tracking-widest">{error}</p>
                </div>
              )}

              <button
                onClick={() => {
                  setShowAccountModal(false)
                  setError("")
                  setNewName(user.name)
                  setNewPassword("")
                }}
                className="w-full py-4 bg-secondary text-foreground rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-border/50"
              >
                {t("back")}
              </button>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-50">Retra</p>
          <p className="text-[9px] text-muted-foreground font-bold opacity-30">VERSION 1.0.0</p>
        </div>
      </main>

      {/* Cloud Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-card border border-border rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CloudIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">{t("restoreConfirmTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("restoreConfirmMessage")}</p>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2">{t("warningOverwrite")}</p>
            </div>

            {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRestoreConfirm(false)
                  setError("")
                }}
                className="flex-1 py-4 bg-secondary text-foreground rounded-xl font-bold text-xs transition-all active:scale-95"
              >
                {t("cancel")}
              </button>
              <button
                onClick={confirmRestore}
                disabled={isRestoring}
                className="flex-1 py-4 bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {isRestoring ? t("restoring") : t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Modal */}
      {showImportConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-card border border-border rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UploadIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">{t("importConfirmTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("importConfirmMessage")}</p>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-2">{t("warningOverwrite")}</p>
            </div>

            {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowImportConfirm(false)
                  setImportFile(null)
                  setError("")
                }}
                className="flex-1 py-4 bg-secondary text-foreground rounded-xl font-bold text-xs transition-all active:scale-95"
              >
                {t("cancel")}
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 py-4 bg-orange-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95"
              >
                {t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center z-[100] animate-in fade-in duration-500 p-6">
          <div className="w-full max-w-md bg-card/95 backdrop-blur-3xl rounded-[3.5rem] p-10 space-y-8 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-12 duration-700 ease-out">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-destructive/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-2">
                <LogoutIcon className="w-10 h-10 text-destructive/80" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight text-foreground">{t("logoutConfirmTitle")}</h3>
                <p className="text-[13px] text-muted-foreground font-medium leading-relaxed px-4">
                  {t("logoutConfirmMessage")}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={confirmLogout}
                className="w-full py-5 bg-destructive text-destructive-foreground rounded-[1.5rem] font-black text-[14px] uppercase tracking-widest shadow-premium active:scale-[0.98] transition-all hover:brightness-110"
              >
                {t("logout")}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-5 bg-secondary/50 text-foreground rounded-[1.5rem] font-black text-[14px] uppercase tracking-widest active:scale-[0.98] transition-all hover:bg-secondary border border-border/50"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SettingsItem({ icon, label, value, onClick, isLast = false }: { icon: any, label: string, value?: string, onClick?: () => void, isLast?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-6 py-5 flex items-center justify-between group active:bg-secondary/50 transition-colors ${!isLast ? 'border-b border-border/50' : ''}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
        <span className="text-sm font-black tracking-tight text-foreground/80 group-hover:text-foreground transition-colors">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-secondary/80 px-2 py-1 rounded-lg">{value}</span>}
        <ArrowLeftIcon className="w-3 h-3 text-muted-foreground/30 rotate-180" />
      </div>
    </button>
  )
}
