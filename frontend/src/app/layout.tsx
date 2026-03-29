import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import '../styles/globals.css'

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: 'ShrubHub - Your AI Gardening Companion',
  description: 'Track your plants, get personalized care advice, and grow your garden with AI-powered insights.',
  keywords: ['gardening', 'plants', 'AI', 'plant care', 'garden tracking'],
  authors: [{ name: 'ShrubHub' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#228B1B',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
