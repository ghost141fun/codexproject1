import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  /**
   * This middleware is a pass-through for the Firebase-based application.
   * Supabase logic has been removed to align with the Data Connect architecture.
   */
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
