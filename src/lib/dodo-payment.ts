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
    // Sandbox: https://test.dodopayments.com
    // Production: https://api.dodopayments.com
    this.baseUrl = config.environment === 'sandbox' 
      ? 'https://test.dodopayments.com'
      : 'https://api.dodopayments.com';
  }

  /**
   * Create a payment link for subscription upgrade
   */
  async createPaymentLink(params: CreatePaymentLinkParams): Promise<DodoPaymentResponse> {
    try {
      // Use secretKey if available, otherwise use apiKey for authorization
      const authToken = this.secretKey || this.apiKey;
      
      // Log authentication info (first few chars only for security)
      console.log('🔐 Authentication:', {
        hasApiKey: !!this.apiKey,
        hasSecretKey: !!this.secretKey,
        apiKeyPrefix: this.apiKey ? `${this.apiKey.substring(0, 12)}...` : 'none',
        apiKeyLength: this.apiKey?.length || 0,
        environment: this.environment,
        note: 'Dodo Payment uses single API key. 401 means key recognized but may lack write permissions.'
      });
      
      // Try different endpoint and auth combinations
      const endpoint = '/payments/create';
      
      // Try multiple authentication methods
      // Since X-API-Key returned 401 (recognized but unauthorized), it's likely the correct format
      // The 401 probably means: API key is correct format but lacks write permissions
      const authMethods: Array<{ name: string; headers: Record<string, string>; bodyExtra?: Record<string, any> }> = [
        // Primary: X-API-Key header (we know this format is recognized)
        {
          name: 'X-API-Key header',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          }
        },
        // Try API key in Authorization header
        {
          name: 'Authorization header with API key',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.apiKey,
          }
        },
        // Try Bearer with API key
        {
          name: 'Bearer token with API key',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          }
        },
        // Try API-Key header (different casing)
        {
          name: 'API-Key header (no X prefix)',
          headers: {
            'Content-Type': 'application/json',
            'API-Key': this.apiKey,
          }
        },
        // Try api-key header (lowercase)
        {
          name: 'api-key header (lowercase)',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
          }
        },
        // Try with API key in body as well
        {
          name: 'X-API-Key header + api_key in body',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          bodyExtra: {
            api_key: this.apiKey,
          }
        },
      ];
      
      let lastError: any = null;
      
      for (const authMethod of authMethods) {
        try {
          console.log(`🔍 Trying auth method: ${authMethod.name} on ${this.baseUrl}${endpoint}`);
          
          const requestBody = {
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
            ...(authMethod.bodyExtra || {}), // Add any extra body params for this auth method
          };
          
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: authMethod.headers,
            body: JSON.stringify(requestBody),
          });

          // Get response text first to handle non-JSON responses
          const responseText = await response.text();
          
          // Log raw response for debugging
          console.log(`Dodo Payment API response (${authMethod.name}):`, {
            status: response.status,
            statusText: response.statusText,
            url: `${this.baseUrl}${endpoint}`,
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 200)
          });

          // If 404 or 405, try next auth method
          if (response.status === 404) {
            console.log(`❌ Auth method "${authMethod.name}" returned 404, trying next...`);
            lastError = { status: 404, authMethod: authMethod.name };
            continue;
          }
          
          if (response.status === 405) {
            console.log(`❌ Auth method "${authMethod.name}" returned 405 (Method Not Allowed), trying next...`);
            lastError = { status: 405, authMethod: authMethod.name, hint: 'Endpoint exists but authentication failed' };
            continue;
          }
          
          // 401/403 means auth failed but endpoint exists
          if (response.status === 401 || response.status === 403) {
            console.log(`❌ Auth method "${authMethod.name}" returned ${response.status} (Unauthorized)`);
            console.log(`   Response: ${responseText.substring(0, 200)}`);
            console.log(`   💡 IMPORTANT: This means the header format is CORRECT!`);
            console.log(`   🔧 The issue is likely:`);
            console.log(`      1. API key doesn't have WRITE ACCESS enabled`);
            console.log(`         → Go to Dodo Dashboard → Developer → API Keys`);
            console.log(`         → Find your key and enable "Write Access"`);
            console.log(`      2. API key is wrong/invalid`);
            console.log(`         → Copy the key fresh from Dodo dashboard`);
            console.log(`      3. API key is for wrong environment`);
            console.log(`         → Make sure you're using sandbox key for sandbox`);
            lastError = { status: response.status, authMethod: authMethod.name, responseText, hint: 'Header format correct - check API key has write access enabled' };
            continue;
          }

          // Try to parse JSON, but handle empty or invalid responses
          let data;
          try {
            data = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            console.error('Failed to parse Dodo Payment response as JSON:', {
              error: parseError,
              responseText: responseText.substring(0, 500)
            });
            lastError = { status: response.status, error: 'Invalid JSON response', endpoint };
            continue;
          }

          if (!response.ok) {
            console.error('Dodo Payment API error response:', {
              status: response.status,
              statusText: response.statusText,
              authMethod: authMethod.name,
              data
            });
            // For other errors, continue trying other auth methods
            lastError = { status: response.status, data, authMethod: authMethod.name };
            continue;
          }

          // Log successful payment link creation for debugging
          console.log(`✅ Dodo Payment link created using auth method: ${authMethod.name}`, {
            paymentId: data.payment_id || data.id,
            hasLink: !!(data.payment_link_url || data.url)
          });

          return {
            success: true,
            paymentLink: data.payment_link_url || data.url || data.payment_link,
            paymentId: data.payment_id || data.id,
          };
        } catch (fetchError: any) {
          console.error(`Error trying auth method ${authMethod.name}:`, fetchError);
          lastError = { error: fetchError.message, authMethod: authMethod.name };
          continue;
        }
      }
      
      // If we get here, all auth methods failed
      console.error('❌ All Dodo Payment authentication methods failed. Last error:', lastError);
      console.error('💡 SOLUTION: Check Dodo Payment documentation for:');
      console.error('   1. Correct authentication header format');
      console.error('   2. Verify your API key is valid and active');
      console.error('   3. Check if you need to enable API access in dashboard');
      return {
        success: false,
        error: `Authentication failed with all methods. Please verify your Dodo Payment API key is correct and active. Last status: ${lastError?.status || 'unknown'}`,
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

      // Get response text first to handle non-JSON responses
      const responseText = await response.text();
      
      // Try to parse JSON, but handle empty or invalid responses
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse Dodo Payment verification response as JSON:', {
          error: parseError,
          responseText: responseText.substring(0, 500)
        });
        return {
          success: false,
          error: `Invalid response from payment service. Status: ${response.status}`,
        };
      }

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

