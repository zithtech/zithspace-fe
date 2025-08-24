import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/members', '/settings', '/projects', '/clients', '/attendance', '/accounts'];
const authRoutes = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/')
  ) {
    return NextResponse.next();
  }
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Check for JWT refresh token in cookies (our backend sets this)
  const accessToken = localStorage.get('accessToken');
  
  // Also check for access token in localStorage (handled client-side)
  // Since middleware runs server-side, we'll primarily rely on refresh token
  const isAuthenticated = !!accessToken;

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect authenticated users from auth routes
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
