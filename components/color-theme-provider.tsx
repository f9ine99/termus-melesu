"use client"

import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react"

export type ColorTheme = "violet" | "blue" | "green" | "orange" | "slate" | "teal" | "rose"

interface ColorThemeContextType {
    colorTheme: ColorTheme
    setColorTheme: (theme: ColorTheme) => void
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined)

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
    const [colorTheme, setColorTheme] = useState<ColorTheme>("violet")
    const [mounted, setMounted] = useState(false)

    useLayoutEffect(() => {
        const savedTheme = localStorage.getItem("color-theme") as ColorTheme | null
        if (savedTheme) {
            setColorTheme(savedTheme)
            document.documentElement.setAttribute("data-theme", savedTheme)
        }
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute("data-theme", colorTheme)
            localStorage.setItem("color-theme", colorTheme)
        }
    }, [colorTheme, mounted])

    return (
        <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
            {children}
        </ColorThemeContext.Provider>
    )
}

export function useColorTheme() {
    const context = useContext(ColorThemeContext)
    if (context === undefined) {
        throw new Error("useColorTheme must be used within a ColorThemeProvider")
    }
    return context
}
