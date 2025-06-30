import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth';

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard', '/conversation', '/sentences', '/games'];

// Define auth routes that should redirect to dashboard if already authenticated
const authRoutes = ['/auth/login', '/auth/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get authentication token from Authorization header or localStorage (client-side)
  // Since middleware runs server-side, we'll check for the token in cookies if available
  // or let the client-side handle the redirect
  
  // For now, let's handle basic route protection
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Add headers to help with client-side routing decisions
  const response = NextResponse.next();
  
  if (isProtectedRoute) {
    response.headers.set('x-protected-route', 'true');
  }
  
  if (isAuthRoute) {
    response.headers.set('x-auth-route', 'true');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
