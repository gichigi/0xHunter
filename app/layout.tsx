import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "The Hunter | Track the hidden movements in Ethereum's dark forest",
  description: "Every transaction leaves a trail. Every wallet tells a story. The Hunter sees what the dark forest hides.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
