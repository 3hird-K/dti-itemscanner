"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode } from "react"
import { OnlinePresenceProvider } from "@/components/online-presence-provider"

const queryClient = new QueryClient()

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <OnlinePresenceProvider>
          {children}
        </OnlinePresenceProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  )
}
