/**
 * Get the base URL for the application
 * Works in both server-side and client-side contexts
 * Prioritizes environment variable, then Vercel URL, then request headers
 */
export function getBaseUrl(request?: Request): string {
  // First, check environment variable (most reliable)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    // Ensure it doesn't contain localhost in production
    let envUrl = process.env.NEXT_PUBLIC_APP_URL.trim();
    // Remove trailing slash if present
    envUrl = envUrl.replace(/\/$/, '');
    
    if (process.env.NODE_ENV === 'production' && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      console.warn('NEXT_PUBLIC_APP_URL contains localhost in production. This may cause issues.');
      // Use production fallback instead
      return 'https://invoice-flow-vert.vercel.app';
    }
    
    // Ensure URL has protocol
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
      envUrl = `https://${envUrl}`;
    }
    
    console.log('Using NEXT_PUBLIC_APP_URL:', envUrl);
    return envUrl;
  }

  // In Vercel production, use VERCEL_URL
  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL.trim();
    // VERCEL_URL might already include protocol, or might not
    if (vercelUrl.startsWith('http://') || vercelUrl.startsWith('https://')) {
      return vercelUrl;
    }
    return `https://${vercelUrl}`;
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
      // Don't use localhost in production - use production URL instead
      if (process.env.NODE_ENV === 'production' && (host.includes('localhost') || host.includes('127.0.0.1'))) {
        console.error('Request host is localhost in production. Using production fallback URL.');
        // Production fallback URL
        return 'https://invoice-flow-vert.vercel.app';
      }
      return `${protocol}://${host}`;
    }
  }

  // Fallback: use production URL in production, localhost in development
  if (process.env.NODE_ENV === 'production') {
    console.warn('No base URL found. Using production fallback URL: https://invoice-flow-vert.vercel.app');
    return 'https://invoice-flow-vert.vercel.app';
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

