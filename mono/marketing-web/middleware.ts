import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  return NextResponse.rewrite(new URL(request.nextUrl.pathname.replace(/^\/marketing-web/,''), request.url))
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/marketing-web/_next/:path*',
}