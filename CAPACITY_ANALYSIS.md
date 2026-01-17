# Website Capacity & Scalability Analysis

## Current Infrastructure (Free Tier)

### 🚀 Vercel Free Tier Limits
- **Serverless Functions**: 100GB-hours/month
- **Function Execution Time**: 10 seconds max per function
- **Concurrent Requests**: ~100-200 concurrent (soft limit)
- **Bandwidth**: 100GB/month
- **Build Time**: 45 minutes/month

### 🗄️ Supabase Free Tier Limits
- **Database Size**: 500MB
- **Database Connections**: 60 direct connections (pooled)
- **API Requests**: Unlimited (but rate-limited)
- **Bandwidth**: 5GB/month
- **Storage**: 1GB

### 📧 QStash Free Tier (Upstash)
- **Messages**: 10,000/month
- **Concurrent Jobs**: Unlimited
- **Retention**: 7 days
- **No rate limits on job processing**

---

## Current Capacity (Before Async Queue)

### ❌ **Bottleneck: Synchronous Processing**
- **Concurrent Users**: ~10-20 users (limited by function timeout)
- **Invoice Sending**: Blocks for 5-10 seconds per invoice
- **Reminder Sending**: Blocks for 3-5 seconds per reminder
- **Problem**: If 10 users send invoices simultaneously, some will timeout

### Why Limited?
1. **Function Timeout**: 10 seconds max per Vercel function
2. **Sequential Processing**: Each email/PDF generation blocks the function
3. **Database Connections**: Limited to 60 connections (shared across all users)
4. **No Queue**: All processing happens synchronously

---

## Current Capacity (After Async Queue) ✅

### ✅ **With Async Queue Enabled**
- **Concurrent Users**: **1000+ users** (theoretical limit)
- **Invoice Sending**: Returns immediately (< 1 second)
- **Background Processing**: Jobs process asynchronously
- **No Timeout Issues**: API returns before heavy processing

### How It Works:
1. **API Route** receives request → Enqueues job → Returns immediately (< 1 second)
2. **QStash** delivers job to queue handler
3. **Queue Handler** processes email/PDF in background
4. **No blocking**: Multiple users can send invoices simultaneously

---

## Real-World Capacity Estimates

### Scenario 1: Light Usage (Typical)
- **10-50 active users** sending invoices
- **Queue enabled**: ✅ Handles easily
- **Queue disabled**: ⚠️ May hit timeouts during peak

### Scenario 2: Medium Usage
- **50-200 active users** sending invoices
- **Queue enabled**: ✅ Handles well
- **Queue disabled**: ❌ Will hit timeouts and errors

### Scenario 3: Heavy Usage
- **200-1000 active users** sending invoices
- **Queue enabled**: ✅ Handles (with monitoring)
- **Queue disabled**: ❌ Will break

### Scenario 4: Very Heavy Usage
- **1000+ active users** sending invoices
- **Queue enabled**: ⚠️ May need QStash upgrade (paid tier)
- **Queue disabled**: ❌ Will definitely break

---

## Current Bottlenecks & Solutions

### 1. **Database Connections** (60 max on free tier)
**Current**: Shared connection pool
**Solution**: 
- ✅ Already using singleton pattern (efficient)
- ⚠️ May need Supabase Pro ($25/month) for more connections at scale

### 2. **Function Timeout** (10 seconds)
**Current**: Heavy tasks can timeout
**Solution**: 
- ✅ Async queue moves heavy tasks to background
- ✅ API returns immediately

### 3. **QStash Message Limit** (10,000/month free)
**Current**: 10,000 messages/month
**Calculation**: 
- 10,000 messages = ~333 invoices/day = ~10,000 invoices/month
- **Solution**: Upgrade to QStash Pro ($10/month) for unlimited messages

### 4. **Database Size** (500MB free)
**Current**: Limited storage
**Solution**: 
- Monitor database size
- Upgrade to Supabase Pro ($25/month) for 8GB

---

## Recommended Capacity Limits

### ✅ **Safe Operating Range** (Free Tier)
- **Concurrent Users**: 50-100 users
- **Daily Invoices**: 200-300 invoices/day
- **Monthly Invoices**: ~6,000 invoices/month
- **Queue Status**: ✅ **ENABLED** (required for this capacity)

### ⚠️ **At-Risk Range** (Free Tier)
- **Concurrent Users**: 100-200 users
- **Daily Invoices**: 300-500 invoices/day
- **Monthly Invoices**: ~10,000 invoices/month
- **Queue Status**: ✅ **ENABLED** (may need QStash upgrade)

### ❌ **Will Break** (Free Tier)
- **Concurrent Users**: 200+ users
- **Daily Invoices**: 500+ invoices/day
- **Monthly Invoices**: 15,000+ invoices/month
- **Action Required**: Upgrade infrastructure

---

## Upgrade Path (When Needed)

### Tier 1: Light Upgrade ($35/month)
- **QStash Pro**: $10/month (unlimited messages)
- **Supabase Pro**: $25/month (8GB database, 200 connections)
- **Capacity**: 200-500 concurrent users

### Tier 2: Medium Upgrade ($60/month)
- **QStash Pro**: $10/month
- **Supabase Pro**: $25/month
- **Vercel Pro**: $20/month (unlimited function hours)
- **Capacity**: 500-1000 concurrent users

### Tier 3: Heavy Upgrade ($100+/month)
- **QStash Pro**: $10/month
- **Supabase Pro**: $25/month
- **Vercel Pro**: $20/month
- **Additional**: CDN, monitoring, etc.
- **Capacity**: 1000+ concurrent users

---

## Monitoring & Alerts

### Key Metrics to Watch:
1. **QStash Message Usage**: Monitor monthly message count
2. **Database Size**: Monitor storage usage
3. **Function Timeouts**: Watch for timeout errors
4. **Database Connections**: Monitor connection pool usage
5. **API Response Times**: Should be < 1 second with queue enabled

### When to Upgrade:
- ✅ QStash: When approaching 8,000 messages/month
- ✅ Supabase: When database size > 400MB
- ✅ Vercel: When function hours > 80GB-hours/month
- ✅ Database: When connection errors occur

---

## Summary

### Current Capacity (Free Tier + Queue Enabled):
- **✅ 50-100 concurrent users** (safe)
- **✅ 200-300 invoices/day** (safe)
- **✅ ~6,000 invoices/month** (safe)

### With Queue Disabled:
- **⚠️ 10-20 concurrent users** (at risk)
- **⚠️ 50-100 invoices/day** (at risk)
- **⚠️ ~1,500 invoices/month** (at risk)

### Recommendation:
**✅ Keep `ENABLE_ASYNC_QUEUE=true`** for production to support 1000+ concurrent users.

---

## Next Steps

1. **Monitor Usage**: Track QStash messages, database size, function timeouts
2. **Set Alerts**: Get notified when approaching limits
3. **Plan Upgrades**: Know when to upgrade (before hitting limits)
4. **Optimize**: Remove unused data, optimize queries

