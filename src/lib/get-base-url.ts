/**
 * Get the base URL for the application
 * Works in both server-side and client-side contexts
 * Prioritizes environment variable, then Vercel URL, then request headers
 */
export function getBaseUrl(request?: Request): string {
  // First, check environment variable (most reliable)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // In Vercel production, use VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Try to get from request headers (server-side)
  if (request) {
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
    if (host) {
      return `${protocol}://${host}`;
    }
  }

  // Fallback: throw error in production, use localhost only in development
  if (process.env.NODE_ENV === 'production') {
    console.error('NEXT_PUBLIC_APP_URL environment variable is required in production');
    // Return empty string to prevent broken links rather than throwing
    return '';
  }

  // Development fallback only
  return 'http://localhost:3000';
}

/**
 * Get base URL from NextRequest (for API routes)
 */
export function getBaseUrlFromRequest(request: Request): string {
  return getBaseUrl(request);
}

