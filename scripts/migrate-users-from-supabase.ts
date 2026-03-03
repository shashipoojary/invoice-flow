/**
 * Migration Script: Migrate Users from Supabase Auth to PostgreSQL
 * 
 * IMPORTANT: 
 * - Password hashes CANNOT be exported from Supabase Auth for security reasons
 * - Users will need to reset their passwords after migration
 * - Or you'll need to export password hashes before migration (if possible)
 * 
 * Usage:
 * 1. Set OLD_SUPABASE_URL and OLD_SUPABASE_SERVICE_KEY in .env
 * 2. Set DATABASE_URL to your new PostgreSQL database
 * 3. Run: npx tsx scripts/migrate-users-from-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import { sql } from '../src/lib/postgres';

async function migrateUsers() {
  const oldSupabaseUrl = process.env.OLD_SUPABASE_URL;
  const oldSupabaseKey = process.env.OLD_SUPABASE_SERVICE_KEY;

  if (!oldSupabaseUrl || !oldSupabaseKey) {
    console.error('❌ OLD_SUPABASE_URL and OLD_SUPABASE_SERVICE_KEY must be set in .env');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL must be set in .env');
    process.exit(1);
  }

  console.log('🔄 Starting user migration from Supabase...');

  // Connect to old Supabase
  const supabase = createClient(oldSupabaseUrl, oldSupabaseKey);

  try {
    // Get all users from Supabase Auth
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users from Supabase:', error);
      process.exit(1);
    }

    if (!data || !data.users || data.users.length === 0) {
      console.log('ℹ️ No users found in Supabase');
      return;
    }

    console.log(`📊 Found ${data.users.length} users to migrate`);

    let successCount = 0;
    let errorCount = 0;

    // Migrate each user
    for (const user of data.users) {
      try {
        // Get subscription plan from profiles table (if exists)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // Get subscription info from users table (if exists)
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_plan, subscription_id, dodo_subscription_id, pay_per_invoice_activated_at')
          .eq('id', user.id)
          .single();

        const subscriptionPlan = userData?.subscription_plan || 'free';
        const subscriptionId = userData?.subscription_id || null;
        const dodoSubscriptionId = userData?.dodo_subscription_id || null;
        const payPerInvoiceActivated = userData?.pay_per_invoice_activated_at || null;

        // Insert user into new database
        // NOTE: Password hash cannot be migrated - users will need to reset passwords
        await sql`
          INSERT INTO users (
            id, 
            email, 
            email_verified, 
            subscription_plan,
            subscription_id,
            dodo_subscription_id,
            pay_per_invoice_activated_at,
            created_at
          )
          VALUES (
            ${user.id}::uuid,
            ${user.email},
            ${user.email_confirmed_at !== null},
            ${subscriptionPlan},
            ${subscriptionId},
            ${dodoSubscriptionId},
            ${payPerInvoiceActivated},
            ${user.created_at}
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            email_verified = EXCLUDED.email_verified,
            subscription_plan = EXCLUDED.subscription_plan,
            subscription_id = EXCLUDED.subscription_id,
            dodo_subscription_id = EXCLUDED.dodo_subscription_id,
            pay_per_invoice_activated_at = EXCLUDED.pay_per_invoice_activated_at
        `;
        
        console.log(`✅ Migrated user: ${user.email}`);
        successCount++;
      } catch (err: any) {
        console.error(`❌ Error migrating user ${user.email}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${data.users.length}`);

    console.log('\n⚠️  IMPORTANT:');
    console.log('   - Password hashes could not be migrated');
    console.log('   - Users will need to reset their passwords');
    console.log('   - Send password reset emails to all users');
    console.log('   - Or implement a password migration flow');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateUsers()
  .then(() => {
    console.log('\n✅ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

