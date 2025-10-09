# Auto Reminder System

A comprehensive automated reminder system for invoice payments with 4 different email templates based on overdue days.

## Features

### 📧 Email Templates
- **Friendly Reminder** (1 day overdue): Casual, friendly tone
- **Polite Reminder** (3 days overdue): Professional and polite
- **Firm Reminder** (7 days overdue): Direct and firm
- **Urgent Reminder** (14 days overdue): Urgent and demanding

### 🎨 Modern Design
- Clean, professional email templates
- Responsive design for all devices
- Dark/light theme support
- Consistent branding with business settings

### ⚙️ Smart Automation
- Automatic scheduling based on overdue days
- Prevents duplicate reminders
- Tracks reminder history
- Customizable reminder settings per invoice

## Setup

### 1. Database Migration
Run the migration to create the reminder system tables:
```sql
-- The migration is in: supabase/migrations/006_add_reminder_system.sql
```

### 2. Environment Variables
Add to your `.env.local`:
```env
CRON_SECRET=your-secret-key-here
```

### 3. Vercel Cron Job
The system is configured to run daily at 9 AM UTC using Vercel's cron function:
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Cron Schedule Options:**
- `0 9 * * *` - Daily at 9 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1` - Weekly on Monday at 9 AM UTC
- `0 9 1 * *` - Monthly on the 1st at 9 AM UTC

## Usage

### 1. Enable Reminders for an Invoice
```typescript
// In your invoice creation/editing component
const [reminderSettings, setReminderSettings] = useState({
  enabled: true,
  useSystemDefaults: true,
  customRules: []
});

// Save with invoice
await saveInvoice({
  ...invoiceData,
  reminderSettings
});
```

### 2. Manual Reminder Sending
```typescript
// Send a specific reminder
const response = await fetch('/api/reminders/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invoiceId: 'invoice-id',
    reminderType: 'friendly',
    overdueDays: 1
  })
});
```

### 3. Auto Reminder Processing
The system automatically processes overdue invoices daily and sends appropriate reminders based on:
- Days overdue
- Reminder settings
- Previous reminder history

## Email Template Structure

### Template Types
1. **Friendly**: Casual, understanding tone
2. **Polite**: Professional, respectful
3. **Firm**: Direct, business-like
4. **Urgent**: Demanding, final notice

### Design Features
- Responsive layout
- Business branding integration
- Clear call-to-action buttons
- Professional typography
- Mobile-optimized

## API Endpoints

### Send Reminder
```
POST /api/reminders/send
{
  "invoiceId": "uuid",
  "reminderType": "friendly|polite|firm|urgent",
  "overdueDays": 1
}
```

### Auto Process Reminders
```
POST /api/reminders/auto-send
```

### Cron Job
```
GET /api/cron/reminders
```

### Test Cron Job
```
GET /api/test-cron
```

**Note:** The cron job runs automatically via Vercel's cron function. No authentication required for the actual cron execution.

## Database Schema

### invoice_reminders
- `id`: UUID primary key
- `invoice_id`: Foreign key to invoices
- `reminder_type`: Type of reminder sent
- `overdue_days`: Days overdue when sent
- `sent_at`: Timestamp when sent
- `email_id`: Email service ID for tracking

### invoices.reminder_settings
- `enabled`: Boolean to enable/disable
- `useSystemDefaults`: Use default schedule
- `customRules`: Custom reminder rules

## Customization

### Custom Reminder Rules
```typescript
const customRules = [
  {
    days: 1,
    type: 'friendly',
    enabled: true
  },
  {
    days: 5,
    type: 'polite',
    enabled: true
  }
];
```

### Email Template Customization
Modify templates in `src/lib/reminder-email-templates.tsx`:
- Change messaging tone
- Add custom branding
- Modify styling
- Add additional fields

## Monitoring

### Vercel Cron Job Monitoring
1. **Vercel Dashboard**: Check the Functions tab for cron job execution logs
2. **Function Logs**: View detailed logs in Vercel's function monitoring
3. **Manual Testing**: Use `/api/test-cron` to test the cron job manually

### Reminder Statistics
Query the `reminder_stats` view for insights:
```sql
SELECT * FROM reminder_stats 
WHERE user_id = 'your-user-id';
```

### Overdue Invoices
Use the `get_overdue_invoices_for_reminders()` function:
```sql
SELECT * FROM get_overdue_invoices_for_reminders();
```

### Cron Job Logs
The cron job provides detailed logging:
- ✅ Successful reminder sends
- ⏭️ Skipped invoices (already sent, disabled, etc.)
- ❌ Errors and failures
- 📊 Processing statistics

## Security

- Row Level Security (RLS) enabled
- User-specific data access
- Secure cron job authentication
- Email validation and sanitization

## Best Practices

1. **Test Templates**: Preview all email templates before going live
2. **Monitor Performance**: Track reminder effectiveness
3. **Respect Recipients**: Don't spam with too many reminders
4. **Customize Timing**: Adjust reminder schedules based on your business
5. **Track Results**: Monitor payment rates after reminders

## Troubleshooting

### Common Issues
1. **Reminders not sending**: Check cron job configuration
2. **Email delivery issues**: Verify Resend API key
3. **Database errors**: Ensure migrations are applied
4. **Template rendering**: Check business settings data

### Debug Mode
Enable debug logging by setting:
```env
DEBUG_REMINDERS=true
```

## Support

For issues or questions:
1. Check the logs in Vercel dashboard
2. Verify database connections
3. Test API endpoints manually
4. Review email service configuration
