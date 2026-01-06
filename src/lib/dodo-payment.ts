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
      
      // Try different endpoints - Dodo Payment might use checkout-sessions instead
      const endpoints = [
        '/checkout-sessions',
        '/v1/checkout-sessions',
        '/api/v1/checkout-sessions',
        '/api/checkout-sessions',
        '/payments/create',
        '/v1/payments/create',
        '/api/v1/payments/create',
      ];
      
      // Try multiple authentication methods
      // Since X-API-Key returned 401 (recognized but unauthorized), it's likely the correct format
      // The 401 probably means: API key is correct format but endpoint or request format is wrong
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
      let lastSuccessfulEndpoint: string | null = null;
      
      // Try each endpoint with each auth method
      for (const endpoint of endpoints) {
        for (const authMethod of authMethods) {
          try {
            console.log(`🔍 Trying: ${authMethod.name} on ${this.baseUrl}${endpoint}`);
            
            // Try different request body formats
            const requestBodyVariations = [
              // Format 1: Standard format
              {
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
                mode: 'payment',
                ...(authMethod.bodyExtra || {}),
              },
              // Format 2: Checkout session format
              {
                amount: params.amount,
                currency: params.currency,
                description: params.description,
                customer_email: params.customerEmail,
                customer_name: params.customerName,
                metadata: params.metadata || {},
                successUrl: params.successUrl,
                cancelUrl: params.cancelUrl,
                ...(authMethod.bodyExtra || {}),
              },
              // Format 3: Minimal format
              {
                amount: params.amount,
                currency: params.currency,
                description: params.description,
                customerEmail: params.customerEmail,
                customerName: params.customerName,
                successUrl: params.successUrl,
                cancelUrl: params.cancelUrl,
                ...(authMethod.bodyExtra || {}),
              },
            ];
            
            for (let i = 0; i < requestBodyVariations.length; i++) {
              const requestBody = requestBodyVariations[i];
              const formatName = i === 0 ? 'standard' : i === 1 ? 'checkout-session' : 'minimal';
              
              console.log(`   📦 Trying body format: ${formatName}`);
              
              const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: authMethod.headers,
                body: JSON.stringify(requestBody),
              });

              // Get response text first to handle non-JSON responses
              const responseText = await response.text();
              
              // Log raw response for debugging
              console.log(`   Response (${formatName}):`, {
                status: response.status,
                statusText: response.statusText,
                responseLength: responseText.length,
                responsePreview: responseText.substring(0, 200)
              });

              // If 404, try next endpoint/auth/format combination
              if (response.status === 404) {
                continue; // Try next format
              }
              
              // If 405, endpoint exists but method/format wrong
              if (response.status === 405) {
                continue; // Try next format
              }
          
              // 401/403 means auth failed but endpoint exists
              if (response.status === 401 || response.status === 403) {
                // If this is the first 401 for this endpoint, note it
                if (!lastSuccessfulEndpoint || lastSuccessfulEndpoint !== endpoint) {
                  console.log(`   ⚠️ ${endpoint} returned ${response.status} - endpoint exists but auth/format wrong`);
                }
                continue; // Try next format
              }

              // Try to parse JSON, but handle empty or invalid responses
              let data;
              try {
                data = responseText ? JSON.parse(responseText) : {};
              } catch (parseError) {
                continue; // Try next format
              }

              if (!response.ok) {
                continue; // Try next format
              }

              // SUCCESS! We found the right combination
              lastSuccessfulEndpoint = endpoint;
              console.log(`✅ SUCCESS! Found working combination:`);
              console.log(`   Endpoint: ${endpoint}`);
              console.log(`   Auth: ${authMethod.name}`);
              console.log(`   Body format: ${formatName}`);
              console.log(`   Payment ID: ${data.payment_id || data.id || 'N/A'}`);

              return {
                success: true,
                paymentLink: data.payment_link_url || data.url || data.payment_link || data.checkout_url,
                paymentId: data.payment_id || data.id || data.session_id,
              };
            } // End of requestBodyVariations loop
          } catch (fetchError: any) {
            console.error(`Error trying ${authMethod.name} on ${endpoint}:`, fetchError);
            lastError = { error: fetchError.message, authMethod: authMethod.name, endpoint };
            continue;
          }
        } // End of authMethods loop
      } // End of endpoints loop
      
      // If we get here, all combinations failed
      console.error('❌ All endpoint/auth/format combinations failed.');
      console.error('💡 Since you have Read/Write access, the issue is likely:');
      console.error('   1. Wrong endpoint - Dodo might use a different path');
      console.error('   2. Wrong request body format - field names might be different');
      console.error('   3. API key might need to be activated/refreshed');
      console.error('   4. Check Dodo Payment API docs for exact endpoint and format');
      return {
        success: false,
        error: `Could not find working endpoint/format combination. Please check Dodo Payment API documentation for the correct endpoint and request format. Last tried: ${lastError?.endpoint || 'unknown'}`,
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

