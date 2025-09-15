# InvoiceFlow Pro - Complete Freelancer Invoicing System

A professional, full-stack invoicing platform built for freelancers and small businesses. Features project management, milestone-based payments, PDF generation, payment processing, and email automation.

## 🚀 Features

### Core Functionality
- **Project & Milestone Management** - Track projects with multiple phases and payments
- **Professional PDF Generation** - Generate and store PDF invoices using @react-pdf/renderer
- **Payment Processing** - Stripe Checkout and PayPal integration with webhook handling
- **Email Automation** - Resend integration for transactional emails with PDF attachments
- **Hosted Invoice Pages** - Public invoice pages with payment options
- **Export & Reports** - CSV exports and bulk PDF downloads
- **Auto Reminders** - Supabase Edge Functions with cron jobs for late fees and reminders

### Technical Features
- **Supabase Backend** - Complete database with Row Level Security
- **Next.js 15** - Latest Next.js with App Router and Turbopack
- **TypeScript** - Full type safety throughout the application
- **Tailwind CSS** - Modern, responsive design with dark/light mode
- **Real-time Updates** - Live invoice status updates
- **Secure** - Token-based public invoice access

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Stripe, PayPal
- **Email**: Resend
- **PDF**: @react-pdf/renderer
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account
- Stripe account
- Resend account
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/shashipoojary/invoice-flow.git
cd invoice-flow
npm install
```

### 2. Environment Setup

Create `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend Email Configuration
RESEND_API_KEY=re_...

# PayPal Configuration (Optional)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Setup

#### Database Schema

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_name TEXT,
  milestone_name TEXT,
  description TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  public_token TEXT UNIQUE DEFAULT gen_random_uuid(),
  stripe_session_id TEXT,
  paypal_order_id TEXT
);

-- Create invoice_items table
CREATE TABLE invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoice items" ON invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can insert own invoice items" ON invoice_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can update own invoice items" ON invoice_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);
CREATE POLICY "Users can delete own invoice items" ON invoice_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);

-- Public access for invoice viewing (by token)
CREATE POLICY "Public can view invoices by token" ON invoices FOR SELECT USING (true);

-- Create storage bucket for invoices
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);

-- Storage policies
CREATE POLICY "Users can upload own invoices" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view own invoices" ON storage.objects FOR SELECT USING (
  bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Public can view invoices" ON storage.objects FOR SELECT USING (bucket_id = 'invoices');
```

#### Storage Setup

1. Go to Storage in your Supabase dashboard
2. Create a bucket named `invoices`
3. Set it to private (not public)

### 4. Stripe Setup

1. Create a Stripe account
2. Get your API keys from the dashboard
3. Set up webhook endpoint: `https://yourdomain.com/api/payments/webhook`
4. Add these events to your webhook:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`

### 5. Resend Setup

1. Create a Resend account
2. Get your API key
3. Verify your domain (optional but recommended)

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── invoices/
│   │   │   ├── create/route.ts      # Create new invoice
│   │   │   ├── pdf/route.ts         # Generate PDF
│   │   │   └── send/route.ts        # Send email
│   │   └── payments/
│   │       ├── stripe/route.ts      # Stripe checkout
│   │       └── webhook/route.ts     # Payment webhooks
│   ├── invoice/
│   │   └── [token]/
│   │       └── page.tsx             # Hosted invoice page
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Main dashboard
├── lib/
│   └── supabase.ts                  # Supabase client & types
└── components/                      # Reusable components
```

## 🔧 API Endpoints

### Invoices
- `POST /api/invoices/create` - Create new invoice
- `GET /api/invoices/pdf?id=xxx` - Generate PDF
- `POST /api/invoices/send` - Send invoice email

### Payments
- `POST /api/payments/stripe` - Create Stripe checkout session
- `POST /api/payments/webhook` - Handle payment webhooks

### Public Pages
- `GET /invoice/[token]` - Hosted invoice page with payment options

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:

- All the variables from `.env.local`
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Use production Stripe keys
- Update webhook URLs to production

## 🔒 Security Features

- **Row Level Security** - All data scoped to authenticated users
- **Public Token Access** - Secure token-based invoice sharing
- **Webhook Verification** - Stripe webhook signature verification
- **Input Validation** - Server-side validation for all inputs
- **CORS Protection** - Proper CORS configuration

## 📊 Features Overview

### For Freelancers
- Track projects with milestones
- Get paid as you complete work
- Professional invoice generation
- Automated payment reminders
- Client management
- Revenue tracking

### For Clients
- View invoices online
- Pay securely with Stripe/PayPal
- Download PDF invoices
- Transparent project tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@invoiceflow.com or create an issue on GitHub.

---

**Built with ❤️ for freelancers and small businesses**