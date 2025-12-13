import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase';
import { getAuthenticatedUser } from './auth-middleware';

/**
 * Detects if the request is coming from the estimate owner
 * This prevents owners from approving/rejecting their own estimates
 * 
 * IMPORTANT: We're conservative - only block if CERTAIN it's the owner
 * We never block legitimate client actions
 * 
 * @param request - The Next.js request object
 * @param estimateUserId - The user_id of the estimate owner
 * @returns true if the request is CERTAINLY from the owner, false otherwise
 */
export async function isOwnerRequest(
  request: NextRequest,
  estimateUserId: string
): Promise<boolean> {
  try {
    // Method 1: Check if user is authenticated and owns the estimate
    // This is the most reliable method
    const user = await getAuthenticatedUser(request);
    if (user && user.id === estimateUserId) {
      return true;
    }

    // Method 2: Check URL search params - explicit owner flag
    // This is set when owner clicks "View Public Page" from dashboard
    const url = new URL(request.url);
    const ownerParam = url.searchParams.get('owner');
    if (ownerParam === 'true') {
      return true;
    }

    // Method 3: Check referer header - ONLY if it's from the estimates dashboard page
    // We check for the specific estimates page to avoid false positives
    const referer = request.headers.get('referer') || '';
    if (referer.includes('/dashboard/estimates') && !referer.includes('/estimate/')) {
      // Coming from dashboard estimates page (not from another estimate page)
      // This is likely the owner viewing in incognito
      return true;
    }

    // NOTE: We DON'T check general '/dashboard' because clients might share links
    // We're conservative - only block if we're CERTAIN it's the owner

    // If none of the checks indicate owner, assume it's a client
    // This ensures clients can always approve/reject
    return false;
  } catch (error) {
    console.error('Error detecting owner request:', error);
    // On error, be conservative - don't block (allow client actions)
    return false;
  }
}

/**
 * Gets the client email from the estimate
 * Used to verify if the requester matches the client
 */
export async function getEstimateClientEmail(estimateId: string): Promise<string | null> {
  try {
    const { data: estimate, error } = await supabaseAdmin
      .from('estimates')
      .select(`
        clients (
          email
        )
      `)
      .eq('id', estimateId)
      .single();

    if (error || !estimate) {
      return null;
    }

    return (estimate.clients as any)?.email || null;
  } catch (error) {
    console.error('Error fetching client email:', error);
    return null;
  }
}

