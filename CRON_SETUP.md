# Cron Job Setup for Automated Reminders

## Overview
The automated reminder system uses scheduled reminders that are created when invoices are made, and a cron job that runs daily to send them.

## How It Works

1. **When Invoice is Created**: 
   - System creates scheduled reminders in `invoice_reminders` table
   - Each reminder has a `sent_at` date when it should be sent
   - Status is set to `scheduled`

2. **Daily Cron Job**:
   - Runs once per day (typically at 9 AM)
   - Finds all reminders scheduled for today
   - Sends emails and updates status to `sent` or `failed`

## Setup Instructions

### 1. Environment Variables
Add to your `.env.local` file:
```bash
CRON_SECRET=your-secret-key-here
RESEND_API_KEY=your-resend-api-key
```

### 2. Cron Job Configuration
Set up a cron job to call the endpoint daily:

**For Vercel (using Vercel Cron):**
Add to `vercel.json`:
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

**For other hosting providers:**
Set up a cron job to call:
```
POST https://your-domain.com/api/cron/reminders
Authorization: Bearer your-secret-key-here
```

### 3. Testing
To test the cron job manually, you can call:
```bash
curl -X POST https://your-domain.com/api/cron/reminders \
  -H "Authorization: Bearer your-secret-key-here"
```

## Current Status
✅ Cron job endpoint is ready at `/api/cron/reminders`
✅ Uses scheduled reminders from database
✅ Sends professional email reminders
✅ Updates reminder status after sending
✅ Handles errors gracefully

## What Happens
1. Cron job finds reminders scheduled for today
2. Sends email to client
3. Updates reminder status to `sent` or `failed`
4. Updates invoice reminder count
5. Logs all activities

The system is now properly set up to send scheduled reminders automatically!
