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
      
      // According to Dodo Payment official docs:
      // - Endpoint: POST /checkouts
      // - Auth: Authorization: Bearer YOUR_API_KEY
      // - Body: Requires product_cart array with product_id and quantity
      const endpoint = '/checkouts';
      
      // Use Bearer token authentication as per official docs
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      };
      
      // According to Dodo Payment docs, checkout sessions require product_cart with product_id
      // We need to either:
      // 1. Create a product first (via Products API)
      // 2. Use an existing product_id from environment variable
      
      // Try to get product_id from environment or create one
      const productId = process.env.DODO_PAYMENT_PRODUCT_ID;
      
      if (!productId) {
        console.error('❌ DODO_PAYMENT_PRODUCT_ID not found in environment variables.');
        console.error('💡 SOLUTION: Create a product in Dodo Payment dashboard first:');
        console.error('   1. Go to Dodo Payment Dashboard → Products');
        console.error('   2. Create a new product (e.g., "Monthly Subscription - $9")');
        console.error('   3. Copy the product_id');
        console.error('   4. Add to Vercel: DODO_PAYMENT_PRODUCT_ID=your-product-id');
        console.error('');
        console.error('   OR we can create a product programmatically first...');
        
        // Try to create a product first
        try {
          console.log('🔧 Attempting to create product first...');
          const productResponse = await fetch(`${this.baseUrl}/products`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              name: `Subscription - ${params.metadata?.plan === 'monthly' ? 'Monthly' : 'Pay Per Invoice'}`,
              description: params.description,
              prices: [
                {
                  amount: Math.round(params.amount * 100), // Amount in cents
                  currency: params.currency.toUpperCase(),
                  billing_period: params.metadata?.plan === 'monthly' ? 'month' : undefined,
                }
              ],
            }),
          });
          
          const productData = await productResponse.json();
          if (productResponse.ok && productData.id) {
            console.log(`✅ Product created: ${productData.id}`);
            // Use the created product_id
            const createdProductId = productData.id;
            
            // Now create checkout session with this product
            const checkoutBody = {
              product_cart: [
                {
                  product_id: createdProductId,
                  quantity: 1,
                }
              ],
              customer: {
                email: params.customerEmail,
                name: params.customerName,
              },
              metadata: params.metadata || {},
              return_url: params.successUrl,
            };
            
            const checkoutResponse = await fetch(`${this.baseUrl}${endpoint}`, {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(checkoutBody),
            });
            
            const checkoutData = await checkoutResponse.json();
            if (checkoutResponse.ok) {
              return {
                success: true,
                paymentLink: checkoutData.checkout_url,
                paymentId: checkoutData.session_id,
              };
            }
          }
        } catch (productError) {
          console.error('Failed to create product:', productError);
        }
        
        return {
          success: false,
          error: 'DODO_PAYMENT_PRODUCT_ID environment variable is required. Please create a product in Dodo Payment dashboard and set DODO_PAYMENT_PRODUCT_ID in your environment variables.',
        };
      }
      
      // Use the product_id from environment
      const requestBody = {
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
            // If product supports "pay what you want", we can set amount
            ...(params.amount ? { amount: Math.round(params.amount * 100) } : {}),
          }
        ],
        customer: {
          email: params.customerEmail,
          name: params.customerName,
        },
        metadata: params.metadata || {},
        return_url: params.successUrl,
      };
      
      try {
        console.log(`🔍 Creating checkout session with product_id: ${productId}`);
        console.log(`   Using Authorization: Bearer (as per official docs)`);
        console.log(`   Endpoint: POST ${this.baseUrl}${endpoint}`);
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody),
        });

        // Get response text first to handle non-JSON responses
        const responseText = await response.text();
        
        // Log raw response for debugging
        console.log(`   Response:`, {
          status: response.status,
          statusText: response.statusText,
          responseLength: responseText.length,
          responsePreview: responseText.substring(0, 300)
        });

        // Try to parse JSON
        let data;
        try {
          data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.error(`   Failed to parse JSON:`, parseError);
          return {
            success: false,
            error: `Invalid JSON response from Dodo Payment: ${responseText.substring(0, 200)}`,
          };
        }

        if (!response.ok) {
          console.error(`   Error response:`, data);
          
          // Provide helpful error messages
          if (data.message?.toLowerCase().includes('product') || data.code?.toLowerCase().includes('product')) {
            return {
              success: false,
              error: `Product not found. Please verify DODO_PAYMENT_PRODUCT_ID is correct. Error: ${data.message || data.code}`,
            };
          }
          
          return {
            success: false,
            error: data.message || data.error || `Dodo Payment API error: ${response.status} ${response.statusText}`,
          };
        }

        // SUCCESS!
        console.log(`✅ SUCCESS! Checkout session created:`);
        console.log(`   Session ID: ${data.session_id || 'N/A'}`);
        console.log(`   Checkout URL: ${data.checkout_url || 'N/A'}`);

        return {
          success: true,
          paymentLink: data.checkout_url,
          paymentId: data.session_id,
        };
      } catch (fetchError: any) {
        console.error(`Error creating checkout session:`, fetchError);
        return {
          success: false,
          error: fetchError.message || 'Failed to create checkout session',
        };
      }
      
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
   * Dodo Payment uses Svix for webhooks - signature is base64 encoded HMAC-SHA256
   * Format: "v1,<base64_signature>" (we extract the base64 part before calling this)
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const crypto = require('crypto');
      
      if (!signature || !secret) {
        console.error('Missing signature or secret for webhook verification');
        return false;
      }
      
      // Dodo Payment uses Svix, which sends base64 encoded signatures
      // Signature should already be extracted (without "v1," prefix)
      const actualSignature = signature.trim();
      
      // Compute expected signature as base64 (Svix format)
      const expectedSignatureBase64 = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('base64');
      
      // Parse both as base64
      let receivedSignatureBytes: Buffer;
      let expectedSignatureBytes: Buffer;
      
      try {
        receivedSignatureBytes = Buffer.from(actualSignature, 'base64');
        expectedSignatureBytes = Buffer.from(expectedSignatureBase64, 'base64');
      } catch (parseError) {
        console.error('Failed to parse signature as base64:', {
          signaturePrefix: actualSignature.substring(0, 30),
          error: parseError,
        });
        return false;
      }
      
      // Check lengths BEFORE calling timingSafeEqual (critical!)
      if (receivedSignatureBytes.length !== expectedSignatureBytes.length) {
        console.warn('Webhook signature length mismatch:', {
          receivedLength: receivedSignatureBytes.length,
          expectedLength: expectedSignatureBytes.length,
          receivedBase64: actualSignature.substring(0, 40),
          expectedBase64: expectedSignatureBase64.substring(0, 40),
        });
        return false;
      }
      
      // Now safe to use timing-safe comparison
      return crypto.timingSafeEqual(receivedSignatureBytes, expectedSignatureBytes);
    } catch (error: any) {
      console.error('Webhook signature verification error:', {
        error: error.message,
        code: error.code,
        signatureLength: signature?.length,
        signaturePrefix: signature?.substring(0, 30),
        payloadLength: payload?.length,
      });
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

