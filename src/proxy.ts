import createMiddleware from 'next-intl/middleware';
import { routing } from './routing';
import { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const middleware = createMiddleware(routing);
  return middleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
