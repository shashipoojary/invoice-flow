import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          company: string | null
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          company?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          company?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          invoice_number: string
          client_id: string
          project_name: string | null
          milestone_name: string | null
          description: string
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date: string
          created_at: string
          updated_at: string
          public_token: string
          stripe_session_id: string | null
          paypal_order_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          invoice_number: string
          client_id: string
          project_name?: string | null
          milestone_name?: string | null
          description: string
          subtotal: number
          tax_rate: number
          tax_amount: number
          total: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date: string
          created_at?: string
          updated_at?: string
          public_token?: string
          stripe_session_id?: string | null
          paypal_order_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          invoice_number?: string
          client_id?: string
          project_name?: string | null
          milestone_name?: string | null
          description?: string
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date?: string
          created_at?: string
          updated_at?: string
          public_token?: string
          stripe_session_id?: string | null
          paypal_order_id?: string | null
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          rate: number
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity: number
          rate: number
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          rate?: number
          amount?: number
          created_at?: string
        }
      }
    }
  }
}
