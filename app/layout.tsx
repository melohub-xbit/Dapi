import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import RouteGuard from '@/components/auth/RouteGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DAPI - AI Language Learning Platform',
  description: 'Personalized, scenario-based language learning with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <RouteGuard>
            {children}
          </RouteGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
