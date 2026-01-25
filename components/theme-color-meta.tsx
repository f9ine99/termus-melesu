"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

export function ThemeColorMeta() {
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        // Small delay to ensure CSS has loaded and applied
        const updateThemeColor = () => {
            // Get the actual computed background color from the document
            const computedStyle = getComputedStyle(document.documentElement)
            const bgColor = computedStyle.getPropertyValue('--background').trim()

            // Convert oklch to a usable color or use fallback
            // Note: Some browsers may not return oklch properly, so we use fallbacks
            let themeColor: string

            if (resolvedTheme === "dark") {
                themeColor = "#0f0f11" // Dark fallback that matches oklch(0.08 0.03 270)
            } else {
                themeColor = "#ffffff" // Pure white for light mode
            }

            // Find existing theme-color meta tag or create one
            let metaThemeColor = document.querySelector('meta[name="theme-color"]')

            if (metaThemeColor) {
                metaThemeColor.setAttribute("content", themeColor)
            } else {
                metaThemeColor = document.createElement("meta")
                metaThemeColor.setAttribute("name", "theme-color")
                metaThemeColor.setAttribute("content", themeColor)
                document.head.appendChild(metaThemeColor)
            }
        }

        // Run after a small delay to ensure styles are applied
        const timeoutId = setTimeout(updateThemeColor, 50)

        return () => clearTimeout(timeoutId)
    }, [resolvedTheme])

    return null
}
