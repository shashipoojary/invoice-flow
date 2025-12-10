'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Mail, Eye as EyeIcon, Download as DownloadIcon, Send as SendIcon, Clock, Link as LinkIcon } from 'lucide-react';
import type { Invoice } from '@/types';
import { supabase } from '@/lib/supabase';

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  at: string;
  icon: 'sent' | 'delivered' | 'opened' | 'clicked' | 'downloaded' | 'paid' | 'created' | 'scheduled' | 'failed' | 'overdue';
  details?: string;
};

export default function InvoiceActivityDrawer({ invoice, open, onClose }: { invoice: Invoice; open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

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
        
        // Track viewed_by_customer events separately to show only the latest one
        let latestViewedEvent: any = null;
        
        if (events) {
          // Group events by type and keep only the latest one of each type
          const eventsByType = new Map<string, any>();
          for (const ev of events) {
            // Filter out "paid" events if invoice is not currently paid
            if (ev.type === 'paid' && invoice.status !== 'paid') {
              continue;
            }
            
            // For privacy: only track the latest "viewed_by_customer" event
            if (ev.type === 'viewed_by_customer') {
              if (!latestViewedEvent || new Date(ev.created_at) > new Date(latestViewedEvent.created_at)) {
                latestViewedEvent = ev;
              }
              continue;
            }
            
            // For overdue events, keep all of them (not just latest) - we want cumulative history
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
              paid: { id: `paid-${ev.id}`, type: 'status', title: 'Invoice paid in full.', at: ev.created_at, icon: 'paid' },
              downloaded_by_customer: { id: `dl-${ev.id}`, type: 'client', title: 'Invoice downloaded by customer.', at: ev.created_at, icon: 'downloaded' },
              downloaded_pdf: { id: `dl-owner-${ev.id}`, type: 'owner', title: 'PDF downloaded.', at: ev.created_at, icon: 'downloaded' },
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
          
          const overdueEvents = events.filter((ev: any) => ev.type === 'overdue' || ev.type === 'late_fee_applied');
          for (const ev of overdueEvents) {
            if (ev.type === 'overdue') {
              const days = ev.metadata?.days || 0;
              if (days > 0 && dueStart) {
                // Calculate accurate timestamp: dueDate + days (end of that day)
                const overdueDate = new Date(dueStart);
                overdueDate.setUTCDate(overdueDate.getUTCDate() + days);
                overdueDate.setUTCHours(23, 59, 59, 999);
                
                const overdueItem = {
                  id: `overdue-${ev.id}`,
                  type: 'status',
                  title: `${days} day${days !== 1 ? 's' : ''} overdue`,
                  at: overdueDate.toISOString(), // Use calculated timestamp for consistency
                  icon: 'overdue' as const
                };
                const eventKey = `overdue-${days}-${overdueDate.getTime()}`;
                if (!eventMap.has(eventKey)) {
                  eventMap.set(eventKey, overdueItem);
                  items.push(overdueItem);
                }
              }
            } else if (ev.type === 'late_fee_applied') {
              const amount = ev.metadata?.amount || 0;
              // Use metadata appliedDate if available (more accurate), otherwise use created_at
              const displayDate = ev.metadata?.appliedDate || ev.created_at;
              const lateFeeItem = {
                id: `latefee-${ev.id}`,
                type: 'status',
                title: `Late fee applied: $${amount.toLocaleString()}`,
                at: displayDate,
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
        if (latestViewedEvent) {
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
            } else if (r.reminder_status === 'scheduled') {
              reminderItem = { id: `sched-${r.id}`, type: 'email', title: 'Reminder scheduled.', at, icon: 'scheduled' };
            }
            
            if (reminderItem) {
              // Use status + timestamp as key to prevent duplicates
              const reminderKey = `${r.reminder_status}-${new Date(at).getTime()}`;
              if (!reminderMap.has(reminderKey)) {
                reminderMap.set(reminderKey, reminderItem);
                items.push(reminderItem);
              }
            }
          }
        }
        // Payments - only show if invoice is actually paid, otherwise just record as payment (not paid status)
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('invoice_id', invoice.id)
          .order('created_at', { ascending: false });
        if (payments && payments.length > 0) {
          // Track payments by timestamp to prevent duplicates
          const paymentMap = new Map<string, ActivityItem>();
          
          for (const p of payments) {
            const paymentKey = `payment-${new Date(p.created_at).getTime()}`;
            if (!paymentMap.has(paymentKey)) {
              // Only show payments with "paid" icon if invoice status is actually paid
              if (invoice.status === 'paid') {
                const paymentItem = { id: `payment-${p.id}`, type: 'payment', title: 'Payment recorded.', at: p.created_at, icon: 'paid' as const };
                paymentMap.set(paymentKey, paymentItem);
                items.push(paymentItem);
              } else {
                // For pending invoices, show payments but with neutral icon
                const paymentItem = { id: `payment-${p.id}`, type: 'payment', title: 'Payment received.', at: p.created_at, icon: 'scheduled' as const };
                paymentMap.set(paymentKey, paymentItem);
                items.push(paymentItem);
              }
            }
          }
        }

        // Create overdue events for each day (cumulative, not replacing)
        try {
          const due = (invoice as any).dueDate || (invoice as any).due_date;
          if (due && invoice.status !== 'paid') {
            const today = new Date();
            const dueDate = new Date(due);
            const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
            const dueStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
            const diffDays = Math.round((dueStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
              const totalOverdueDays = Math.abs(diffDays);
              
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
              
              // Create overdue events for each day that doesn't exist yet
              const eventsToCreate = [];
              for (let day = 1; day <= totalOverdueDays; day++) {
                if (!existingDays.has(day)) {
                  const overdueDate = new Date(dueStart);
                  overdueDate.setUTCDate(overdueDate.getUTCDate() + day);
                  // Set time to end of day (23:59:59) for that day
                  overdueDate.setUTCHours(23, 59, 59, 999);
                  
                  eventsToCreate.push({
                    invoice_id: invoice.id,
                    type: 'overdue',
                    metadata: { days: day }
                  });
                  
                  // Add to items immediately for display
                  items.push({
                    id: `overdue-${invoice.id}-${day}`,
                    type: 'status',
                    title: `${day} day${day !== 1 ? 's' : ''} overdue`,
                    at: overdueDate.toISOString(),
                    icon: 'overdue'
                  });
                } else {
                  // Event exists, add it to items from database with calculated timestamp
                  if (existingOverdueEvents) {
                    const existingEvent = existingOverdueEvents.find((ev: any) => {
                      const evDays = ev.metadata?.days || parseInt(ev.metadata?.title?.match(/(\d+)/)?.[1] || '0');
                      return evDays === day;
                    });
                    if (existingEvent) {
                      // Calculate accurate timestamp: dueDate + day (end of that day)
                      const overdueDate = new Date(dueStart);
                      overdueDate.setUTCDate(overdueDate.getUTCDate() + day);
                      overdueDate.setUTCHours(23, 59, 59, 999);
                      
                      items.push({
                        id: `overdue-${existingEvent.id}`,
                        type: 'status',
                        title: `${day} day${day !== 1 ? 's' : ''} overdue`,
                        at: overdueDate.toISOString(), // Use calculated timestamp for consistency
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
                
                if (totalOverdueDays >= lateFeeApplicationDay) {
                  // Check if late fee event already exists
                  const { data: lateFeeEvents } = await supabase
                    .from('invoice_events')
                    .select('*')
                    .eq('invoice_id', invoice.id)
                    .eq('type', 'late_fee_applied')
                    .limit(1);
                  
                  if (!lateFeeEvents || lateFeeEvents.length === 0) {
                    const amount = lf.type === 'percentage' ? (invoice.total * (lf.amount || 0)) / 100 : (lf.amount || 0);
                    
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
                      title: `Late fee applied: $${amount.toLocaleString()}`,
                      at: appliedDate.toISOString(),
                      icon: 'overdue'
                    });
                  } else {
                    // Use existing late fee event - prefer metadata date if available
                    const lateFeeEvent = lateFeeEvents[0];
                    const displayDate = lateFeeEvent.metadata?.appliedDate || lateFeeEvent.created_at;
                    
                    items.push({
                      id: `latefee-${lateFeeEvent.id}`,
                      type: 'status',
                      title: `Late fee applied: $${(lateFeeEvent.metadata?.amount || 0).toLocaleString()}`,
                      at: displayDate,
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
        const deduped = items.reduce((acc, item) => {
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

  if (!open) return null;

  const iconFor = (i: ActivityItem) => {
    switch (i.icon) {
      case 'created': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'sent': return <SendIcon className="h-4 w-4 text-blue-600" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'opened': return <EyeIcon className="h-4 w-4 text-indigo-600" />;
      case 'downloaded': return <DownloadIcon className="h-4 w-4 text-gray-700" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'paid': return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'scheduled': return <Mail className="h-4 w-4 text-yellow-600" />;
      default: return <Mail className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-sm bg-white/20 transition-all duration-300" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-1/2 sm:w-full sm:max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Invoice activity</h3>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-4">
              <div className="text-sm text-gray-500">Invoice</div>
              <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber} • {invoice.client?.name || 'Unknown'}</div>
            </div>
            {loading ? (
              <div className="text-sm text-gray-500">Loading activity…</div>
            ) : activities.length === 0 ? (
              <div className="text-sm text-gray-500">No activity yet.</div>
            ) : (
              <ul className="pl-2">
                {activities.map((a, idx) => (
                  <li key={a.id} className="relative grid grid-cols-[20px_1fr] gap-3 pb-5">
                    {/* Connector line centered on the icon */}
                    {idx !== activities.length - 1 && (
                      <div className="absolute bottom-0 w-px bg-gray-200 z-0" style={{ left: '10px', top: '16px' }} />
                    )}
                    {/* Icon (no border/background) aligned to text center */}
                    <div className="relative z-10 flex items-center justify-center h-5 w-5 mt-0.5">
                      {iconFor(a)}
                    </div>
                    {/* Content */}
                    <div className="py-0.5">
                      <div className="text-sm text-gray-900 leading-5">{a.title}</div>
                      <div className="text-xs text-gray-500 leading-4">{new Date(a.at).toLocaleString()}</div>
                      {a.details && <div className="text-xs text-gray-500 mt-0.5">{a.details}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-5 border-t border-gray-200">
            <button onClick={onClose} className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-400 cursor-pointer transition-colors">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}


