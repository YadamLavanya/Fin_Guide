"use client"

import { ThemeProvider } from "@/components/theme/theme-provider"
import { SessionProvider } from "next-auth/react"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
          {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
