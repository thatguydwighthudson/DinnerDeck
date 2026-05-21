import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DinnerDeck',
  description: 'Family dinner planner',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: { capable: true, title: 'DinnerDeck' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
