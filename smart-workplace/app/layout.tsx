import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/AuthContext'
import ClientOnly from '@/components/ClientOnly'
import './globals.css'

export const metadata: Metadata = {
  title: 'Smart Home Management',
  description: 'Hệ thống quản lý nhà thông minh',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ClientOnly fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ClientOnly>
        <Analytics />
      </body>
    </html>
  )
}
