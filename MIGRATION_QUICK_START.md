# 🚀 Database Migration Quick Start Guide

## What We've Done

✅ **Core migration infrastructure is ready!**

All the foundation files for migrating from Supabase to self-hosted PostgreSQL have been created:

### Files Created:
1. **`src/lib/postgres.ts`** - PostgreSQL client (replaces Supabase)
2. **`src/lib/db-functions.ts`** - Database function helpers
3. **`src/lib/auth-middleware.ts`** - Updated to use JWT authentication
4. **`src/app/api/auth/login/route.ts`** - New login endpoint
5. **`src/app/api/auth/register/route.ts`** - New registration endpoint
6. **`database/migration_create_users_table.sql`** - Users table migration
7. **`database/migration_guide.md`** - Complete step-by-step guide
8. **`database/migration_example_api_route.md`** - API migration examples
9. **`scripts/vps-setup.sh`** - Automated VPS setup script
10. **`scripts/migrate-users-from-supabase.ts`** - User data migration script
11. **`MIGRATION_STATUS.md`** - Migration progress tracker

### Dependencies Installed:
- ✅ `postgres` npm package (PostgreSQL client)

---

## Next Steps (In Order)

### Step 1: Set Up VPS (15 minutes)

1. **Create VPS account** (DigitalOcean/Hetzner/AWS Lightsail)
2. **Create server** (minimum: 2GB RAM, 1 vCPU)
3. **SSH into VPS**:
   ```bash
   ssh root@your-vps-ip
   ```

4. **Run setup script**:
   ```bash
   # Upload scripts/vps-setup.sh to your VPS, then:
   chmod +x vps-setup.sh
   sudo ./vps-setup.sh
   ```

   Or manually install:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install postgresql-15 postgresql-contrib redis-server -y
   sudo systemctl start postgresql redis-server
   sudo systemctl enable postgresql redis-server
   
   # Create database
   sudo -u postgres psql
   CREATE DATABASE invoicedb;
   CREATE USER invoiceuser WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE invoicedb TO invoiceuser;
   \q
   ```

### Step 2: Import Database Schema (5 minutes)

```bash
# From your local machine
psql -h your-vps-ip -U invoiceuser -d invoicedb -f database/complete_setup.sql

# Create users table
psql -h your-vps-ip -U invoiceuser -d invoicedb -f database/migration_create_users_table.sql
```

### Step 3: Update Environment Variables (2 minutes)

Update `.env.local`:

```env
# Remove or comment out Supabase:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...

# Add PostgreSQL:
DATABASE_URL=postgresql://invoiceuser:your_password@your-vps-ip:5432/invoicedb

# Add JWT secret (generate a secure random string):
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long

# Redis (optional, for queue):
REDIS_URL=redis://your-vps-ip:6379
```

### Step 4: Test Database Connection (2 minutes)

```bash
# Test connection
psql -h your-vps-ip -U invoiceuser -d invoicedb

# Test a query
SELECT COUNT(*) FROM invoices;
\q
```

### Step 5: Start Migrating API Routes (1-2 hours)

Start with one simple route to test:

1. **Pick a simple route** (e.g., `/api/clients/route.ts`)
2. **Follow the pattern** in `database/migration_example_api_route.md`
3. **Test the route** after migration
4. **Move to next route**

**Migration Pattern:**
```typescript
// OLD (Supabase)
const { data } = await supabaseAdmin
  .from('table')
  .select('*')
  .eq('user_id', userId);

// NEW (PostgreSQL)
import { sql } from '@/lib/postgres';
const data = await sql`
  SELECT * FROM table
  WHERE user_id = ${userId}::uuid
`;
```

### Step 6: Migrate User Data (30 minutes)

**Important:** Password hashes cannot be exported from Supabase. Users will need to reset passwords.

```bash
# Set environment variables
export OLD_SUPABASE_URL=your-old-supabase-url
export OLD_SUPABASE_SERVICE_KEY=your-old-service-key
export DATABASE_URL=postgresql://invoiceuser:password@your-vps-ip:5432/invoicedb

# Run migration script
npx tsx scripts/migrate-users-from-supabase.ts
```

### Step 7: Test Everything (1 hour)

- [ ] User registration works
- [ ] User login works
- [ ] Invoice creation works
- [ ] Invoice listing works
- [ ] Payment recording works
- [ ] All dashboard pages load
- [ ] Reminder system works

### Step 8: Deploy to Production

1. Update production environment variables
2. Deploy code
3. Monitor error logs
4. Keep Supabase as backup for 1 month

---

## Quick Reference

### Common SQL Patterns

**SELECT:**
```typescript
const data = await sql`SELECT * FROM table WHERE id = ${id}::uuid`;
```

**INSERT:**
```typescript
const [new] = await sql`
  INSERT INTO table (col1, col2) 
  VALUES (${val1}, ${val2}) 
  RETURNING *
`;
```

**UPDATE:**
```typescript
const [updated] = await sql`
  UPDATE table 
  SET col1 = ${val1}, updated_at = NOW() 
  WHERE id = ${id}::uuid 
  RETURNING *
`;
```

**DELETE:**
```typescript
await sql`DELETE FROM table WHERE id = ${id}::uuid`;
```

**JSONB:**
```typescript
import { parseJsonb, stringifyJsonb } from '@/lib/postgres';

// Reading
const branding = parseJsonb(invoice.branding);

// Writing
await sql`
  UPDATE invoices 
  SET branding = ${stringifyJsonb(brandingData)}::jsonb 
  WHERE id = ${id}::uuid
`;
```

**RPC Functions:**
```typescript
import { generateInvoiceNumber } from '@/lib/db-functions';
const number = await generateInvoiceNumber(userId);
```

---

## Troubleshooting

### Can't connect to database?
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U invoiceuser -d invoicedb

# Check firewall
sudo ufw status
```

### Migration errors?
- Check database logs: `sudo tail -f /var/log/postgresql/postgresql-15-main.log`
- Verify environment variables are set
- Test connection manually with `psql`

### Auth not working?
- Verify `JWT_SECRET` is set and is at least 32 characters
- Check token is being sent in Authorization header
- Test login endpoint directly

---

## Cost Comparison

| Service | Before | After | Savings |
|---------|--------|-------|---------|
| Database | $20+/mo | $0 | $20+ |
| Hosting | $20+/mo | $0 | $20+ |
| Email | $20/mo | $5/mo | $15 |
| Queue | Variable | $0 | Variable |
| **Total** | **$100+/mo** | **~$15/mo** | **$85+/mo** |

**Annual Savings: ~$1,020+**

---

## Need Help?

1. Check `database/migration_guide.md` for detailed steps
2. Review `database/migration_example_api_route.md` for code examples
3. Check `MIGRATION_STATUS.md` for progress tracking

---

## Ready to Start?

**Begin with Step 1** (VPS setup) and work through each step sequentially. Take your time and test thoroughly at each stage!

Good luck! 🚀

