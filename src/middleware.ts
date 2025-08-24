import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/members', '/settings', '/projects', '/clients', '/attendance', '/accounts'];
const authRoutes = ['/login'];

// Get backend URL from environment or use default
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL


async function checkAuthentication(request: NextRequest): Promise<boolean> {
  try {
    console.log('SSSSSSSSSSSSSSSS');

    const cookieHeader = request.headers.get('cookie') || '';

    console.log(cookieHeader);
   
    const token = cookieHeader.split("=")[1];
    
    return Boolean(token);
  } catch (error) {
    console.error('Auth check failed:', error);
    // On error, assume not authenticated for security
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // If it's not a protected route or auth route, allow access
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }


  const isAuthenticated = await checkAuthentication(request);
  
  console.log('Middleware Debug:', {
    pathname,
    isProtectedRoute,
    isAuthRoute,
    isAuthenticated,
    backendUrl: BACKEND_URL,
    userAgent: request.headers.get('user-agent')?.substring(0, 50)
  });

  // Handle protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Add the attempted URL as a query parameter for post-login redirect
    loginUrl.searchParams.set('redirect', pathname);
    
    return NextResponse.redirect(loginUrl);
  }
  
  // Handle auth routes (prevent authenticated users from accessing login)
  if (isAuthRoute && isAuthenticated) {
    // Check if there's a redirect parameter
    const redirectUrl = request.nextUrl.searchParams.get('redirect');
    const targetUrl = redirectUrl && protectedRoutes.some(route => redirectUrl.startsWith(route)) 
      ? redirectUrl 
      : '/dashboard';
    
    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  // For all other cases, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
