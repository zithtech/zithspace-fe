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

  // If it's not a protected route or auth route, allow access
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Check for JWT refresh token in cookies
  const refreshToken = request.cookies.get('refreshToken');
  const refreshTokenValue = refreshToken?.value;
  
  // Enhanced authentication check
  const isAuthenticated = !!(refreshTokenValue && refreshTokenValue.length > 10);
  
  // Add debug logging for production troubleshooting
  if (process.env.NODE_ENV === 'production') {
    console.log('Middleware Debug:', {
      pathname,
      isProtectedRoute,
      isAuthRoute,
      hasRefreshToken: !!refreshTokenValue,
      tokenLength: refreshTokenValue?.length || 0,
      isAuthenticated,
      userAgent: request.headers.get('user-agent')?.substring(0, 50)
    });
  }

  // Handle protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Add the attempted URL as a query parameter for post-login redirect
    loginUrl.searchParams.set('redirect', pathname);
    
    const response = NextResponse.redirect(loginUrl);
    
    // Clear any potentially corrupted cookies
    response.cookies.delete('refreshToken');
    
    return response;
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
