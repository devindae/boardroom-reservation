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
      <body className="h-full font-sans bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
