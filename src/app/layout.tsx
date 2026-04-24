import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
}

export const metadata: Metadata = {
  title: "Qui Lliga Més Aquest Estiu? 🔥",
  description: "Competició de lligues d'estiu entre amics. Qui lliga més? Segueix el marcador en temps real!",
  keywords: ["lligues", "estiu", "competició", "amigos", "marcador"],
  authors: [{ name: "El Grup" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-512.png",
  },
  openGraph: {
    title: "Qui Lliga Més Aquest Estiu? 🔥",
    description: "Competició de lligues d'estiu. Segueix el marcador en directe!",
    type: "website",
    locale: "ca_ES",
  },
  twitter: {
    card: "summary",
    title: "Qui Lliga Més Aquest Estiu? 🔥",
    description: "Competició de lligues d'estiu. Segueix el marcador en directe!",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QuiLliga",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
