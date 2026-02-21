import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '👗 3D Fashion Stylist',
  description: 'AI-powered body analysis, 3D avatar & virtual try-on',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
