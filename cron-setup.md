# Auto Reminder Cron Job Setup

## Option 1: Vercel Cron Jobs (Recommended)

Add this to your `vercel.json`:

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

This will run the auto reminder job every day at 9 AM UTC.

## Option 2: External Cron Service

Use a service like:
- **Cron-job.org** (Free)
- **EasyCron** (Paid)
- **SetCronJob** (Free tier available)

Set up a cron job to call:
```
POST https://your-domain.com/api/reminders/auto-send
Authorization: Bearer YOUR_CRON_SECRET
```

Schedule: `0 9 * * *` (daily at 9 AM)

## Option 3: GitHub Actions (Free)

Create `.github/workflows/auto-reminders.yml`:

```yaml
name: Auto Reminders
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send Auto Reminders
        run: |
          curl -X POST https://your-domain.com/api/reminders/auto-send \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

## Environment Variables

Add to your environment:
```
CRON_SECRET=your-secret-key-here
```

## Testing

Test the auto reminder system:
1. Create an overdue invoice
2. Call the API manually:
```bash
curl -X POST https://your-domain.com/api/reminders/auto-send \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Reminder Logic

The system automatically sends reminders based on:
- **First Reminder**: 1 day after due date
- **Second Reminder**: 1 week after due date  
- **Final Reminder**: 2 weeks after due date
- **Maximum**: 3 reminders per invoice (configurable)

## User Settings

Users can configure reminders in their settings:
- Enable/disable auto reminders
- Set maximum number of reminders
- Customize reminder templates
- Set reminder frequency
