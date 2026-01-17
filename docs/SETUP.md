# FlowInvoicer - Complete Setup Guide

> The fastest way for freelancers & contractors to get paid

A modern, responsive invoicing application built with Next.js, designed specifically for freelancers and small contractors who need to get paid quickly and professionally.

## ✨ Features

- ⚡ **60-Second Invoicing** - Create professional invoices in under a minute
- 📱 **Fully Responsive** - Perfect on mobile, tablet, and desktop
- 🎨 **Custom Branding** - Add your logo, business name, and colors
- 💳 **Payment Integration** - Display your payment details directly
- 📧 **Email Automation** - Send invoices and reminders automatically
- 📊 **Analytics Dashboard** - Track your business performance
- 🔒 **Secure Authentication** - JWT-based user authentication
- 📄 **PDF Generation** - Professional invoice PDFs
- 🗄️ **Supabase Database** - Scalable PostgreSQL database

## 🚀 Quick Start

### Local Development

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd subscription-pause-tool
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   RESEND_API_KEY=your-resend-api-key
   DODO_PAYMENT_API_KEY=your-dodo-api-key
   DODO_PAYMENT_SECRET_KEY=your-dodo-secret-key
   DODO_PAYMENT_ENVIRONMENT=sandbox
   QSTASH_TOKEN=your-qstash-token
   ENABLE_ASYNC_QUEUE=false
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/login with GitHub
4. Click "New Project"
5. Enter project details:
   - **Name:** `invoice-flow`
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose closest to your users
6. Click "Create new project"
7. Wait 2-3 minutes for setup

### Step 2: Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   ```
   Project URL: https://your-project-id.supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Set Up Database Schema

1. Go to **SQL Editor** in Supabase Dashboard
2. Click "New Query"
3. Copy the **entire contents** of `database/complete_setup.sql`
4. Paste into the SQL Editor
5. Click **"Run"** button
6. Wait for all tables to be created (should take 10-15 seconds)

### Step 4: Update Environment Variables

Update your `.env.local` file with the Supabase keys from Step 2.

### Step 5: Test Your Setup

1. Restart your dev server: `npm run dev`
2. Go to http://localhost:3000
3. Try to sign up with a new account
4. Check Supabase Dashboard → **Authentication** → **Users** to see if user was created
5. Check **Table Editor** to see if profile and payment methods were created

## 🚀 Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account
- Supabase account (free)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to [Vercel](https://vercel.com) and sign in**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (default)

### Step 3: Set Environment Variables

In your Vercel project dashboard:

1. **Go to Settings → Environment Variables**
2. **Add these variables:**

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   RESEND_API_KEY=your-resend-api-key
   DODO_PAYMENT_API_KEY=your-dodo-api-key
   DODO_PAYMENT_SECRET_KEY=your-dodo-secret-key
   DODO_PAYMENT_ENVIRONMENT=production
   DODO_PAYMENT_WEBHOOK_SECRET=your-webhook-secret
   QSTASH_TOKEN=your-qstash-token
   ENABLE_ASYNC_QUEUE=true
   ```

   **Important:** 
   - Get these values from your Supabase project settings
   - The service role key is sensitive - keep it secure

### Step 4: Deploy

1. **Click "Deploy"**
2. **Wait for the build to complete**
3. **Your app will be live at:** `https://your-project-name.vercel.app`

## 💳 Payment Integration (Dodo Payment)

### Step 1: Get Your Dodo Payment API Keys

1. **Log in to Dodo Payment Dashboard**
   - Go to [https://dashboard.dodopayments.com](https://dashboard.dodopayments.com)
   - Sign in with your account

2. **Navigate to API Settings**
   - Look for: **"Developer"**, **"API Keys"**, **"API Settings"**, or **"Settings → API"**

3. **Find Sandbox/Test Mode Section**
   - For testing, use **Sandbox Mode** credentials
   - For production, use **Production Mode** credentials

4. **Copy Your Keys:**
   - **API Key** (Publishable Key) - Usually starts with `pk_test_` or `pk_sandbox_`
   - **Secret Key** (Private Key) - ⚠️ **KEEP THIS SECRET!**
   - **Webhook Secret** - Found in **Webhooks** section

### Step 2: Configure Webhook URL

1. In Dodo Payment Dashboard, go to **Webhooks** section
2. Add a new webhook endpoint:
   ```
   https://your-domain.com/api/payments/webhook
   ```
3. For local testing, use a tool like [ngrok](https://ngrok.com):
   ```bash
   ngrok http 3000
   ```
   Then use: `https://your-ngrok-url.ngrok.io/api/payments/webhook`

4. Select events to listen for:
   - `payment.succeeded`
   - `payment.completed`
   - `payment.failed`
   - `payment.cancelled`

5. Copy the webhook secret and add it to your environment variables

### Step 3: Test Payment Flow

1. Use test card numbers provided by Dodo Payment
2. Complete a test payment
3. Verify webhook events are received
4. Check that subscription is updated in database

## 📧 Email Setup (Resend)

1. **Sign up for Resend**: Go to [resend.com](https://resend.com)
2. **Get API Key**: Go to API Keys section and create a new key
3. **Add to Environment Variables**:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```
4. **Verify Domain** (for production): Add your domain in Resend dashboard

## 🔄 Async Queue Setup (Upstash QStash)

### Step 1: Create Upstash Account

1. Go to [upstash.com](https://upstash.com)
2. Sign up/login
3. Create a QStash project
4. Copy your QStash token (starts with `qst_...`)

### Step 2: Configure Environment Variables

Add to your `.env.local` or Vercel:
```env
QSTASH_TOKEN=qst_your_token_here
ENABLE_ASYNC_QUEUE=false  # Start with false, enable after testing
```

### Step 3: Enable Queue (After Testing)

1. Set `ENABLE_ASYNC_QUEUE=true` in Vercel
2. Monitor Upstash dashboard for job processing
3. Check Vercel logs for any errors

## 🤖 Automated Reminders Setup

### Option 1: Vercel Cron (Recommended)

The `vercel.json` file is already configured:
```json
{
  "crons": [
    {
      "path": "/api/reminders/auto-send",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**To activate:**
1. Deploy to Vercel
2. Cron jobs automatically activate
3. No additional setup needed!

### Option 2: External Cron Service

Use services like cron-job.org:
- URL: `https://your-domain.com/api/reminders/auto-send`
- Schedule: `0 9 * * *` (daily at 9 AM)
- Method: POST

## 🐛 Troubleshooting

### "supabaseUrl is required" Error:
- Make sure `.env.local` file exists
- Check that environment variables are correct
- Restart your dev server

### "Permission denied" Error:
- Make sure you ran the complete SQL script
- Check that RLS policies are created
- Verify user is authenticated

### "Table doesn't exist" Error:
- Run the complete SQL script again
- Check Supabase Dashboard → Table Editor

### Build fails:
- Check that all dependencies are in `package.json`
- Ensure TypeScript errors are resolved

### Payment not working:
- Verify Dodo Payment API keys are correct
- Check webhook URL is accessible
- Verify webhook secret matches

## 🎯 What Gets Created:

### Database Tables:
- ✅ **profiles** - User business information
- ✅ **clients** - Client database
- ✅ **invoices** - Invoice records
- ✅ **invoice_items** - Invoice line items
- ✅ **payments** - Payment tracking
- ✅ **invoice_pdfs** - PDF storage
- ✅ **billing_records** - Platform billing
- ✅ **payment_methods** - Freelancer payment details
- ✅ **invoice_reminders** - Reminder tracking
- ✅ **estimates** - Estimate records

### Security:
- ✅ **Row Level Security (RLS)** - Users can only see their own data
- ✅ **Public invoice access** - Clients can view invoices by token
- ✅ **Automatic profile creation** - When users sign up

### Functions:
- ✅ **Auto-generate invoice numbers** - INV-0001, INV-0002, etc.
- ✅ **Auto-generate public tokens** - For client-facing invoice pages
- ✅ **Update timestamps** - Automatic updated_at fields
- ✅ **Subscription limits** - Database-level enforcement

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- ✅ **Desktop** (1200px+)
- ✅ **Tablet** (768px - 1199px)
- ✅ **Mobile** (320px - 767px)

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **PDF:** React PDF for invoice generation
- **Email:** Resend
- **Payments:** Dodo Payment
- **Queue:** Upstash QStash
- **Icons:** Lucide React

## 🔒 Security

- Supabase Row Level Security (RLS)
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization
- Secure environment variable handling
- Webhook signature verification

## 📈 Performance

- Server-side rendering (SSR)
- Optimized images and assets
- Efficient database queries
- Minimal bundle size
- Fast page loads
- Async queue for heavy tasks

## 🆘 Support

- Check the [REFERENCE.md](./REFERENCE.md) for detailed documentation
- Review the code comments for implementation details
- Create an issue for bugs or feature requests

---

**Built with ❤️ for freelancers who want to get paid faster**

