
import { cookies } from "next/headers"

import { SidebarProvider, SidebarTrigger } from "@/components/sidebar/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}