'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface RouteGuardProps {
  children: React.ReactNode;
}

const protectedRoutes = ['/dashboard', '/conversation', '/sentences', '/games'];
const authRoutes = ['/auth/login', '/auth/signup']; // Removed forgot-password

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    if (!loading) {
      if (isProtectedRoute && !user) {
        router.push('/auth/login');
      } else if (isAuthRoute && user) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, isProtectedRoute, isAuthRoute, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Don't render protected routes if user is not authenticated
  if (isProtectedRoute && !user) {
    return null; // Will redirect via useEffect
  }

  // Don't render auth routes if user is already authenticated
  if (isAuthRoute && user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
