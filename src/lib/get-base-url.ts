/**
 * Get the base URL for the application
 * Works in both server-side and client-side contexts
 * Prioritizes environment variable, then Vercel URL, then request headers
 */
export function getBaseUrl(request?: Request): string {
  // First, check environment variable (most reliable)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    // Ensure it doesn't contain localhost in production
    const envUrl = process.env.NEXT_PUBLIC_APP_URL.trim();
    if (process.env.NODE_ENV === 'production' && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      console.warn('NEXT_PUBLIC_APP_URL contains localhost in production. This may cause issues.');
    }
    return envUrl;
  }

  // In Vercel production, use VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Try to get from request headers (server-side)
  if (request) {
    // Try x-forwarded-host first (for proxied requests)
    let host = request.headers.get('x-forwarded-host');
    let protocol = request.headers.get('x-forwarded-proto') || 'https';
    
    // If no x-forwarded-host, try regular host header
    if (!host) {
      host = request.headers.get('host');
      // Try to determine protocol from request URL
      try {
        const url = new URL(request.url);
        protocol = url.protocol.replace(':', '');
      } catch {
        protocol = 'https';
      }
    }
    
    if (host) {
      // Don't use localhost in production
      if (process.env.NODE_ENV === 'production' && (host.includes('localhost') || host.includes('127.0.0.1'))) {
        console.error('Request host is localhost in production. NEXT_PUBLIC_APP_URL must be set.');
        return '';
      }
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

