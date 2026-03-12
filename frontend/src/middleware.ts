import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get('jobsearchai_token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // Note: localStorage is not accessible in middleware. 
  // For a robust implementation, we should use cookies for the token.
  // But since we are using localStorage in the frontend, let's just 
  // allow the frontend to handle redirection for now, or 
  // we can add a check in each page component.
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
}
