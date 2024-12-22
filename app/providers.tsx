"use client"

import { ThemeProvider } from "@/components/theme/theme-provider"
import { SessionProvider } from "next-auth/react"
import { SidebarProvider } from "@/components/ui/sidebar"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
