"use client";

import "../i18n/config";
import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "./ErrorBoundary";
import ToastProvider from "./ToastProvider";

export default function ClientProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme="dark"
        enableSystem={false}
      >
        <ErrorBoundary>
          {children}
          <ToastProvider />
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
