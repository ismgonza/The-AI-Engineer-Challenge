import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Expert AI Assistant',
  description: 'A professional engineering documentation assistant with AI-powered analysis and Together AI integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="tech-bg">
        <div className="tech-container">
          {children}
        </div>
      </body>
    </html>
  )
} 