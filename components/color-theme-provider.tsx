"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type ColorTheme = "violet" | "blue" | "green" | "orange" | "slate" | "teal" | "rose"

interface ColorThemeContextType {
    colorTheme: ColorTheme
    setColorTheme: (theme: ColorTheme) => void
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined)

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
    const [colorTheme, setColorTheme] = useState<ColorTheme>("violet")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        const savedTheme = localStorage.getItem("color-theme") as ColorTheme
        if (savedTheme) {
            setColorTheme(savedTheme)
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
