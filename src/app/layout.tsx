import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/context/AuthContext';

export const metadata: Metadata = {
  title: 'SkillSwap | Your next skill starts here',
  description: 'Find people nearby who can help you learn, practise, and share useful skills.',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="brand-shell">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  )
}
