import type React from "react"
import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import "./globals.css"

export const metadata: Metadata = {
  title: "0xHunter | Track the hidden movements in Ethereum's dark forest",
  description: "Every transaction leaves a trail. Every wallet tells a story. 0xHunter sees what the dark forest hides.",
  openGraph: {
    title: "0xHunter | Track the hidden movements in Ethereum's dark forest",
    description: "Every transaction leaves a trail. Every wallet tells a story. 0xHunter sees what the dark forest hides.",
    url: "https://0xhunter.app",
    siteName: "0xHunter",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "0xHunter | Track the hidden movements in Ethereum's dark forest",
    description: "Every transaction leaves a trail. Every wallet tells a story. 0xHunter sees what the dark forest hides.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistMono.variable} ${GeistSans.variable}`}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
