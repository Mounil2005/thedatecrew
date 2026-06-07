import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Date Crew — Matchmaker OS',
  description: 'Internal matchmaking management platform for The Date Crew',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
