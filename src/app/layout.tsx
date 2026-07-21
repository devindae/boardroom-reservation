import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Internal Meeting Room Reservation System',
  description: 'Simple, modern, and responsive Outlook-inspired internal company meeting room reservation app.',
  keywords: ['Meeting Room', 'Reservation', 'Boardroom', 'Calendar', 'Outlook Scheduling'],
  authors: [{ name: 'Internal Corporate Services' }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
