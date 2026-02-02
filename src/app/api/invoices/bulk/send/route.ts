import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-middleware';
import { enqueueBackgroundJob } from '@/lib/queue-helper';

// POST - Bulk send invoices
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invoiceIds } = await request.json();

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return NextResponse.json({ error: 'invoiceIds array is required' }, { status: 400 });
    }

    // Verify all invoices belong to user and are in draft/pending status
    // Include client data for queue processing
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select(`
        id,
        invoice_number,
        status,
        client_id,
        clients (
          name,
          email
        )
      `)
      .eq('user_id', user.id)
      .in('id', invoiceIds)
      .in('status', ['draft', 'pending']);

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ error: 'No valid invoices found to send' }, { status: 400 });
    }

    const useQueue = process.env.ENABLE_ASYNC_QUEUE === 'true';
    const queuedInvoices: string[] = [];
    const failedInvoices: string[] = [];

    // Process each invoice - try to queue, fallback to sync update
    for (const invoice of invoices) {
      const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
      const clientEmail = client?.email;
      const clientName = client?.name || '';

      if (!clientEmail) {
        console.warn(`Skipping invoice ${invoice.invoice_number}: missing client email`);
        failedInvoices.push(invoice.id);
        continue;
      }

      if (useQueue) {
        // Try to queue the invoice
        const queueResult = await enqueueBackgroundJob(
          'send_invoice',
          {
            invoiceId: invoice.id,
            clientEmail,
            clientName,
            userId: user.id,
          },
          {
            retries: 3,
            deduplicationId: `send_invoice_${invoice.id}_${Date.now()}`,
          }
        );

        if (queueResult.queued) {
          // Update invoice status to 'sent' IMMEDIATELY for better UX
          // This ensures UI updates right away, even though email sends in background
          if (invoice.status === 'draft') {
            await supabaseAdmin
              .from('invoices')
              .update({ status: 'sent', updated_at: new Date().toISOString() })
              .eq('id', invoice.id)
              .eq('user_id', user.id);
          }
          queuedInvoices.push(invoice.id);
          console.log(`✅ Invoice ${invoice.invoice_number} queued for sending (jobId: ${queueResult.jobId})`);
          continue;
        }

        // Queue failed, log and fall through to sync processing
        console.warn(`Queue failed for invoice ${invoice.invoice_number}, falling back to sync:`, queueResult.error);
      }

      // Fallback: Send invoice synchronously (for when queue is disabled or fails)
      // Use HTTP fetch to call the send endpoint (avoids routing issues)
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
          (request.url ? new URL(request.url).origin : 'http://localhost:3000');
        
        const authHeader = request.headers.get('Authorization');
        const sendResponse = await fetch(`${baseUrl}/api/invoices/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { 'Authorization': authHeader } : {}),
          },
          body: JSON.stringify({
            invoiceId: invoice.id,
            clientEmail,
            clientName,
          }),
        });

        if (!sendResponse.ok) {
          const errorData = await sendResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error(`Error sending invoice ${invoice.invoice_number}:`, errorData);
          failedInvoices.push(invoice.id);
          continue;
        }

        const sendResult = await sendResponse.json();
        if (sendResult.success) {
          queuedInvoices.push(invoice.id);
          console.log(`✅ Invoice ${invoice.invoice_number} sent successfully (sync mode)`);
        } else {
          console.error(`Failed to send invoice ${invoice.invoice_number}:`, sendResult.error || 'Unknown error');
          failedInvoices.push(invoice.id);
        }
      } catch (sendError: any) {
        console.error(`Error sending invoice ${invoice.invoice_number}:`, sendError?.message || sendError);
        failedInvoices.push(invoice.id);
      }
    }

    // Log events for successfully processed invoices
    if (queuedInvoices.length > 0) {
      const events = queuedInvoices.map(invoiceId => ({
        invoice_id: invoiceId,
        user_id: user.id,
        type: 'sent',
        metadata: { bulk: true, queued: useQueue }
      }));

      try {
        await supabaseAdmin.from('invoice_events').insert(events);
      } catch (eventError) {
        console.error('Error logging events:', eventError);
        // Don't fail the request if event logging fails
      }
    }

    const successCount = queuedInvoices.length;
    const failedCount = failedInvoices.length;

    if (successCount === 0) {
      return NextResponse.json({ 
        error: 'Failed to send all invoices',
        count: 0,
        failed: failedCount
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      queued: useQueue ? successCount : 0,
      failed: failedCount,
      invoiceNumbers: invoices
        .filter(inv => queuedInvoices.includes(inv.id))
        .map(inv => inv.invoice_number)
    });

  } catch (error) {
    console.error('Error in bulk send:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



