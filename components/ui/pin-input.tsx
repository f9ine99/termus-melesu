"use client"

interface PinInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
}

export function PinInput({
  value,
  onChange,
  disabled,
  placeholder = "••••",
  autoFocus,
}: PinInputProps) {
  return (
    <input
      type="password"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={6}
      autoComplete="off"
      autoFocus={autoFocus}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      disabled={disabled}
      className="w-full px-4 py-3.5 bg-secondary border-none rounded-[1rem] text-center text-[20px] font-bold tracking-[0.4em] placeholder:text-muted-foreground placeholder:tracking-normal placeholder:text-[15px] focus:ring-2 focus:ring-primary/10 transition-all outline-none disabled:opacity-50"
    />
  )
}
