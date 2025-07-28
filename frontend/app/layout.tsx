import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Engineer Challenge - Retro Terminal',
  description: 'A retro-future style console terminal for the AI Engineer Challenge',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="terminal-bg crt-effect">
        <div className="scan-line"></div>
        {children}
      </body>
    </html>
  )
} 