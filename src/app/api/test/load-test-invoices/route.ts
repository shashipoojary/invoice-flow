import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';
import { v4 as uuidv4 } from 'uuid';

/**
 * Load Test Route - Creates and sends multiple invoices for testing
 * 
 * WARNING: This route bypasses subscription limits for testing purposes.
 * Only use in development or with proper authentication.
 * 
 * Usage:
 * POST /api/test/load-test-invoices
 * Body: {
 *   count: 50,              // Number of invoices to create (1-100)
 *   email: "test@example.com", // Email to send invoices to
 *   sendImmediately: true,   // Whether to send invoices immediately
 *   bypassLimits: true       // Bypass subscription limits (for testing)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Safety check: Only allow in development or with secret token
    const isDevelopment = process.env.NODE_ENV === 'development';
    const secretToken = request.headers.get('x-test-secret');
    const validSecret = process.env.TEST_SECRET_TOKEN;
    
    // Check ENABLE_LOAD_TEST (case-insensitive, trimmed)
    // Also check VERCEL_ENV as fallback (Vercel sets this automatically)
    const enableLoadTestRaw = process.env.ENABLE_LOAD_TEST;
    const vercelEnv = process.env.VERCEL_ENV; // 'production', 'preview', or 'development'
    const enableInProduction = enableLoadTestRaw?.toLowerCase().trim() === 'true';
    
    // Debug logging (only in production to help troubleshoot)
    if (!isDevelopment) {
      console.log('🔍 Load Test Debug:', {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: vercelEnv,
        ENABLE_LOAD_TEST: enableLoadTestRaw,
        enableInProduction,
        hasSecretToken: !!secretToken,
        hasValidSecret: !!validSecret,
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('LOAD') || k.includes('TEST')).join(', '),
      });
    }
    
    // Allow if:
    // 1. Development mode, OR
    // 2. ENABLE_LOAD_TEST=true is set (for production testing), OR
    // 3. Valid secret token is provided
    if (!isDevelopment && !enableInProduction && (!secretToken || secretToken !== validSecret)) {
      return NextResponse.json({ 
        error: 'Load testing only allowed in development or with valid secret token',
        hint: `Set ENABLE_LOAD_TEST=true in Vercel environment variables (Production environment) and redeploy. Current value: "${enableLoadTestRaw || 'not set'}". VERCEL_ENV: "${vercelEnv || 'not set'}"`,
        debug: !isDevelopment ? {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_ENV: vercelEnv || 'not set',
          ENABLE_LOAD_TEST: enableLoadTestRaw || 'not set',
          enableInProduction: false,
          troubleshooting: [
            '1. Go to Vercel Dashboard → Settings → Environment Variables',
            '2. Add ENABLE_LOAD_TEST with value "true"',
            '3. Make sure "Production" environment is selected (not just Preview/Development)',
            '4. Click "Save" and then "Redeploy" your latest deployment',
            '5. Wait for deployment to complete before testing again'
          ]
        } : undefined
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      count = 10,
      email = user.email || 'test@example.com',
      sendImmediately = true,
      bypassLimits = false
    } = body;

    // Validate count
    if (count < 1 || count > 100) {
      return NextResponse.json({ 
        error: 'Count must be between 1 and 100' 
      }, { status: 400 });
    }

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json({ 
        error: 'Valid email is required' 
      }, { status: 400 });
    }

    console.log(`🧪 Load Test: Creating ${count} invoices for ${email}`);

    // Get or create a test client
    let clientId: string;
    const { data: existingClient } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .eq('email', email)
      .limit(1)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
      console.log(`✅ Using existing client: ${clientId}`);
    } else {
      // Create test client (may fail if limit reached, but that's okay for testing)
      const { data: newClient, error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          user_id: user.id,
          name: 'Test Client (Load Test)',
          email: email,
          company: 'Test Company',
        })
        .select('id')
        .single();

      if (clientError) {
        // If client creation fails (e.g., limit reached), try to use any existing client
        const { data: anyClient } = await supabaseAdmin
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (anyClient) {
          clientId = anyClient.id;
          console.log(`⚠️ Using existing client due to limit: ${clientId}`);
        } else {
          return NextResponse.json({ 
            error: 'No client available. Please create a client first.',
            details: clientError.message
          }, { status: 400 });
        }
      } else {
        clientId = newClient.id;
        console.log(`✅ Created test client: ${clientId}`);
      }
    }

    const results = {
      created: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
      invoiceIds: [] as string[],
      startTime: Date.now(),
    };

    // Create invoices sequentially to avoid overwhelming the system
    for (let i = 0; i < count; i++) {
      try {
        const invoiceNumber = `TEST-${Date.now()}-${i + 1}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabaseAdmin
          .from('invoices')
          .insert({
            user_id: user.id,
            client_id: clientId,
            invoice_number: invoiceNumber,
            public_token: uuidv4(),
            currency: 'USD',
            subtotal: 100 + (i * 10), // Varying amounts
            tax: 0,
            discount: 0,
            total: 100 + (i * 10),
            due_date: dueDate.toISOString().split('T')[0],
            status: sendImmediately ? 'draft' : 'draft', // Will be updated to 'sent' when sent
            issue_date: new Date().toISOString().split('T')[0],
          })
          .select('id, invoice_number')
          .single();

        if (invoiceError) {
          // Check if it's a subscription limit error
          if (invoiceError.message?.includes('Subscription limit reached')) {
            if (bypassLimits) {
              // For testing, we could try to delete old test invoices, but that's complex
              // Instead, just skip and continue
              console.log(`⚠️ Subscription limit reached at invoice ${i + 1}, skipping...`);
              results.errors.push(`Invoice ${i + 1}: Subscription limit reached`);
              continue;
            } else {
              results.errors.push(`Invoice ${i + 1}: ${invoiceError.message}`);
              results.failed++;
              continue;
            }
          }
          
          results.errors.push(`Invoice ${i + 1}: ${invoiceError.message}`);
          results.failed++;
          continue;
        }

        // Create invoice items
        const { error: itemsError } = await supabaseAdmin
          .from('invoice_items')
          .insert({
            invoice_id: invoice.id,
            description: `Test Item ${i + 1}`,
            rate: 100 + (i * 10),
            line_total: 100 + (i * 10),
          });

        if (itemsError) {
          // Rollback invoice
          await supabaseAdmin.from('invoices').delete().eq('id', invoice.id);
          results.errors.push(`Invoice ${i + 1}: Failed to create items - ${itemsError.message}`);
          results.failed++;
          continue;
        }

        results.created++;
        results.invoiceIds.push(invoice.id);

        // Send invoice if requested
        if (sendImmediately) {
          try {
            const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invoices/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('authorization') || '',
              },
              body: JSON.stringify({
                invoiceId: invoice.id,
                clientEmail: email,
                clientName: 'Test Client (Load Test)',
              }),
            });

            if (sendResponse.ok) {
              results.sent++;
            } else {
              const errorData = await sendResponse.json();
              results.errors.push(`Invoice ${i + 1} send failed: ${errorData.error || 'Unknown error'}`);
            }
          } catch (sendError) {
            results.errors.push(`Invoice ${i + 1} send error: ${sendError instanceof Error ? sendError.message : 'Unknown error'}`);
          }
        }

        // Small delay to avoid overwhelming the system
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between invoices
        }

      } catch (error) {
        results.failed++;
        results.errors.push(`Invoice ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - results.startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      summary: {
        requested: count,
        created: results.created,
        sent: results.sent,
        failed: results.failed,
        duration: `${duration}s`,
        queueEnabled: process.env.ENABLE_ASYNC_QUEUE === 'true',
      },
      invoiceIds: results.invoiceIds,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });

  } catch (error) {
    console.error('Load test error:', error);
    return NextResponse.json({
      error: 'Load test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

