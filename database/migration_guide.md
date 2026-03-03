# Database Migration Guide: Supabase → Self-Hosted PostgreSQL

## Overview
This guide will help you migrate from Supabase (managed PostgreSQL) to self-hosted PostgreSQL, reducing costs from ~$100/month to ~$15/month.

## Prerequisites
- VPS with Ubuntu/Debian (DigitalOcean, Hetzner, AWS Lightsail)
- SSH access to VPS
- Basic command line knowledge
- Backup of current Supabase database

---

## Phase 1: VPS Setup & PostgreSQL Installation

### Step 1.1: Set Up VPS
1. Create account on DigitalOcean/Hetzner/AWS Lightsail
2. Create droplet/server (minimum: 2GB RAM, 1 vCPU)
3. Note your VPS IP address

### Step 1.2: Install PostgreSQL

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL 15
sudo apt install postgresql-15 postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE DATABASE invoicedb;
CREATE USER invoiceuser WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE invoicedb TO invoiceuser;
\q
```

### Step 1.3: Configure PostgreSQL for Remote Access (Optional)

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf
# Find and set: listen_addresses = '*'

# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add line: host    invoicedb    invoiceuser    0.0.0.0/0    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 1.4: Install Redis (for Queue System)

```bash
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

---

## Phase 2: Database Migration

### Step 2.1: Export from Supabase

**Option A: Using Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Run: `pg_dump` command or use Export feature

**Option B: Using pg_dump (from local machine)**
```bash
pg_dump -h db.your-project.supabase.co \
        -U postgres \
        -d postgres \
        -f supabase_backup.sql
```

### Step 2.2: Import Schema to New PostgreSQL

```bash
# On your local machine or VPS
psql -h your-vps-ip -U invoiceuser -d invoicedb -f database/complete_setup.sql
```

### Step 2.3: Create Users Table

```bash
# Run the users table migration
psql -h your-vps-ip -U invoiceuser -d invoicedb -f database/migration_create_users_table.sql
```

### Step 2.4: Update Foreign Key References

You'll need to update tables that reference `auth.users` to reference `public.users` instead.

```sql
-- Example: Update profiles table
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;
```

---

## Phase 3: Code Migration

### Step 3.1: Install Dependencies

```bash
npm install postgres
npm install --save-dev @types/pg
```

### Step 3.2: Update Environment Variables

Update `.env.local`:

```env
# Remove Supabase variables
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=

# Add PostgreSQL connection
DATABASE_URL=postgresql://invoiceuser:your_password@your-vps-ip:5432/invoicedb

# Add JWT secret for auth (generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long

# Redis for queue (optional, can use same VPS)
REDIS_URL=redis://localhost:6379
```

### Step 3.3: Code Changes

The following files have been created:
- `src/lib/postgres.ts` - PostgreSQL client (replaces Supabase)
- `src/lib/db-functions.ts` - Database function helpers
- `src/lib/auth-middleware.ts` - Updated to use JWT
- `src/app/api/auth/login/route.ts` - New login endpoint
- `src/app/api/auth/register/route.ts` - New register endpoint

### Step 3.4: Migrate API Routes

You'll need to update all API routes that use Supabase. See migration examples in the main migration document.

---

## Phase 4: User Data Migration

### Step 4.1: Export Users from Supabase Auth

Create a migration script to export users:

```typescript
// scripts/migrate-users.ts
import { createClient } from '@supabase/supabase-js';
import { sql } from '../src/lib/postgres';

async function migrateUsers() {
  // Connect to old Supabase
  const supabase = createClient(
    process.env.OLD_SUPABASE_URL!,
    process.env.OLD_SUPABASE_SERVICE_KEY!
  );

  // Get all users from Supabase Auth
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`Found ${data.users.length} users to migrate`);

  // Insert into new database
  for (const user of data.users) {
    try {
      // Note: You'll need to handle password hashes separately
      // Supabase doesn't expose password hashes for security
      // Users will need to reset passwords or you'll need to export hashes before migration
      
      await sql`
        INSERT INTO users (
          id, 
          email, 
          email_verified, 
          created_at,
          subscription_plan
        )
        VALUES (
          ${user.id}::uuid,
          ${user.email},
          ${user.email_confirmed_at !== null},
          ${user.created_at},
          'free' -- Default, update from your profiles table if needed
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          email_verified = EXCLUDED.email_verified
      `;
      
      console.log(`Migrated user: ${user.email}`);
    } catch (err) {
      console.error(`Error migrating user ${user.email}:`, err);
    }
  }

  console.log('User migration complete');
}

migrateUsers();
```

**Important:** Password hashes cannot be exported from Supabase Auth. Users will need to:
- Reset passwords after migration, OR
- You export password hashes before migration (if possible)

---

## Phase 5: Testing Checklist

### Database Tests
- [ ] Can connect to PostgreSQL
- [ ] All tables exist
- [ ] All functions work (generate_invoice_number, etc.)
- [ ] All triggers work
- [ ] Foreign keys work

### Authentication Tests
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens are generated correctly
- [ ] Protected routes require authentication
- [ ] Password reset works (if implemented)

### API Tests
- [ ] Invoice creation works
- [ ] Invoice listing works
- [ ] Invoice updates work
- [ ] Payment recording works
- [ ] Reminder system works
- [ ] Estimate conversion works

### Frontend Tests
- [ ] Login page works
- [ ] Dashboard loads
- [ ] Invoice creation works
- [ ] All CRUD operations work

---

## Phase 6: Deployment

### Step 6.1: Update Production Environment

1. Update production `.env` with new `DATABASE_URL`
2. Update `JWT_SECRET`
3. Deploy updated code
4. Test thoroughly

### Step 6.2: Monitor

- Monitor error logs
- Check database connections
- Verify all features work
- Keep Supabase as backup for 1 month

---

## Rollback Plan

If something goes wrong:

1. Revert code changes (git revert)
2. Update environment variables back to Supabase
3. Restore from Supabase backup if needed
4. Fix issues and try again

---

## Cost Comparison

| Service | Before (Supabase) | After (Self-Hosted) | Savings |
|---------|------------------|---------------------|---------|
| Database | $20+/month | $0 (included in VPS) | $20+ |
| Hosting | $20+/month | $0 (same VPS) | $20+ |
| Email | $20/month | $5/month (SES) | $15 |
| Queue | Variable | $0 (Redis on VPS) | Variable |
| **Total** | **$100+/month** | **~$15/month** | **$85+/month** |

---

## Next Steps

1. ✅ Complete VPS setup
2. ✅ Import database schema
3. ✅ Create users table
4. ⏳ Migrate user data
5. ⏳ Update all API routes
6. ⏳ Test thoroughly
7. ⏳ Deploy to production

---

## Support

If you encounter issues:
1. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-15-main.log`
2. Check connection: `psql -h your-vps-ip -U invoiceuser -d invoicedb`
3. Verify environment variables are set correctly
4. Test database functions manually in psql

