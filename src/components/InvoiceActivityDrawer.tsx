'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Mail, Eye as EyeIcon, Download as DownloadIcon, Send as SendIcon, Clock, Link as LinkIcon, Copy, DollarSign } from 'lucide-react';
import type { Invoice } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  at: string;
  icon: 'sent' | 'delivered' | 'opened' | 'clicked' | 'downloaded' | 'paid' | 'created' | 'scheduled' | 'failed' | 'overdue' | 'copied';
  details?: string;
};

export default function InvoiceActivityDrawer({ invoice, open, onClose }: { invoice: Invoice; open: boolean; onClose: () => void }) {
  const { getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Prevent body and main scroll when drawer is open (simple approach)
  useEffect(() => {
    if (open) {
      const originalBodyOverflow = document.body.style.overflow;
      const mainElement = document.querySelector('main') as HTMLElement;
      const originalMainOverflow = mainElement ? mainElement.style.overflow : '';
      
      document.body.style.overflow = 'hidden';
      if (mainElement) {
        mainElement.style.overflow = 'hidden';
      }
      
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        if (mainElement) {
          mainElement.style.overflow = originalMainOverflow;
        }
      };
    }
  }, [open]);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!open || !invoice?.id) return;
      try {
        setLoading(true);
        const items: ActivityItem[] = [];
        
        // Track event types to prevent duplicates from multiple sources
        const eventTypes = new Set<string>();
        // Track events by type and timestamp to prevent exact duplicates
        const eventMap = new Map<string, ActivityItem>();
        
        // Invoice events from database
        const { data: events } = await supabase
          .from('invoice_events')
          .select('*')
          .eq('invoice_id', invoice.id)
          .order('created_at', { ascending: false });
        
        // Fetch payment data for sent/pending invoices
        const fetchedPayments = await (async () => {
          if ((invoice.status === 'sent' || invoice.status === 'pending') && invoice.id) {
            try {
              const headers = await getAuthHeaders();
              const response = await fetch(`/api/invoices/${invoice.id}/payments`, { headers });
              if (response.ok) {
                const paymentData = await response.json();
                return paymentData.payments || [];
              }
            } catch (error) {
              // Silently fail
            }
          }
          return [];
        })();
        const payments = fetchedPayments;
        
        // Track viewed_by_customer events separately to show only the latest one
        let latestViewedEvent: any = null;
        
        // CRITICAL: For privacy and legal compliance, find when invoice was marked as paid
        // Do not show any activity events after the invoice was marked as paid
        let paidEventTimestamp: Date | null = null;
        if (invoice.status === 'paid' && events) {
          const paidEvent = events.find(ev => ev.type === 'paid');
          if (paidEvent) {
            paidEventTimestamp = new Date(paidEvent.created_at);
          }
        }
        
        if (events) {
          // CRITICAL: For draft invoices, filter out events that shouldn't exist
          // Draft invoices should only show: created, edited, downloaded_pdf
          const isDraft = invoice.status === 'draft';
          
          // Group events by type and keep only the latest one of each type
          const eventsByType = new Map<string, any>();
          for (const ev of events) {
            // CRITICAL: For privacy and legal compliance, exclude all events after invoice was marked as paid
            if (paidEventTimestamp) {
              const eventTimestamp = new Date(ev.created_at);
              // Only show events that occurred before or at the same time as the paid event
              // Allow the paid event itself to show, but nothing after it
              if (eventTimestamp > paidEventTimestamp && ev.type !== 'paid') {
                continue; // Skip events after payment for privacy
              }
            }
            
            // Filter out "paid" events if invoice is not currently paid
            if (ev.type === 'paid' && invoice.status !== 'paid') {
              continue;
            }
            
            // CRITICAL: For draft invoices, exclude all "sent" related events
            if (isDraft) {
              if (ev.type === 'sent' || 
                  ev.type === 'viewed_by_customer' || 
                  ev.type === 'downloaded_by_customer' ||
                  ev.type === 'payment_method_copied' ||
                  ev.type === 'overdue' || 
                  ev.type === 'late_fee_applied') {
                continue; // Skip these events for draft invoices
              }
            }
            
            // For privacy: only track the latest "viewed_by_customer" event (only for non-draft invoices)
            if (ev.type === 'viewed_by_customer' && !isDraft) {
              if (!latestViewedEvent || new Date(ev.created_at) > new Date(latestViewedEvent.created_at)) {
                latestViewedEvent = ev;
              }
              continue;
            }
            
            // For overdue events, keep all of them (not just latest) - we want cumulative history
            // But skip for draft invoices (already filtered above)
            if (ev.type === 'overdue' || ev.type === 'late_fee_applied') {
              // Don't filter overdue events - we want all of them
              continue; // Skip here, we'll handle them separately below
            }
            
            // For other events, keep only the latest one of each type
            if (!eventsByType.has(ev.type) || new Date(ev.created_at) > new Date(eventsByType.get(ev.type).created_at)) {
              eventsByType.set(ev.type, ev);
            }
          }
          
          // Process unique events (excluding overdue which we handle separately)
          for (const ev of eventsByType.values()) {
            eventTypes.add(ev.type);
            const mapping: Record<string, ActivityItem> = {
              created: { id: `created-${ev.id}`, type: 'system', title: 'Invoice created.', at: ev.created_at, icon: 'created' },
              edited: { id: `edited-${ev.id}`, type: 'system', title: 'Invoice edited.', at: ev.created_at, icon: 'scheduled' },
              sent: { id: `sent-${ev.id}`, type: 'email', title: 'Invoice sent.', at: ev.created_at, icon: 'sent' },
              paid: { 
                id: `paid-${ev.id}`, 
                type: 'status', 
                title: ev.metadata?.writeOffAmount 
                  ? `Invoice written off. Amount: $${parseFloat(ev.metadata.writeOffAmount.toString()).toFixed(2)}` 
                  : 'Invoice paid in full.', 
                details: ev.metadata?.writeOffAmount && ev.metadata?.notes 
                  ? `Notes: ${ev.metadata.notes}` 
                  : ev.metadata?.writeOffAmount 
                    ? 'Invoice marked as paid with write-off.' 
                    : undefined,
                at: ev.created_at, 
                icon: 'paid' 
              },
              downloaded_by_customer: { id: `dl-${ev.id}`, type: 'client', title: 'Invoice downloaded by customer.', at: ev.created_at, icon: 'downloaded' },
              downloaded_pdf: { id: `dl-owner-${ev.id}`, type: 'owner', title: 'PDF downloaded.', at: ev.created_at, icon: 'downloaded' },
              payment_method_copied: { 
                id: `copy-${ev.id}`, 
                type: 'client', 
                title: 'Payment method copied.', 
                details: ev.metadata?.paymentMethod || 'Unknown',
                at: ev.created_at, 
                icon: 'copied' 
              },
            } as any;
            const mapped = mapping[ev.type];
            if (mapped) {
              // Use event type + timestamp as key to prevent duplicates
              const eventKey = `${ev.type}-${new Date(ev.created_at).getTime()}`;
              if (!eventMap.has(eventKey)) {
                eventMap.set(eventKey, mapped);
                items.push(mapped);
              }
            }
          }
          
          // Process overdue events separately (show all, not just latest)
          // Calculate due date once for consistent timestamp calculation
          const due = (invoice as any).dueDate || (invoice as any).due_date;
          let dueStart: Date | null = null;
          if (due) {
            const dueDate = new Date(due);
            dueStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
          }
          
          // CRITICAL: Only process overdue events for non-draft invoices
          // CRITICAL: For privacy, exclude overdue events that occurred after payment
          const overdueEvents = events.filter((ev: any) => {
            if (isDraft) return false;
            if (ev.type !== 'overdue' && ev.type !== 'late_fee_applied') return false;
            
            // Exclude events that occurred after payment
            if (paidEventTimestamp) {
              const eventTimestamp = new Date(ev.created_at);
              if (eventTimestamp > paidEventTimestamp) {
                return false; // Skip events after payment
              }
            }
            return true;
          });
          
          // Get today's end time for filtering future events
          const todayEnd = new Date();
          todayEnd.setUTCHours(23, 59, 59, 999);
          
          for (const ev of overdueEvents) {
            if (ev.type === 'overdue') {
              const days = ev.metadata?.days || 0;
              if (days > 0 && dueStart) {
                // Calculate accurate timestamp: dueDate + days (end of that day)
                const overdueDate = new Date(dueStart);
                overdueDate.setUTCDate(overdueDate.getUTCDate() + days);
                overdueDate.setUTCHours(23, 59, 59, 999);
                
                // CRITICAL: Only show overdue events for days that have actually passed (today or past)
                if (overdueDate > todayEnd) {
                  // This is a future date - don't show it yet
                  continue;
                }
                
                // CRITICAL: Use stored calculatedTimestamp from metadata if available,
                // otherwise use created_at to maintain exact position in timeline
                // This ensures activities never change position once recorded
                const displayTimestamp = ev.metadata?.calculatedTimestamp || ev.created_at;
                const overdueItem = {
                  id: `overdue-${ev.id}`,
                  type: 'status',
                  title: `${days} day${days !== 1 ? 's' : ''} overdue`,
                  at: displayTimestamp, // Use stored timestamp to preserve position
                  icon: 'overdue' as const
                };
                const eventKey = `overdue-${ev.id}`;
                if (!eventMap.has(eventKey)) {
                  eventMap.set(eventKey, overdueItem);
                  items.push(overdueItem);
                }
              }
            } else if (ev.type === 'late_fee_applied') {
              // Recalculate late fee amount to ensure it's correct (fixes existing incorrect amounts)
              // Calculate base amount (remaining balance after partial payments)
              // CRITICAL: Late fees should be calculated on remaining balance, not full invoice total
              let baseAmount = invoice.total || 0;
              if (payments && payments.length > 0) {
                const totalPaid = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount?.toString() || '0'), 0);
                if (totalPaid > 0) {
                  baseAmount = Math.max(0, (invoice.total || 0) - totalPaid);
                }
              }
              
              // Get late fee settings
              const lf = (invoice as any).lateFees || (invoice as any).late_fees;
              let correctAmount = ev.metadata?.amount || 0; // Default to stored amount
              
              // Recalculate if late fee settings are available
              if (lf && (lf.enabled || lf?.enabled === true)) {
                correctAmount = lf.type === 'percentage' 
                  ? (baseAmount * (lf.amount || 0)) / 100 
                  : (lf.amount || 0);
              }
              
              // CRITICAL: Use original created_at timestamp to maintain exact position in timeline
              // This ensures activities never change position once recorded
              const displayDate = ev.created_at;
              const lateFeeDate = new Date(displayDate);
              
              // CRITICAL: Only show late fee events that have actually occurred (today or past)
              if (lateFeeDate > todayEnd) {
                // This is a future date - don't show it yet
                continue;
              }
              
              // Update the event in database if amount is significantly different (more than $0.01 difference)
              const storedAmount = ev.metadata?.amount || 0;
              const amountDifference = Math.abs(storedAmount - correctAmount);
              if (amountDifference > 0.01) {
                try {
                  await supabase
                    .from('invoice_events')
                    .update({
                      metadata: {
                        ...(ev.metadata || {}),
                        amount: correctAmount,
                        baseAmount,
                        correctedAt: new Date().toISOString() // Track when correction was made
                      }
                    })
                    .eq('id', ev.id);
                } catch (updateError) {
                  console.error('Error updating late fee event amount:', updateError);
                }
              }
              
              const lateFeeItem = {
                id: `latefee-${ev.id}`,
                type: 'status',
                title: `Late fee applied: $${correctAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                at: displayDate, // Use original database timestamp to preserve position
                icon: 'overdue' as const
              };
              const eventKey = `latefee-${new Date(displayDate).getTime()}`;
              if (!eventMap.has(eventKey)) {
                eventMap.set(eventKey, lateFeeItem);
                items.push(lateFeeItem);
              }
            }
          }
        }
        
        // Add only the latest "viewed_by_customer" event (for privacy)
        // CRITICAL: Only show for non-draft invoices
        // CRITICAL: For privacy, exclude view events that occurred after payment
        if (latestViewedEvent && invoice.status !== 'draft') {
          // Check if view event occurred after payment
          if (paidEventTimestamp) {
            const viewTimestamp = new Date(latestViewedEvent.created_at);
            if (viewTimestamp > paidEventTimestamp) {
              // View occurred after payment - don't show for privacy
              latestViewedEvent = null;
            }
          }
        }
        
        if (latestViewedEvent && invoice.status !== 'draft') {
          const viewItem = { 
            id: `view-${latestViewedEvent.id}`, 
            type: 'client', 
            title: 'Invoice viewed by customer.', 
            at: latestViewedEvent.created_at, 
            icon: 'opened' as const
          };
          const eventKey = `viewed_by_customer-${new Date(latestViewedEvent.created_at).getTime()}`;
          if (!eventMap.has(eventKey)) {
            eventMap.set(eventKey, viewItem);
            items.push(viewItem);
            eventTypes.add('viewed_by_customer');
          }
        }
        
        // Add payment events (only if invoice is not fully paid or marked as paid)
        // IMPORTANT: Payments are added here but will be sorted chronologically with all other events
        if (payments.length > 0 && invoice.status !== 'paid') {
          // Filter payments that occurred before the paid event (if any)
          const validPayments = paidEventTimestamp 
            ? payments.filter((p: any) => new Date(p.created_at) <= paidEventTimestamp)
            : payments;
          
          for (const payment of validPayments) {
            // Use created_at for accurate timestamp (when payment was recorded)
            // payment_date is just a date without time, so created_at is more accurate for chronological sorting
            const paymentTimestamp = payment.created_at || payment.payment_date;
            const paymentItem: ActivityItem = {
              id: `payment-${payment.id}`,
              type: 'client',
              title: `Partial payment received: $${parseFloat(payment.amount.toString()).toFixed(2)}`,
              at: paymentTimestamp,
              icon: 'paid' as const,
              details: payment.payment_method ? `Method: ${payment.payment_method}` : undefined
            };
            const eventKey = `payment-${payment.id}-${new Date(paymentTimestamp).getTime()}`;
            if (!eventMap.has(eventKey)) {
              eventMap.set(eventKey, paymentItem);
              items.push(paymentItem);
            }
          }
        }
        
        // Only add derived "created" if no created event exists in database
        if (!eventTypes.has('created')) {
          if ((invoice as any).createdAt || (invoice as any).created_at) {
            const createdAt = (invoice as any).createdAt || (invoice as any).created_at;
            const createdItem = { id: 'created-fallback', type: 'system', title: 'Invoice created.', at: createdAt, icon: 'created' as const };
            const eventKey = `created-fallback-${new Date(createdAt).getTime()}`;
            if (!eventMap.has(eventKey)) {
              eventMap.set(eventKey, createdItem);
              items.push(createdItem);
            }
          }
        }
        
        // Only add derived status if no corresponding event exists in database
        if (invoice.status === 'paid' && !eventTypes.has('paid')) {
          const at = (invoice as any).updatedAt || (invoice as any).updated_at || new Date().toISOString();
          const paidItem = { id: 'paid-fallback', type: 'status', title: 'Invoice paid in full.', at, icon: 'paid' as const };
          const eventKey = `paid-fallback-${new Date(at).getTime()}`;
          if (!eventMap.has(eventKey)) {
            eventMap.set(eventKey, paidItem);
            items.push(paidItem);
          }
        } else if ((invoice.status === 'sent' || invoice.status === 'pending') && !eventTypes.has('sent')) {
          const at = (invoice as any).updatedAt || (invoice as any).updated_at || new Date().toISOString();
          const sentItem = { id: 'sent-fallback', type: 'status', title: 'Invoice sent.', at, icon: 'sent' as const };
          const eventKey = `sent-fallback-${new Date(at).getTime()}`;
          if (!eventMap.has(eventKey)) {
            eventMap.set(eventKey, sentItem);
            items.push(sentItem);
          }
        }
        // Reminders (delivery/open etc.) - Skip scheduled reminders for draft invoices
        // Also filter out reminders scheduled before invoice creation
        const { data, error } = await supabase
          .from('invoice_reminders')
          .select('*')
          .eq('invoice_id', invoice.id)
          .order('sent_at', { ascending: false });
        if (!error && data) {
          const invoiceCreatedAt = (invoice as any).createdAt || (invoice as any).created_at;
          const invoiceCreatedDate = invoiceCreatedAt ? new Date(invoiceCreatedAt) : null;
          
          // Track reminders by status and timestamp to prevent duplicates
          const reminderMap = new Map<string, ActivityItem>();
          
          for (const r of data) {
            // Skip scheduled reminders for draft invoices
            if (r.reminder_status === 'scheduled' && invoice.status === 'draft') {
              continue;
            }
            
            // Filter out reminders scheduled before invoice creation
            const reminderDate = r.sent_at || r.scheduled_for || r.created_at;
            if (reminderDate && invoiceCreatedDate && r.reminder_status === 'scheduled') {
              const reminderDateObj = new Date(reminderDate);
              // If reminder is scheduled before invoice creation, skip it
              if (reminderDateObj < invoiceCreatedDate) {
                continue;
              }
            }
            
            const at = r.sent_at || r.created_at;
            let reminderItem: ActivityItem | null = null;
            
            if (r.reminder_status === 'delivered') {
              reminderItem = { id: `delivered-${r.id}`, type: 'email', title: 'Invoice email delivered successfully.', at, icon: 'delivered' };
            } else if (r.reminder_status === 'bounced') {
              reminderItem = { id: `failed-${r.id}`, type: 'email', title: 'Email bounced.', at, icon: 'failed', details: r.failure_reason };
            } else if (r.reminder_status === 'sent') {
              reminderItem = { id: `reminder-${r.id}`, type: 'email', title: 'Reminder sent.', at, icon: 'sent' };
            }
            // CRITICAL: Do NOT show scheduled reminders - only show what has actually happened
            // Scheduled reminders are future events that haven't occurred yet
            
            if (reminderItem) {
              // CRITICAL: Only show reminders that have actually been sent (past or present, not future)
              const reminderDate = new Date(at);
              const today = new Date();
              today.setHours(23, 59, 59, 999); // End of today
              
              // Only add if the reminder date is today or in the past
              if (reminderDate <= today) {
                // Use status + timestamp as key to prevent duplicates
                const reminderKey = `${r.reminder_status}-${new Date(at).getTime()}`;
                if (!reminderMap.has(reminderKey)) {
                  reminderMap.set(reminderKey, reminderItem);
                  items.push(reminderItem);
                }
              }
            }
          }
        }

        // Create overdue events for each day (cumulative, not replacing)
        // CRITICAL: Do not calculate overdue or late fees for draft invoices
        try {
          const due = (invoice as any).dueDate || (invoice as any).due_date;
          if (due && invoice.status !== 'paid' && invoice.status !== 'draft') {
            const today = new Date();
            const dueDate = new Date(due);
            const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
            const dueStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
            // Calculate days difference: today - dueDate (positive if overdue)
            const diffDays = Math.floor((todayStart.getTime() - dueStart.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
              const totalOverdueDays = diffDays;
              
              // Get existing overdue events from database
              const { data: existingOverdueEvents } = await supabase
                .from('invoice_events')
                .select('*')
                .eq('invoice_id', invoice.id)
                .eq('type', 'overdue')
                .order('created_at', { ascending: true });
              
              const existingDays = new Set<number>();
              if (existingOverdueEvents) {
                existingOverdueEvents.forEach((ev: any) => {
                  const days = ev.metadata?.days || parseInt(ev.metadata?.title?.match(/(\d+)/)?.[1] || '0');
                  if (days > 0) {
                    existingDays.add(days);
                  }
                });
              }
              
              // CRITICAL: Only create overdue events for days that have ACTUALLY passed
              // Don't show future overdue dates - only show what has happened
              const eventsToCreate = [];
              const todayEnd = new Date();
              todayEnd.setUTCHours(23, 59, 59, 999); // End of today
              
              for (let day = 1; day <= totalOverdueDays; day++) {
                // Calculate the date when this overdue day occurred
                const overdueDate = new Date(dueStart);
                overdueDate.setUTCDate(overdueDate.getUTCDate() + day);
                overdueDate.setUTCHours(23, 59, 59, 999); // End of that day
                
                // CRITICAL: Only show overdue events for days that have actually passed (today or past)
                if (overdueDate > todayEnd) {
                  // This is a future date - don't show it yet
                  continue;
                }
                
                if (!existingDays.has(day)) {
                  // Store calculated timestamp in metadata to ensure consistent position
                  const calculatedTimestamp = overdueDate.toISOString();
                  eventsToCreate.push({
                    invoice_id: invoice.id,
                    type: 'overdue',
                    metadata: { 
                      days: day,
                      calculatedTimestamp: calculatedTimestamp // Store for consistent positioning
                    }
                  });
                  
                  // Add to items immediately for display using calculated timestamp
                  items.push({
                    id: `overdue-${invoice.id}-${day}`,
                    type: 'status',
                    title: `${day} day${day !== 1 ? 's' : ''} overdue`,
                    at: calculatedTimestamp, // Use calculated timestamp for new events
                    icon: 'overdue'
                  });
                } else {
                  // Event exists, use the stored timestamp to maintain exact position
                  if (existingOverdueEvents) {
                    const existingEvent = existingOverdueEvents.find((ev: any) => {
                      const evDays = ev.metadata?.days || parseInt(ev.metadata?.title?.match(/(\d+)/)?.[1] || '0');
                      return evDays === day;
                    });
                    if (existingEvent) {
                      // CRITICAL: Use stored calculatedTimestamp from metadata if available,
                      // otherwise use created_at to maintain exact position in timeline
                      // This ensures the activity position never changes once it's been recorded
                      const displayTimestamp = existingEvent.metadata?.calculatedTimestamp || existingEvent.created_at;
                      items.push({
                        id: `overdue-${existingEvent.id}`,
                        type: 'status',
                        title: `${day} day${day !== 1 ? 's' : ''} overdue`,
                        at: displayTimestamp, // Use stored timestamp to preserve position
                        icon: 'overdue'
                      });
                    }
                  }
                }
              }
              
              // Insert new overdue events in bulk
              if (eventsToCreate.length > 0) {
                try {
                  await supabase.from('invoice_events').insert(eventsToCreate);
                } catch (insertError) {
                  console.error('Error creating overdue events:', insertError);
                }
              }

              // Late fee status - create event exactly when grace period passes
              const lf = (invoice as any).lateFees || (invoice as any).late_fees;
              if (lf && (lf.enabled || lf?.enabled === true)) {
                const grace = lf.gracePeriod ?? lf.grace_period ?? 0;
                // Late fee applies on: dueDate + gracePeriod + 1 day (the day after grace period ends)
                const lateFeeApplicationDay = grace + 1;
                
                // Calculate when late fee was/will be applied
                const lateFeeDate = new Date(dueStart);
                lateFeeDate.setUTCDate(lateFeeDate.getUTCDate() + lateFeeApplicationDay);
                lateFeeDate.setUTCHours(23, 59, 59, 999);
                
                // CRITICAL: Only show late fee if it has actually been applied (today or past)
                const todayEnd = new Date();
                todayEnd.setUTCHours(23, 59, 59, 999);
                
                if (totalOverdueDays >= lateFeeApplicationDay && lateFeeDate <= todayEnd) {
                  // Check if late fee event already exists
                  const { data: lateFeeEvents } = await supabase
                    .from('invoice_events')
                    .select('*')
                    .eq('invoice_id', invoice.id)
                    .eq('type', 'late_fee_applied')
                    .limit(1);
                  
                  if (!lateFeeEvents || lateFeeEvents.length === 0) {
                    // Calculate base amount (remaining balance after partial payments)
                    // CRITICAL: Late fees should be calculated on remaining balance, not full invoice total
                    let baseAmount = invoice.total || 0;
                    if (payments && payments.length > 0) {
                      const totalPaid = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount?.toString() || '0'), 0);
                      if (totalPaid > 0) {
                        baseAmount = Math.max(0, (invoice.total || 0) - totalPaid);
                      }
                    }
                    
                    // Calculate late fee amount based on type
                    // For percentage: calculate on remaining balance (after partial payments)
                    // For fixed: use the fixed amount
                    const amount = lf.type === 'percentage' 
                      ? (baseAmount * (lf.amount || 0)) / 100 
                      : (lf.amount || 0);
                    
                    // Calculate exact date when late fee should be applied
                    // This is: dueDate + gracePeriod days + 1 day (start of the day after grace period)
                    const appliedDate = new Date(dueStart);
                    appliedDate.setUTCDate(appliedDate.getUTCDate() + grace + 1);
                    appliedDate.setUTCHours(0, 0, 0, 0); // Start of the day when late fee applies
                    
                    // Create late fee event with accurate timestamp in metadata
                    try {
                      await supabase.from('invoice_events').insert({
                        invoice_id: invoice.id,
                        type: 'late_fee_applied',
                        metadata: { 
                          amount,
                          baseAmount, // Store base amount for reference
                          appliedDate: appliedDate.toISOString(), // Store exact application date
                          gracePeriod: grace,
                          applicationDay: lateFeeApplicationDay
                        }
                      });
                    } catch (insertError) {
                      console.error('Error creating late fee event:', insertError);
                    }
                    
                    // Use the calculated application date for display
                    items.push({
                      id: `latefee-${invoice.id}`,
                      type: 'status',
                      title: `Late fee applied: $${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      at: appliedDate.toISOString(),
                      icon: 'overdue'
                    });
                  } else {
                    // Recalculate late fee amount to ensure it's correct (fixes existing incorrect amounts)
                    // Calculate base amount (remaining balance after partial payments)
                    // CRITICAL: Late fees should be calculated on remaining balance, not full invoice total
                    let baseAmount = invoice.total || 0;
                    if (payments && payments.length > 0) {
                      const totalPaid = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount?.toString() || '0'), 0);
                      if (totalPaid > 0) {
                        baseAmount = Math.max(0, (invoice.total || 0) - totalPaid);
                      }
                    }
                    
                    // Recalculate late fee amount based on type
                    const correctAmount = lf.type === 'percentage' 
                      ? (baseAmount * (lf.amount || 0)) / 100 
                      : (lf.amount || 0);
                    
                    // CRITICAL: Use original created_at timestamp to maintain exact position in timeline
                    // This ensures activities never change position once recorded
                    const lateFeeEvent = lateFeeEvents[0];
                    const displayDate = lateFeeEvent.created_at; // Use original database timestamp to preserve position
                    const storedAmount = lateFeeEvent.metadata?.amount || 0;
                    
                    // Use the correct calculated amount (not the stored one, which might be wrong)
                    // If the stored amount differs significantly, update the database record
                    const amountToDisplay = correctAmount;
                    const amountDifference = Math.abs(storedAmount - correctAmount);
                    
                    // Update the event in database if amount is significantly different (more than $0.01 difference)
                    if (amountDifference > 0.01) {
                      try {
                        await supabase
                          .from('invoice_events')
                          .update({
                            metadata: {
                              ...(lateFeeEvent.metadata || {}),
                              amount: correctAmount,
                              baseAmount,
                              correctedAt: new Date().toISOString() // Track when correction was made
                            }
                          })
                          .eq('id', lateFeeEvent.id);
                      } catch (updateError) {
                        console.error('Error updating late fee event amount:', updateError);
                      }
                    }
                    
                    items.push({
                      id: `latefee-${lateFeeEvent.id}`,
                      type: 'status',
                      title: `Late fee applied: $${amountToDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      at: displayDate, // Use original database timestamp to preserve position
                      icon: 'overdue'
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing overdue events:', error);
        }

        // Final robust deduplication: remove items with same title and timestamp within 5 seconds
        // Also check by ID to prevent exact duplicates
        const seenIds = new Set<string>();
        const todayEnd = new Date();
        todayEnd.setUTCHours(23, 59, 59, 999); // End of today
        
        const deduped = items.reduce((acc, item) => {
          // CRITICAL: Filter out any future-dated events (safety check)
          const itemDate = new Date(item.at);
          if (itemDate > todayEnd) {
            // This is a future event - don't show it yet
            return acc;
          }
          
          // Skip if we've already seen this exact ID
          if (seenIds.has(item.id)) {
            return acc;
          }
          
          // Check for duplicates by title and timestamp (within 5 seconds)
          const existing = acc.find(
            (existingItem) =>
              existingItem.title === item.title &&
              Math.abs(new Date(existingItem.at).getTime() - new Date(item.at).getTime()) < 5000
          );
          
          if (!existing) {
            seenIds.add(item.id);
            acc.push(item);
          }
          return acc;
        }, [] as ActivityItem[]);

        // Sort chronologically (oldest to newest) for proper timeline order
        // Use stable sort: if timestamps are equal, maintain original order (stable sort)
        const sorted = deduped.sort((a, b) => {
          const timeA = new Date(a.at).getTime();
          const timeB = new Date(b.at).getTime();
          // Primary sort: by timestamp
          if (timeA !== timeB) {
            return timeA - timeB;
          }
          // Secondary sort: by ID to ensure stable ordering (same timestamp = maintain insertion order)
          return a.id.localeCompare(b.id);
        });
        
        setActivities(sorted);
      } catch (e) {
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id]);

  const iconFor = (i: ActivityItem) => {
    switch (i.icon) {
      case 'created': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'sent': return <SendIcon className="h-4 w-4 text-blue-600" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'opened': return <EyeIcon className="h-4 w-4 text-indigo-600" />;
      case 'downloaded': return <DownloadIcon className="h-4 w-4 text-gray-700" />;
      case 'copied': return <Copy className="h-4 w-4 text-indigo-600" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'paid': return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'scheduled': return <Mail className="h-4 w-4 text-yellow-600" />;
      default: return <Mail className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-white/20 transition-all duration-300"
        onClick={onClose}
      />
      
      {/* Sliding Panel - 50% width on mobile, fixed width on desktop */}
      <div className="absolute right-0 top-0 h-full w-[50%] sm:w-full sm:max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 truncate pr-2">Invoice activity</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Invoice Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1 sm:mb-2">Invoice</h4>
                <p className="text-sm font-medium text-gray-900 break-words">{invoice.invoiceNumber} • {invoice.client?.name || 'Unknown'}</p>
              </div>

              {/* Activity List */}
              {loading ? (
                <div className="text-sm text-gray-500">Loading activity…</div>
              ) : activities.length === 0 ? (
                <div className="text-sm text-gray-500">No activity yet.</div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3 sm:mb-4">Activity Timeline</h4>
                  <ul className="pl-1 sm:pl-2">
                    {activities.map((a, idx) => (
                      <li key={a.id} className="relative grid grid-cols-[20px_1fr] gap-2 sm:gap-3 pb-4 sm:pb-5">
                        {/* Connector line centered on the icon */}
                        {idx !== activities.length - 1 && (
                          <div className="absolute bottom-0 w-px bg-gray-200 z-0 left-[10px] top-[16px]" />
                        )}
                        {/* Icon (no border/background) aligned to text center */}
                        <div className="relative z-10 flex items-center justify-center h-5 w-5 mt-0.5">
                          {iconFor(a)}
                        </div>
                        {/* Content */}
                        <div className="py-0.5">
                          <div className="text-sm text-gray-900 leading-5 break-words">{a.title}</div>
                          <div className="text-xs text-gray-500 leading-4">
                            {(() => {
                              const date = new Date(a.at);
                              // Format date to show correct date regardless of timezone
                              // Use UTC date components to avoid timezone conversion issues
                              const year = date.getUTCFullYear();
                              const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                              const day = String(date.getUTCDate()).padStart(2, '0');
                              const hours = String(date.getUTCHours()).padStart(2, '0');
                              const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                              return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
                            })()}
                          </div>
                          {a.details && <div className="text-xs text-gray-500 mt-0.5 break-words">{a.details}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="p-3 sm:p-5 border-t border-gray-200 space-y-2 sm:space-y-3">
            {invoice.public_token && (
              <button
                onClick={() => {
                  const token = invoice.public_token;
                  if (token) {
                    // Add owner=true parameter so server can detect owner view (even in incognito)
                    window.open(`/invoice/${encodeURIComponent(token)}?owner=true&view=preview`, '_blank');
                  }
                }}
                className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-400 cursor-pointer transition-colors"
              >
                View Public Page
              </button>
            )}
            <button onClick={onClose} className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-400 cursor-pointer transition-colors">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}


