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
        // Created
        if ((invoice as any).createdAt || (invoice as any).created_at) {
          const createdAt = (invoice as any).createdAt || (invoice as any).created_at;
          items.push({ id: 'created', type: 'system', title: 'Invoice created.', at: createdAt, icon: 'created' });
        }
        // Status derived
        if (invoice.status === 'paid') {
          const at = (invoice as any).updatedAt || (invoice as any).updated_at || new Date().toISOString();
          items.push({ id: 'paid', type: 'status', title: 'Invoice paid in full.', at, icon: 'paid' });
        } else if (invoice.status === 'sent' || invoice.status === 'pending') {
          const at = (invoice as any).updatedAt || (invoice as any).updated_at || new Date().toISOString();
          items.push({ id: 'sent', type: 'status', title: 'Invoice sent.', at, icon: 'sent' });
        }
        // Reminders (delivery/open etc.)
        const { data, error } = await supabase
          .from('invoice_reminders')
          .select('*')
          .eq('invoice_id', invoice.id)
          .order('sent_at', { ascending: false });
        if (!error && data) {
          for (const r of data) {
            const at = r.sent_at || r.created_at;
            if (r.reminder_status === 'delivered') {
              items.push({ id: `delivered-${r.id}` , type: 'email', title: 'Invoice email delivered successfully.', at, icon: 'delivered' });
            } else if (r.reminder_status === 'bounced') {
              items.push({ id: `failed-${r.id}`, type: 'email', title: 'Email bounced.', at, icon: 'failed', details: r.failure_reason });
            } else if (r.reminder_status === 'sent') {
              items.push({ id: `reminder-${r.id}`, type: 'email', title: 'Reminder sent.', at, icon: 'sent' });
            } else if (r.reminder_status === 'scheduled') {
              items.push({ id: `sched-${r.id}`, type: 'email', title: 'Reminder scheduled.', at, icon: 'scheduled' });
            }
          }
        }
        // Payments
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('invoice_id', invoice.id)
          .order('created_at', { ascending: false });
        if (payments) {
          for (const p of payments) {
            items.push({ id: `payment-${p.id}`, type: 'payment', title: 'Payment recorded.', at: p.created_at, icon: 'paid' });
          }
        }
        // Invoice events
        const { data: events } = await supabase
          .from('invoice_events')
          .select('*')
          .eq('invoice_id', invoice.id)
          .order('created_at', { ascending: false });
        if (events) {
          for (const ev of events) {
            const mapping: Record<string, ActivityItem> = {
              created: { id: `created-${ev.id}`, type: 'system', title: 'Invoice created.', at: ev.created_at, icon: 'created' },
              edited: { id: `edited-${ev.id}`, type: 'system', title: 'Invoice edited.', at: ev.created_at, icon: 'scheduled' },
              sent: { id: `sent-${ev.id}`, type: 'email', title: 'Invoice sent.', at: ev.created_at, icon: 'sent' },
              paid: { id: `paid-${ev.id}`, type: 'status', title: 'Invoice paid in full.', at: ev.created_at, icon: 'paid' },
              viewed_by_customer: { id: `view-${ev.id}`, type: 'client', title: 'Invoice viewed by customer.', at: ev.created_at, icon: 'opened' },
              downloaded_by_customer: { id: `dl-${ev.id}`, type: 'client', title: 'Invoice downloaded by customer.', at: ev.created_at, icon: 'downloaded' },
              downloaded_pdf: { id: `dl-owner-${ev.id}`, type: 'owner', title: 'PDF downloaded.', at: ev.created_at, icon: 'downloaded' },
            } as any;
            const mapped = mapping[ev.type];
            if (mapped) items.push(mapped);
          }
        }

        // Derived overdue and late fee status
        try {
          const due = (invoice as any).dueDate || (invoice as any).due_date;
          if (due && invoice.status !== 'paid') {
            const today = new Date();
            const dueDate = new Date(due);
            const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
            const dueStart = new Date(Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()));
            const diffDays = Math.round((dueStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
              const overdueDays = Math.abs(diffDays);
              items.push({ id: `overdue-${invoice.id}`, type: 'status', title: `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`, at: today.toISOString(), icon: 'overdue' });

              const lf = (invoice as any).lateFees || (invoice as any).late_fees;
              if (lf && (lf.enabled || lf?.enabled === true)) {
                const grace = lf.gracePeriod ?? lf.grace_period ?? 0;
                if (overdueDays > grace) {
                  const amount = lf.type === 'percentage' ? (invoice.total * (lf.amount || 0)) / 100 : (lf.amount || 0);
                  const applied = new Date(dueStart);
                  applied.setUTCDate(applied.getUTCDate() + (grace > 0 ? grace : 0) + 1);
                  items.push({ id: `latefee-${invoice.id}`, type: 'status', title: `Late fee applied: $${amount.toLocaleString()}` , at: applied.toISOString(), icon: 'overdue' });
                }
              }
            }
          }
        } catch {}

        setActivities(items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()));
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


