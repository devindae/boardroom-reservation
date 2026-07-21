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
  description: 'Official corporate meeting room and boardroom reservation portal for Ceylon Business Appliances (Pvt) Ltd. Schedule and manage your bookings efficiently.',
  keywords: ['CBA', 'Ceylon Business Appliances', 'Meeting Room', 'Reservation', 'Boardroom'],
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
        <Providers>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <footer className="w-full py-4 text-center text-xs text-muted-foreground mt-auto shrink-0 border-t border-border/40">
            Ceylon Business Appliances (Pvt) Ltd. © 2026
          </footer>
        </Providers>
      </body>
    </html>
  )
}
