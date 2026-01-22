"use client"

import { useState, useMemo, useEffect } from "react"
import { getCustomers, addTransaction, deleteTransaction, addCustomer, updateCustomerTrustStatus, getCustomerInventory } from "@/lib/data-store"
import type { Customer, Transaction, BottleType, TransactionType, BottleCategory, TransactionItem, InventoryItem } from "@/lib/types"
import { SendIcon, ReceiveIcon, BottleIcon, UserPlusIcon, CheckIcon, UndoIcon, XIcon, SearchIcon, TrashIcon } from "@/components/ui/icons"

interface RecordTransactionFormProps {
  onTransactionComplete?: () => void
  onNavigateBack?: () => void
  onSuccess?: (message: string, transactionId?: string) => void
  initialCustomerId?: string
  fixedType?: TransactionType
  t: (key: any, params?: any) => string
  language: string
}

const BOTTLE_RATES: Record<string, number> = {
  "Soft Drink": 50,
  "Beer": 50,
  "Wine": 80,
  "Sofi": 50,
  "Other": 50,
}

const BOTTLE_BRANDS: Record<BottleCategory, string[]> = {
  "Soft Drink": ["Coca-Cola", "Mirinda", "Ambo-Water"],
  "Beer": ["Harer", "Habesha", "Bedele (500ml)", "Bedele (300ml)", "St. George"],
  "Wine": ["Awash", "Guder"],
  "Sofi": ["Sofi Malt", "Ngus", "Sinqe"],
  "Other": ["Custom"],
}

export default function RecordTransactionForm({ onTransactionComplete, onNavigateBack, onSuccess, initialCustomerId, fixedType, t, language }: RecordTransactionFormProps) {
  const allCustomers = useMemo(() => getCustomers(), [])

  // Form state
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")

  // Initialize customer from prop
  useEffect(() => {
    if (initialCustomerId) {
      const found = getCustomers().find(c => c.id === initialCustomerId)
      if (found) setCustomer(found)
    }
  }, [initialCustomerId])

  const [transactionType, setTransactionType] = useState<TransactionType>(fixedType || "issue")
  const [category, setCategory] = useState<BottleCategory>("Soft Drink")
  const [brand, setBrand] = useState<string>(BOTTLE_BRANDS["Soft Drink"][0])
  const [bottleType, setBottleType] = useState<BottleType>("Soft Drink (300ML)")
  const [bottleCount, setBottleCount] = useState(1)
  const [depositAmount, setDepositAmount] = useState(0)
  const [note, setNote] = useState("")
  const [cart, setCart] = useState<TransactionItem[]>([])

  const [showConfirm, setShowConfirm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [inputError, setInputError] = useState<string>("")
  const [customerError, setCustomerError] = useState<string | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])

  // Fetch inventory when customer changes
  useEffect(() => {
    if (customer) {
      setInventory(getCustomerInventory(customer.id))
    } else {
      setInventory([])
    }
  }, [customer])

  // Auto-calculate deposit/refund
  useEffect(() => {
    if (customer) {
      const rate = BOTTLE_RATES[category] || 40
      if (transactionType === "issue" && customer.trustStatus !== "approved") {
        setDepositAmount(bottleCount * rate)
      } else if (transactionType === "return") {
        // Auto-calculate refund for returns
        setDepositAmount(bottleCount * rate)
      } else {
        setDepositAmount(0)
      }
    }
  }, [customer, bottleCount, transactionType, category])

  // Calculate preview - include both cart items AND current form values
  const currentOutstanding = customer?.bottlesOutstanding || 0
  const currentDeposits = customer?.depositsHeld || 0

  const cartTotalBottles = cart.reduce((sum, item) => sum + item.bottleCount, 0)
  const cartTotalDeposit = cart.reduce((sum, item) => sum + item.depositAmount, 0)

  // Include current form values for live preview (what will be added when clicking "Add to Cart" or "Confirm")
  const previewTotalBottles = cartTotalBottles + (bottleCount > 0 ? bottleCount : 0)
  const previewTotalDeposit = cartTotalDeposit + (bottleCount > 0 ? depositAmount : 0)

  const newOutstanding =
    transactionType === "issue" ? currentOutstanding + previewTotalBottles : Math.max(0, currentOutstanding - previewTotalBottles)
  const newDeposits =
    transactionType === "issue" ? currentDeposits + previewTotalDeposit : Math.max(0, currentDeposits - previewTotalDeposit)

  // Validation
  const isFormValid = useMemo(() => {
    if (!customer) return false

    // Calculate total bottles being returned (Cart + Current Form)
    const totalReturnCount = transactionType === "return"
      ? cartTotalBottles + bottleCount
      : 0

    if (transactionType === "return" && totalReturnCount > currentOutstanding) return false

    if (cart.length > 0) return true // Cart has items, so we can confirm
    if (bottleCount <= 0) return false

    return true
  }, [customer, bottleCount, transactionType, currentOutstanding, cart, cartTotalBottles])

  const handleAddToCart = () => {
    if (bottleCount <= 0) return

    // Check if adding this item would exceed total outstanding
    const totalReturnCount = transactionType === "return" ? cartTotalBottles + bottleCount : 0
    if (transactionType === "return" && totalReturnCount > currentOutstanding) {
      setInputError(t("returnLimitExceeded"))
      return
    }

    const newItem: TransactionItem = {
      category,
      brand,
      bottleType,
      bottleCount,
      depositAmount
    }

    setCart([...cart, newItem])

    // Reset form defaults for next item
    setBottleCount(1)
    // Keep category/brand same for convenience or reset? Let's keep same.
    onSuccess?.(t("itemAddedToCart"))
  }

  const handleRemoveFromCart = (index: number) => {
    const newCart = [...cart]
    newCart.splice(index, 1)
    setCart(newCart)
  }

  const handleConfirmTransaction = async () => {
    if (!isFormValid || !customer) return

    setIsProcessing(true)
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // If cart is empty but form has valid data, treat as single item transaction (auto-add to cart logic)
    // But better to force "Add to Cart" flow or just use cart.
    // Let's assume if cart is empty, we add current form item.
    const finalCart = cart.length > 0 ? cart : [{
      category,
      brand,
      bottleType,
      bottleCount,
      depositAmount
    }]

    const totalBottles = finalCart.reduce((sum, item) => sum + item.bottleCount, 0)
    const totalDeposit = finalCart.reduce((sum, item) => sum + item.depositAmount, 0)

    // Use the first item's details for summary fields, but store full list in items
    const summaryItem = finalCart[0]

    const transaction: Transaction = {
      id: `txn_${Date.now()}`,
      customerId: customer.id,
      type: transactionType,
      category: summaryItem.category,
      brand: summaryItem.brand,
      bottleType: summaryItem.bottleType,
      bottleCount: totalBottles,
      depositAmount: totalDeposit,
      items: finalCart,
      notes: note,
      timestamp: new Date(),
    }

    addTransaction(transaction)
    setLastTransactionId(transaction.id)
    onSuccess?.(`Successfully ${transactionType === "issue" ? "issued" : "returned"} ${bottleCount} ${brand} (${category}) to ${customer.name}`, transaction.id)

    // Refresh customer data to reflect new status/balance
    const updatedCustomer = getCustomers().find(c => c.id === customer.id)
    if (updatedCustomer) setCustomer(updatedCustomer)

    // Reset form
    setCart([])
    setBottleCount(1)
    setNote("")
    setShowConfirm(false)
    setIsProcessing(false)

    onTransactionComplete?.()

    // Redirect after a short delay to let the user see the success state
    setTimeout(() => {
      onNavigateBack?.()
    }, 1500)
  }

  const handleUndo = () => {
    if (lastTransactionId) {
      deleteTransaction(lastTransactionId)
      setLastTransactionId(null)
      onSuccess?.(t("transactionUndone"), lastTransactionId)
      onTransactionComplete?.()
    }
    onNavigateBack?.()
  }

  const handleAddNewCustomer = () => {
    if (!newCustomerName || !newCustomerPhone) return

    // Validate phone length (prefix + 9 digits = 13 chars)
    if (newCustomerPhone.length !== 13) {
      setCustomerError("Phone number must be 9 digits after +251")
      return
    }

    const newCustomer: Customer = {
      id: `c_${Date.now()}`,
      name: newCustomerName,
      phone: newCustomerPhone,
      address: newCustomerAddress,
      trustStatus: "pending",
      bottlesOutstanding: 0,
      depositsHeld: 0,
    }

    const result = addCustomer(newCustomer)

    if (!result.success) {
      setCustomerError(result.error || t("error"))
      return
    }

    setCustomer(newCustomer)
    setIsAddingNewCustomer(false)
    onSuccess?.(`${t("customerCreated")}: ${newCustomer.name}`)
    setNewCustomerName("")
    setNewCustomerPhone("")
    setNewCustomerAddress("")
    setCustomerError(null)
    onTransactionComplete?.()
  }

  const filteredCustomers = searchTerm
    ? allCustomers.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm))
    : allCustomers.slice(0, 5)

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Customer Section */}
      <section className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">{t("selectCustomer")}</label>
          {!isAddingNewCustomer && transactionType !== "return" && (
            <button
              onClick={() => setIsAddingNewCustomer(true)}
              className="text-[11px] font-black text-primary uppercase tracking-widest bg-primary/5 px-4 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
            >
              + {t("addNewCustomer")}
            </button>
          )}
        </div>

        {isAddingNewCustomer ? (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[3rem] p-8 space-y-6 shadow-soft animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">{t("newCustomerProfile")}</h3>
              <button onClick={() => setIsAddingNewCustomer(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                <XIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-1">{t("fullName")}</label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => {
                    setNewCustomerName(e.target.value)
                    setCustomerError(null)
                  }}
                  placeholder={t("enterCustomerName")}
                  className={`w-full px-6 py-5 bg-card/50 backdrop-blur-sm border ${customerError ? 'border-red-500' : 'border-border'} rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-soft`}
                />
                {customerError && (
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1">{customerError}</p>
                )}
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-1">{t("phoneNumber")}</label>
                <input
                  type="tel"
                  placeholder="+251 9..."
                  value={newCustomerPhone}
                  onChange={(e) => {
                    let val = e.target.value
                    // Ensure it starts with +251
                    if (!val.startsWith('+251')) {
                      val = '+251' + val.replace(/^\+?2?5?1?/, '')
                    }
                    // Only allow digits after +251
                    const prefix = '+251'
                    const rest = val.slice(4).replace(/\D/g, '')
                    // Limit to 9 digits after prefix
                    const finalVal = prefix + rest.slice(0, 9)

                    setNewCustomerPhone(finalVal)
                    setCustomerError(null)
                  }}
                  className={`w-full px-6 py-5 bg-secondary/50 border ${customerError?.includes('phone') ? 'border-red-500' : 'border-border/50'} rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 shadow-inner-soft`}
                />
              </div>
              <input
                type="text"
                placeholder={t("deliveryAddressOptional")}
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
                className="w-full px-6 py-5 bg-secondary/50 border border-border/50 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 shadow-inner-soft"
              />
            </div>
            <button
              onClick={handleAddNewCustomer}
              disabled={!newCustomerName || !newCustomerPhone}
              className="w-full py-5 bg-primary text-primary-foreground rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] disabled:opacity-50 active:scale-[0.98] transition-all shadow-premium"
            >
              {t("createAndSelect")}
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className={`flex items-center gap-5 px-6 py-5 bg-card/50 backdrop-blur-sm border ${showCustomerList ? 'border-primary ring-4 ring-primary/10' : 'border-border'} rounded-[2rem] transition-all shadow-soft group`}>
              <SearchIcon className={`w-5 h-5 transition-colors ${showCustomerList ? 'text-primary' : 'text-muted-foreground'}`} />
              <input
                type="text"
                placeholder={t("searchByNameOrPhone")}
                value={showCustomerList ? searchTerm : customer?.name || ""}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowCustomerList(true)
                }}
                onFocus={() => setShowCustomerList(true)}
                className="flex-1 bg-transparent border-none p-0 text-base font-black tracking-tight placeholder:text-muted-foreground/40 focus:ring-0"
              />
              {customer && !showCustomerList && (
                <button onClick={() => setCustomer(null)} className="p-1.5 hover:bg-secondary rounded-full transition-colors">
                  <XIcon className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>

            {showCustomerList && (
              <div className="absolute top-full left-0 right-0 mt-4 bg-card/80 backdrop-blur-2xl border border-border rounded-[2.5rem] shadow-premium z-[50] max-h-80 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-4 duration-300">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCustomer(c)
                        setShowCustomerList(false)
                        setSearchTerm("")
                      }}
                      className="w-full text-left px-8 py-5 hover:bg-primary/5 border-b border-border/50 last:border-b-0 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center font-black text-primary text-base group-hover:bg-primary group-hover:text-white transition-all">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-sm tracking-tight text-foreground">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{c.phone}</p>
                        </div>
                      </div>
                      <div className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${c.trustStatus === 'approved' ? 'bg-green-500/10 text-green-600' :
                        c.trustStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-red-500/10 text-red-600'
                        }`}>
                        {c.trustStatus}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-8 py-12 text-center space-y-5">
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">{t("noMatchingRecords")}</p>
                    {transactionType !== "return" && (
                      <button
                        onClick={() => {
                          setIsAddingNewCustomer(true)
                          setShowCustomerList(false)
                          setNewCustomerName(searchTerm)
                        }}
                        className="px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                      >
                        + {t("createCustomer", { name: searchTerm })}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Overlay to close list */}
            {showCustomerList && (
              <div className="fixed inset-0 z-[40]" onClick={() => setShowCustomerList(false)} />
            )}
          </div>
        )}
      </section>

      {/* 2. Transaction Details */}
      <section className={`space-y-10 transition-all duration-500 ${!customer ? 'opacity-20 grayscale pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
        {/* Transaction Type Toggle - Hidden if fixedType is provided */}
        {!fixedType && (
          <div className="flex p-1.5 bg-secondary/50 backdrop-blur-sm border border-border rounded-[2rem] shadow-inner-soft">
            <button
              onClick={() => {
                setTransactionType("issue")
              }}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] transition-all duration-500 ${transactionType === "issue"
                ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <SendIcon className={`w-5 h-5 ${transactionType === "issue" ? "animate-pulse" : ""}`} />
              <span className="text-xs font-black uppercase tracking-[0.2em]">{t("issue")}</span>
            </button>
            <button
              onClick={() => {
                setTransactionType("return")
                setIsAddingNewCustomer(false) // Close add customer form if open
              }}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] transition-all duration-500 ${transactionType === "return"
                ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <ReceiveIcon className={`w-5 h-5 ${transactionType === "return" ? "animate-pulse" : ""}`} />
              <span className="text-xs font-black uppercase tracking-[0.2em]">{t("return")}</span>
            </button>
          </div>
        )}

        {/* Quick Return Section */}
        {transactionType === "return" && customer && inventory.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-black uppercase tracking-[0.3em] text-primary">{t("quickReturn")}</label>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t("itemsBorrowed")}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inventory.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCategory(item.category)
                    setBrand(item.brand)
                    setBottleType(item.bottleType)
                    setBottleCount(item.count)
                    onSuccess?.(t("itemSelected"))
                  }}
                  className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-2xl hover:bg-primary/10 hover:border-primary/20 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <BottleIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-foreground leading-tight">{item.brand}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{item.bottleType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary">{item.count}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">{t("bottles")}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Row: Category & Brand */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-1">{t("category")}</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => {
                  const newCat = e.target.value as BottleCategory
                  setCategory(newCat)
                  setBrand(BOTTLE_BRANDS[newCat][0])
                  // Update default bottleType based on category
                  if (newCat === "Soft Drink") setBottleType("Soft Drink (300ML)")
                  else if (newCat === "Beer") setBottleType("Beer")
                  else if (newCat === "Wine") setBottleType("Wine")
                  else if (newCat === "Sofi") setBottleType("Sofi Malt")
                  else setBottleType("Other")
                }}
                className="w-full px-6 py-5 bg-card/50 backdrop-blur-sm border border-border rounded-[1.5rem] text-sm font-black tracking-tight focus:ring-2 focus:ring-primary/20 transition-all shadow-soft appearance-none"
              >
                <option value="Soft Drink">{t("softDrink")}</option>
                <option value="Beer">{t("beer")}</option>
                <option value="Wine">{t("wine")}</option>
                <option value="Sofi">{t("sofi")}</option>
                <option value="Other">{t("other")}</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                <BottleIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-1">{t("brandType")}</label>
            <div className="relative">
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-6 py-5 bg-card/50 backdrop-blur-sm border border-border rounded-[1.5rem] text-sm font-black tracking-tight focus:ring-2 focus:ring-primary/20 transition-all shadow-soft appearance-none"
              >
                {BOTTLE_BRANDS[category].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                <SearchIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Row: Size & Quantity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-1">{t("bottleSize")}</label>
            <div className="relative">
              <select
                value={bottleType}
                onChange={(e) => setBottleType(e.target.value as BottleType)}
                className="w-full px-6 py-5 bg-card/50 backdrop-blur-sm border border-border rounded-[1.5rem] text-sm font-black tracking-tight focus:ring-2 focus:ring-primary/20 transition-all shadow-soft appearance-none"
              >
                <option value="Soft Drink (300ML)">{t("softDrink300ML")}</option>
                <option value="Beer">{t("beer")}</option>
                <option value="Wine">{t("wine")}</option>
                <option value="Sofi Malt">{t("sofiMalt")}</option>
                <option value="500ML">{t("500ML")}</option>
                <option value="300ML">{t("300ML")}</option>
                <option value="Other">{t("customSize")}</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                <BottleIcon className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-1">{t("quantity")}</label>
            <div className="flex items-center bg-card/50 backdrop-blur-sm border border-border rounded-[1.5rem] shadow-soft overflow-hidden h-[64px]">
              <button
                onClick={() => setBottleCount(Math.max(1, bottleCount - 1))}
                className="w-16 h-full flex items-center justify-center text-muted-foreground active:bg-secondary transition-colors font-black text-2xl"
              >
                −
              </button>
              <input
                type="number"
                value={bottleCount}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0)
                  const remainingLimit = Math.max(0, currentOutstanding - cartTotalBottles)

                  if (transactionType === "return" && val > remainingLimit) {
                    setBottleCount(remainingLimit)
                    setInputError(t("returnLimitExceeded"))
                  } else {
                    setBottleCount(val)
                    setInputError("")
                  }
                }}
                className="flex-1 text-center text-lg font-black bg-transparent border-none focus:ring-0 p-0 tracking-tighter"
              />
              <button
                onClick={() => {
                  const remainingLimit = Math.max(0, currentOutstanding - cartTotalBottles)
                  if (transactionType === "return" && bottleCount >= remainingLimit) {
                    setInputError(t("returnLimitExceeded"))
                    return
                  }
                  setBottleCount(bottleCount + 1)
                  setInputError("")
                }}
                className={`w-16 h-full flex items-center justify-center active:bg-secondary transition-colors font-black text-2xl ${transactionType === "return" && bottleCount >= Math.max(0, currentOutstanding - cartTotalBottles) ? "text-muted-foreground/20 cursor-not-allowed" : "text-primary"
                  }`}
              >
                +
              </button>
            </div>
            {transactionType === "return" && (
              <div className="flex justify-between items-center px-1">
                <p className="text-[9px] font-black text-primary uppercase tracking-widest">
                  {t("maxReturn")}: {Math.max(0, currentOutstanding - cartTotalBottles)} {t("units")}
                </p>
                {inputError && (
                  <p className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                    {inputError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row: Deposit & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
                {transactionType === "return" ? t("refundAmount") : t("depositAmount")}
              </label>
              <div className="flex items-center gap-2">
                {customer && transactionType === "issue" && (
                  <button
                    onClick={() => {
                      const newStatus = customer.trustStatus === "approved" ? "pending" : "approved"
                      updateCustomerTrustStatus(customer.id, newStatus)
                      setCustomer({ ...customer, trustStatus: newStatus })
                      onSuccess?.(t("trustStatusUpdated"))
                    }}
                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all active:scale-95 ${customer.trustStatus === "approved"
                      ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                      : "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                      }`}
                  >
                    {customer.trustStatus === "approved" ? t("revokeTrust") : t("markAsTrusted")}
                  </button>
                )}
                <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">{t("autoCalc")}</span>
              </div>
            </div>
            <div className="relative group">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground group-focus-within:text-primary transition-colors">ETB</span>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full pl-14 pr-6 py-5 bg-card/50 backdrop-blur-sm border border-border rounded-[1.5rem] text-base font-black tracking-tight focus:ring-2 focus:ring-primary/20 transition-all shadow-soft"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-1">{t("transactionRemarks")}</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("addInternalNotes")}
              className="w-full px-6 py-5 bg-card/50 backdrop-blur-sm border border-border rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-soft placeholder:text-muted-foreground/30"
            />
          </div>
        </div>

        {/* Action Section */}
        <div className="space-y-8 pt-8">
          {customer && (
            <div className="bg-secondary/30 rounded-[2.5rem] p-8 border border-border/50 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("projectedBalance")}</p>
                <p className="text-2xl font-black tracking-tight text-foreground">{newOutstanding} <span className="text-xs opacity-50">{t("units")}</span></p>
              </div>
              <div className="h-12 w-[1px] bg-border/50" />
              <div className="space-y-2 text-right">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("totalDeposits")}</p>
                <p className="text-2xl font-black tracking-tight text-foreground">ETB {newDeposits.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground px-1">{t("cartSummary")}</h3>
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2rem] p-6 space-y-4 shadow-soft">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <BottleIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">{item.brand} ({item.category})</p>
                        <p className="text-[10px] font-bold text-muted-foreground">{item.bottleCount} × {item.bottleType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-black text-foreground">ETB {item.depositAmount}</p>
                      <button onClick={() => handleRemoveFromCart(index)} className="p-2.5 bg-secondary/50 text-muted-foreground hover:bg-red-500 hover:text-white rounded-xl transition-all shrink-0">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-4 flex justify-between items-center border-t border-border">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{t("total")}</p>
                  <div className="text-right">
                    <p className="text-lg font-black text-foreground">{cartTotalBottles} {t("units")}</p>
                    <p className="text-xs font-bold text-primary">ETB {cartTotalDeposit}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleAddToCart}
              disabled={!customer || bottleCount <= 0 || (transactionType === "return" && bottleCount > currentOutstanding)}
              className="py-6 bg-secondary text-foreground rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-soft active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {t("addToCart")}
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={cart.length === 0 && (!isFormValid || isProcessing)}
              className="py-6 bg-primary text-primary-foreground rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-premium active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("validating")}
                </div>
              ) : t("authorizeEntry")}
            </button>
          </div>
        </div>
      </section>

      {/* Confirmation Modal - Clean & Simple */}
      {showConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-card border border-border rounded-[2rem] p-8 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground">{t("verifyEntry")}</h3>
              <p className="text-xs text-muted-foreground">{t("confirmTransactionDetails")}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("customer")}</span>
                <span className="text-sm font-bold text-foreground">{customer?.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("type")}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${transactionType === 'issue' ? 'text-primary' : 'text-green-600'}`}>
                  {transactionType === 'issue' ? t("issue") : t("return")}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t("items")}</span>
                <div className="text-right">
                  {cart.length > 0 ? (
                    cart.map((item, i) => (
                      <p key={i} className="text-sm font-bold text-foreground">{item.bottleCount} × {item.brand} ({item.category})</p>
                    ))
                  ) : (
                    <p className="text-sm font-bold text-foreground">{bottleCount} × {brand} ({category})</p>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {transactionType === 'issue' ? t("deposit") : t("refund")}
                </span>
                <span className="text-sm font-bold text-foreground">ETB {(cart.length > 0 ? cartTotalDeposit : depositAmount).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-4 bg-secondary text-foreground rounded-xl font-bold text-xs transition-all active:scale-95"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleConfirmTransaction}
                className="flex-[2] py-4 bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95"
              >
                {t("confirmEntry")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
