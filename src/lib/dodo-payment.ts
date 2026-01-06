/**
 * Dodo Payment Integration
 * Handles payment processing for subscription upgrades
 */

export interface DodoPaymentConfig {
  apiKey: string;
  secretKey?: string; // Optional - some providers only use API key
  environment: 'sandbox' | 'production';
}

export interface CreatePaymentLinkParams {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerName: string;
  metadata?: Record<string, any>;
  successUrl: string;
  cancelUrl: string;
}

export interface DodoPaymentResponse {
  success: boolean;
  paymentLink?: string;
  paymentId?: string;
  error?: string;
}

class DodoPaymentClient {
  private apiKey: string;
  private secretKey: string | undefined;
  private baseUrl: string;
  private environment: 'sandbox' | 'production';

  constructor(config: DodoPaymentConfig) {
    this.apiKey = config.apiKey;
    this.secretKey = config.secretKey;
    this.environment = config.environment;
    
    // Dodo Payment API endpoints
    // Sandbox: https://api-sandbox.dodopayments.com
    // Production: https://api.dodopayments.com
    this.baseUrl = config.environment === 'sandbox' 
      ? 'https://api-sandbox.dodopayments.com'
      : 'https://api.dodopayments.com';
  }

  /**
   * Create a payment link for subscription upgrade
   */
  async createPaymentLink(params: CreatePaymentLinkParams): Promise<DodoPaymentResponse> {
    try {
      // Use secretKey if available, otherwise use apiKey for authorization
      const authToken = this.secretKey || this.apiKey;
      
      const response = await fetch(`${this.baseUrl}/v1/payment-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          // Some providers use X-API-Key header, some don't - include both for compatibility
          ...(this.apiKey && !this.secretKey ? { 'X-API-Key': this.apiKey } : {}),
        },
        body: JSON.stringify({
          amount: params.amount,
          currency: params.currency,
          description: params.description,
          customer: {
            email: params.customerEmail,
            name: params.customerName,
          },
          metadata: params.metadata || {},
          success_url: params.successUrl,
          cancel_url: params.cancelUrl,
          mode: 'payment', // One-time payment
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Dodo Payment API error response:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        return {
          success: false,
          error: data.message || data.error || `Failed to create payment link (${response.status})`,
        };
      }

      // Log successful payment link creation for debugging
      console.log('✅ Dodo Payment link created:', {
        paymentId: data.payment_id || data.id,
        hasLink: !!(data.payment_link_url || data.url)
      });

      return {
        success: true,
        paymentLink: data.payment_link_url || data.url || data.payment_link,
        paymentId: data.payment_id || data.id,
      };
    } catch (error: any) {
      console.error('Dodo Payment API error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment link',
      };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const authToken = this.secretKey || this.apiKey;
      
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...(this.apiKey && !this.secretKey ? { 'X-API-Key': this.apiKey } : {}),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Failed to verify payment',
        };
      }

      return {
        success: true,
        status: data.status || data.payment_status,
      };
    } catch (error: any) {
      console.error('Dodo Payment verification error:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify payment',
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Dodo Payment webhook signature verification
    // Implementation depends on Dodo's webhook signature method
    // This is a placeholder - update based on Dodo's documentation
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }
}

/**
 * Get Dodo Payment client instance
 */
export function getDodoPaymentClient(): DodoPaymentClient | null {
  const apiKey = process.env.DODO_PAYMENT_API_KEY;
  const secretKey = process.env.DODO_PAYMENT_SECRET_KEY; // Optional
  const environment = (process.env.DODO_PAYMENT_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

  if (!apiKey) {
    console.warn('Dodo Payment API key not configured');
    return null;
  }

  // Some providers only use API key, not a separate secret key
  // If secretKey is not provided, we'll use apiKey for authorization
  return new DodoPaymentClient({
    apiKey,
    secretKey: secretKey || undefined, // Only include if provided
    environment,
  });
}

/**
 * Get payment amount for subscription plan
 */
export function getPlanAmount(plan: 'monthly' | 'pay_per_invoice'): number {
  if (plan === 'monthly') {
    return 9.00; // $9/month
  } else if (plan === 'pay_per_invoice') {
    return 0.50; // $0.50 per invoice
  }
  return 0;
}

