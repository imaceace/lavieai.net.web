import createMiddleware from 'next-intl/middleware';
import { routing } from './src/routing';

// Next.js middleware runs on the Edge runtime (required by Cloudflare/OpenNext).
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

