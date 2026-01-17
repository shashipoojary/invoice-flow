# FlowInvoicer - Reference Documentation

## 📊 Capacity & Scalability

### Current Infrastructure (Free Tier)

#### Vercel Free Tier Limits
- **Serverless Functions**: 100GB-hours/month
- **Function Execution Time**: 10 seconds max per function
- **Concurrent Requests**: ~100-200 concurrent (soft limit)
- **Bandwidth**: 100GB/month
- **Build Time**: 45 minutes/month

#### Supabase Free Tier Limits
- **Database Size**: 500MB
- **Database Connections**: 60 direct connections (pooled)
- **API Requests**: Unlimited (but rate-limited)
- **Bandwidth**: 5GB/month
- **Storage**: 1GB

#### QStash Free Tier (Upstash)
- **Messages**: 10,000/month
- **Concurrent Jobs**: Unlimited
- **Retention**: 7 days
- **No rate limits on job processing**

### Current Capacity (With Async Queue Enabled)

- **Concurrent Users**: **1000+ users** (theoretical limit)
- **Invoice Sending**: Returns immediately (< 1 second)
- **Background Processing**: Jobs process asynchronously
- **No Timeout Issues**: API returns before heavy processing

### Recommended Capacity Limits

#### ✅ Safe Operating Range (Free Tier)
- **Concurrent Users**: 50-100 users
- **Daily Invoices**: 200-300 invoices/day
- **Monthly Invoices**: ~6,000 invoices/month
- **Queue Status**: ✅ **ENABLED** (required for this capacity)

#### ⚠️ At-Risk Range (Free Tier)
- **Concurrent Users**: 100-200 users
- **Daily Invoices**: 300-500 invoices/day
- **Monthly Invoices**: ~10,000 invoices/month
- **Queue Status**: ✅ **ENABLED** (may need QStash upgrade)

#### ❌ Will Break (Free Tier)
- **Concurrent Users**: 200+ users
- **Daily Invoices**: 500+ invoices/day
- **Monthly Invoices**: 15,000+ invoices/month
- **Action Required**: Upgrade infrastructure

### Upgrade Path (When Needed)

#### Tier 1: Light Upgrade ($35/month)
- **QStash Pro**: $10/month (unlimited messages)
- **Supabase Pro**: $25/month (8GB database, 200 connections)
- **Capacity**: 200-500 concurrent users

#### Tier 2: Medium Upgrade ($60/month)
- **QStash Pro**: $10/month
- **Supabase Pro**: $25/month
- **Vercel Pro**: $20/month (unlimited function hours)
- **Capacity**: 500-1000 concurrent users

#### Tier 3: Heavy Upgrade ($100+/month)
- **QStash Pro**: $10/month
- **Supabase Pro**: $25/month
- **Vercel Pro**: $20/month
- **Additional**: CDN, monitoring, etc.
- **Capacity**: 1000+ concurrent users

## 🔄 Async Queue System

### How It Works

1. **API Route** receives request → Enqueues job → Returns immediately (< 1 second)
2. **QStash** delivers job to queue handler
3. **Queue Handler** processes email/PDF in background
4. **No blocking**: Multiple users can send invoices simultaneously

### Safety Features

- **Automatic Fallback**: If queue fails, falls back to synchronous execution
- **Feature Flag**: `ENABLE_ASYNC_QUEUE` controls queue usage
- **Zero Downtime**: Can be toggled instantly if issues occur
- **Idempotency**: Jobs are deduplicated to prevent duplicates

### Monitoring

- **Upstash Dashboard**: Monitor job success rate, retry count, failures
- **Vercel Logs**: Watch for queue failures, fallback to sync
- **Key Metrics**: Queue success rate (should be > 99%), fallback rate (should be < 1%)

## 🤖 Automated Reminder System

### How It Works

- **Daily at 9:00 AM** - System automatically checks for overdue invoices
- **Smart Reminder Logic** - Sends appropriate reminder based on how many have been sent
- **Anti-Spam Protection** - Maximum 3 reminders per invoice, 24-hour gaps between reminders

### Reminder Types

1. **First Reminder** - Sent when invoice becomes overdue
2. **Second Reminder** - Sent 24+ hours after first reminder  
3. **Final Notice** - Sent 24+ hours after second reminder

### What Gets Sent

- Professional email template with business branding
- Complete invoice details (number, amount, due date, days overdue)
- All payment methods from settings (PayPal, Cash App, Venmo, etc.)
- Direct link to view/pay invoice online
- Personalized message based on reminder type

## 💳 Payment Integration

### Dodo Payment Flow

1. User clicks "Upgrade" on a paid plan
2. System creates payment checkout session
3. User redirected to Dodo Payment
4. User completes payment
5. Webhook receives payment confirmation
6. System updates subscription in database
7. User redirected back with success message

### Webhook Events

- `payment.succeeded` - Payment completed successfully
- `payment.completed` - Payment fully processed
- `payment.failed` - Payment failed
- `payment.cancelled` - Payment cancelled by user

### Subscription Plans

- **Free**: 5 invoices/month, 1 client, 1 estimate, 4 reminders/month
- **Monthly**: $9/month - Unlimited invoices, clients, estimates, reminders
- **Pay Per Invoice**: $0.50/invoice - Unlimited clients, estimates, reminders

## 📧 Email System

### Email Types

- **Invoice Emails**: Sent when invoice is sent to client
- **Reminder Emails**: Automated reminders for overdue invoices
- **Receipt Emails**: Confirmation when payment is received

### Email Features

- Professional HTML templates
- PDF attachments
- Responsive design
- Brand customization
- Payment method display

## 🗄️ Database Schema

### Core Tables

- **profiles**: User business information
- **clients**: Client database
- **invoices**: Invoice records
- **invoice_items**: Invoice line items
- **payments**: Payment tracking
- **invoice_pdfs**: PDF storage
- **billing_records**: Platform billing
- **payment_methods**: Freelancer payment details
- **invoice_reminders**: Reminder tracking
- **estimates**: Estimate records

### Security Features

- **Row Level Security (RLS)**: Users can only see their own data
- **Public Invoice Access**: Clients can view invoices by token
- **Automatic Profile Creation**: When users sign up
- **Subscription Limits**: Database-level enforcement

## 🔒 Security

### Authentication

- Supabase Auth with JWT tokens
- Password hashing with bcrypt
- Protected API routes
- Session management

### Data Protection

- Row Level Security (RLS) policies
- Input validation and sanitization
- Secure environment variable handling
- Webhook signature verification

### API Security

- Rate limiting (via Supabase)
- CORS configuration
- Request validation
- Error handling without exposing sensitive data

## 📈 Performance Optimization

### Frontend

- Server-side rendering (SSR)
- Optimized images and assets
- Code splitting
- Minimal bundle size
- Fast page loads

### Backend

- Efficient database queries
- Connection pooling
- Async queue for heavy tasks
- Caching where appropriate
- Optimized API responses

### Database

- Indexed columns for fast queries
- Efficient joins
- Connection pooling
- Query optimization

## 🎯 Key Features

### Dashboard

- Revenue and client statistics
- Recent invoices overview
- Quick action buttons
- Responsive grid layouts
- Due invoices tracking
- Notifications system

### Invoice Management

- Fast invoice creation (60 seconds)
- Service-based invoicing
- PDF generation
- Email sending
- Status tracking
- Partial payments
- Payment history

### Client Management

- Client database
- Contact information
- Invoice history
- Payment tracking

### Settings

- Business profile setup
- Payment details configuration
- Logo upload
- Brand customization
- Subscription management

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices/create` - Create invoice
- `GET /api/invoices/[id]` - Get invoice
- `POST /api/invoices/send` - Send invoice
- `POST /api/invoices/[id]/payments` - Record payment

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Reminders
- `POST /api/reminders/auto-send` - Automated reminders
- `POST /api/reminders/send` - Send manual reminder

### Payments
- `POST /api/payments/checkout` - Create payment checkout
- `POST /api/payments/webhook` - Webhook handler

## 🔧 Environment Variables

### Required

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=your-app-url
RESEND_API_KEY=your-resend-key
```

### Optional

```env
DODO_PAYMENT_API_KEY=your-dodo-api-key
DODO_PAYMENT_SECRET_KEY=your-dodo-secret-key
DODO_PAYMENT_ENVIRONMENT=sandbox|production
DODO_PAYMENT_WEBHOOK_SECRET=your-webhook-secret
QSTASH_TOKEN=your-qstash-token
ENABLE_ASYNC_QUEUE=false|true
```

## 📊 Monitoring & Alerts

### Key Metrics to Watch

1. **QStash Message Usage**: Monitor monthly message count
2. **Database Size**: Monitor storage usage
3. **Function Timeouts**: Watch for timeout errors
4. **Database Connections**: Monitor connection pool usage
5. **API Response Times**: Should be < 1 second with queue enabled

### When to Upgrade

- ✅ QStash: When approaching 8,000 messages/month
- ✅ Supabase: When database size > 400MB
- ✅ Vercel: When function hours > 80GB-hours/month
- ✅ Database: When connection errors occur

## 🚀 Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed
- [ ] Environment variables set in Vercel
- [ ] Dodo Payment configured (if using payments)
- [ ] Resend API key configured
- [ ] QStash token configured (if using async queue)
- [ ] Webhook URLs configured
- [ ] Cron jobs activated (for reminders)
- [ ] Test payment flow
- [ ] Test email sending
- [ ] Monitor logs for errors

---

**For setup instructions, see [SETUP.md](./SETUP.md)**

