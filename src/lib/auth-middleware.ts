import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { sql } from './postgres';

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return null;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      
      // Get user from database
      const [user] = await sql`
        SELECT 
          id, 
          email, 
          subscription_plan, 
          subscription_id, 
          dodo_subscription_id, 
          pay_per_invoice_activated_at,
          email_verified, 
          created_at
        FROM users
        WHERE id = ${decoded.userId}::uuid
      `;
      
      if (!user) {
        return null;
      }

      // Return user in format similar to Supabase user for compatibility
      return {
        id: user.id,
        email: user.email,
        // Add other fields as needed by your application
        subscription_plan: user.subscription_plan,
        subscription_id: user.subscription_id,
        dodo_subscription_id: user.dodo_subscription_id,
        pay_per_invoice_activated_at: user.pay_per_invoice_activated_at,
        email_verified: user.email_verified,
        created_at: user.created_at,
      };
    } catch (jwtError) {
      // Token is invalid or expired
      if (jwtError instanceof jwt.JsonWebTokenError) {
        console.error('JWT verification error:', jwtError.message);
      }
      return null;
    }
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return null;
  }
}
