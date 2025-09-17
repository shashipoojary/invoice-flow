# PostgreSQL Setup Guide

## Option 1: Using Docker (Recommended - Easiest)

### Step 1: Start PostgreSQL with Docker
```bash
# Start only the database (without the app for now)
docker-compose up postgres -d
```

### Step 2: Create your .env file
Create a `.env` file in your project root with:
```env
DATABASE_URL=postgresql://invoice_user:invoice_password@localhost:5432/invoice_flow
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 3: Run the database migrations
```bash
# Connect to the PostgreSQL container
docker exec -it invoice-flow-db psql -U invoice_user -d invoice_flow

# Then run the SQL from supabase/migrations/001_initial_schema.sql
```

### Step 4: Start your app
```bash
npm run dev
```

---

## Option 2: Install PostgreSQL Locally

### Step 1: Install PostgreSQL
- **Windows**: Download from https://www.postgresql.org/download/windows/
- **Mac**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

### Step 2: Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE invoice_flow;
CREATE USER invoice_user WITH PASSWORD 'invoice_password';
GRANT ALL PRIVILEGES ON DATABASE invoice_flow TO invoice_user;
\q
```

### Step 3: Run Migrations
```bash
# Connect to your database
psql -U invoice_user -d invoice_flow

# Copy and paste the SQL from supabase/migrations/001_initial_schema.sql
```

### Step 4: Create .env file
```env
DATABASE_URL=postgresql://invoice_user:invoice_password@localhost:5432/invoice_flow
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 5: Start your app
```bash
npm run dev
```

---

## Quick Test

1. Open http://localhost:3000
2. Click "Sign In" 
3. Create a new account or sign in with your credentials
4. You should see the dashboard ready for creating your first invoice!

## Troubleshooting

- **Connection refused**: Make sure PostgreSQL is running
- **Database doesn't exist**: Run the migration SQL
- **Permission denied**: Check your database user permissions
