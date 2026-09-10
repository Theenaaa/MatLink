// proxy.ts — Route protection for MatLink platform
// Note: In Next.js 16, middleware.ts is renamed to proxy.ts
// The export must be named 'proxy' (not 'middleware')

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read auth session from cookie (set by client-side sessionStorage mirror)
  // For this prototype, we skip server-side JWT and rely on client-side guards
  // Production would validate a signed token here

  // Allow root '/' to serve the Government of India landing page

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)',
  ],
};
