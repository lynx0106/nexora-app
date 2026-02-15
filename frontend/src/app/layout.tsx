import type { Metadata } from "next";
import { Space_Grotesk, Fraunces } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEXORA – El núcleo inteligente de tu negocio.",
  description: "NEXORA, el núcleo inteligente de tu negocio. Plataforma SaaS para gestión empresarial.",
  icons: {
    icon: "/favicon.ico",
  },
};

import ClientProviders from "../components/ClientProviders";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${spaceGrotesk.variable} ${fraunces.variable} antialiased`}>
        <ClientProviders>
          <div className="ds-page">{children}</div>
        </ClientProviders>
      </body>
    </html>
  );
}
