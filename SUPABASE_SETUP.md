# 🚀 Supabase Setup Guide for FlowInvoicer

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/login with GitHub
4. Click "New Project"
5. Choose your organization
6. Enter project details:
   - **Name:** `invoice-flow`
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose closest to your users
7. Click "Create new project"
8. Wait 2-3 minutes for setup

## Step 2: Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values:

```
Project URL: https://your-project-id.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Set Up Database Schema

1. Go to **SQL Editor** in Supabase Dashboard
2. Click "New Query"
3. Copy the **entire contents** of `supabase/complete-setup.sql`
4. Paste into the SQL Editor
5. Click **"Run"** button
6. Wait for all tables to be created (should take 10-15 seconds)

## Step 4: Update Environment Variables

Create/update your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Step 5: Test Your Setup

1. Restart your dev server: `npm run dev`
2. Go to http://localhost:3000
3. Try to sign up with a new account
4. Check Supabase Dashboard → **Authentication** → **Users** to see if user was created
5. Check **Table Editor** to see if profile and payment methods were created

## 🎯 What the SQL Script Creates:

### Tables:
- ✅ **profiles** - User business information
- ✅ **clients** - Client database
- ✅ **invoices** - Invoice records
- ✅ **invoice_items** - Invoice line items
- ✅ **payments** - Payment tracking
- ✅ **invoice_pdfs** - PDF storage
- ✅ **billing_records** - Platform billing
- ✅ **payment_methods** - Freelancer payment details

### Security:
- ✅ **Row Level Security (RLS)** - Users can only see their own data
- ✅ **Public invoice access** - Clients can view invoices by token
- ✅ **Automatic profile creation** - When users sign up

### Functions:
- ✅ **Auto-generate invoice numbers** - INV-0001, INV-0002, etc.
- ✅ **Auto-generate public tokens** - For client-facing invoice pages
- ✅ **Update timestamps** - Automatic updated_at fields

## 🔧 Troubleshooting:

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

## 🚀 Ready to Deploy!

Once everything works locally:
1. Push to GitHub
2. Deploy to Vercel
3. Add the same environment variables to Vercel
4. Your app will be live!

## 📱 Features Ready:

- ✅ User authentication
- ✅ Business profile setup
- ✅ Client management
- ✅ Invoice creation
- ✅ PDF generation
- ✅ Payment tracking
- ✅ Public invoice pages
- ✅ Mobile responsive design

**Your FlowInvoicer app is ready to help freelancers get paid! 🎉**
