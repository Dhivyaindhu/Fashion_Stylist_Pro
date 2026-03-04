import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '3D Fashion Stylist Pro',
  description: 'AI body analysis, virtual try-on & recommendations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#06061a' }}>
        {children}
      </body>
    </html>
  )
}
