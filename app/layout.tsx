import type React from "react"
import type { Metadata } from "next"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "0xHunter | Track the hidden movements in Ethereum's dark forest",
  description: "Every transaction leaves a trail. Every wallet tells a story. 0xHunter sees what the dark forest hides.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistMono.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
