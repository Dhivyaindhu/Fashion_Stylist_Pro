import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       '3D Fashion Stylist Pro',
  description: 'AI body analysis, 3D avatar, virtual try-on & smart recommendations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
