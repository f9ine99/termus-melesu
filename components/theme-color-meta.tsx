"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

export function ThemeColorMeta() {
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        // Update theme-color meta tag based on current theme
        const themeColor = resolvedTheme === "dark" ? "#0a0a0a" : "#f8fafc"

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
    }, [resolvedTheme])

    return null
}
