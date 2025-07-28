import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Engineer Challenge - Mario World Terminal',
  description: 'A Mario World style console terminal for the AI Engineer Challenge',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="mario-bg">
        <div className="mario-container">
          {children}
        </div>
      </body>
    </html>
  )
} 