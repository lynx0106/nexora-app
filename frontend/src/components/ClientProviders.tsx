"use client";

import "../i18n/config";
import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

export default function ClientProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  // Prevent hydration mismatch by rendering children only after mount if needed, 
  // but for i18n usually it's fine. 
  // However, to be safe with next.js hydration:
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Optional: return null or a loader to prevent flash of untranslated content 
    // if using detection that might change initial render.
    // For now, let's just render children to allow SEO/server content to match 
    // (though translation happens on client, so server sends keys or empty if not careful).
    // Actually, with client-side only i18n, server renders static, client hydrates and replaces.
    // To avoid hydration mismatch, we usually wait for mount.
    return <>{children}</>; 
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        storageKey="nexora-theme"
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
