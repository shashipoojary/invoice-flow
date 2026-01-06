# Dodo Payment Product Setup Guide

## 🎯 Why You Need a Product

According to the [official Dodo Payment API documentation](https://docs.dodopayments.com/api-reference/checkout-sessions/create), checkout sessions **require** a `product_cart` with a `product_id`. You cannot create a checkout session without first having a product.

## ✅ Solution: Create a Product First

### Option 1: Create Product in Dashboard (Recommended)

1. **Go to Dodo Payment Dashboard**
   - Log in at [https://dashboard.dodopayments.com](https://dashboard.dodopayments.com)

2. **Navigate to Products**
   - Click on **"Products"** in the sidebar
   - Or go to **"Products"** → **"All Products"**

3. **Create New Product**
   - Click **"Add Product"** or **"Create Product"** button
   - Fill in the details:
     - **Name**: "Monthly Subscription - $9" (or similar)
     - **Description**: "Monthly subscription plan"
     - **Price**: $9.00
     - **Currency**: USD
     - **Billing Period**: Monthly (if it's a subscription)
   - **Save** the product

4. **Copy the Product ID**
   - After creating, you'll see the product in the list
   - Click on the product to view details
   - **Copy the Product ID** (it will look like `prod_xxxxx` or similar)

5. **Add to Environment Variables**
   - In Vercel, go to **Project Settings** → **Environment Variables**
   - Add:
     ```
     DODO_PAYMENT_PRODUCT_ID=your-product-id-here
     ```
   - **Redeploy** your application

### Option 2: Create Product Programmatically

The code will **automatically try to create a product** if `DODO_PAYMENT_PRODUCT_ID` is not set, but this might not work for all account types. It's better to create it manually in the dashboard.

## 📋 Step-by-Step Instructions

### For Monthly Subscription ($9/month):

1. **Create Product:**
   - Name: "Monthly Subscription"
   - Price: $9.00
   - Billing: Monthly (recurring)
   - Currency: USD

2. **Copy Product ID** and add to Vercel:
   ```
   DODO_PAYMENT_PRODUCT_ID=prod_xxxxx
   ```

3. **Redeploy** and test

### For Pay Per Invoice ($0.50/invoice):

1. **Create Product:**
   - Name: "Pay Per Invoice"
   - Price: $0.50
   - Billing: One-time
   - Currency: USD

2. **Copy Product ID** and add to Vercel:
   ```
   DODO_PAYMENT_PRODUCT_ID=prod_yyyyy
   ```

3. **Redeploy** and test

## 🔍 How to Find Your Product ID

After creating a product in the Dodo Payment dashboard:

1. **In the Products List:**
   - The product ID is usually shown in the table
   - It might be in a column labeled "ID" or "Product ID"

2. **In Product Details:**
   - Click on the product name
   - The product ID is usually at the top of the page
   - It might be labeled as "Product ID" or just shown as an identifier

3. **Format:**
   - Product IDs usually look like: `prod_abc123xyz`
   - Or: `product_1234567890`
   - Or just a UUID: `550e8400-e29b-41d4-a716-446655440000`

## ⚠️ Important Notes

1. **One Product Per Plan:**
   - You might want to create separate products for:
     - Monthly subscription ($9/month)
     - Pay Per Invoice ($0.50/invoice)
   - Or use one product and override the amount in the checkout session

2. **Product Must Be Active:**
   - Make sure the product is **active/enabled** in the dashboard
   - Archived or disabled products won't work

3. **Environment Match:**
   - If you're in **sandbox/test mode**, create the product in **sandbox**
   - If you're in **production**, create it in **production**
   - Product IDs are different between environments

## 🧪 Testing

After setting `DODO_PAYMENT_PRODUCT_ID`:

1. **Redeploy** your application
2. **Click "Upgrade"** on a paid plan
3. **Check Vercel logs** - you should see:
   ```
   ✅ SUCCESS! Checkout session created:
      Session ID: sess_xxxxx
      Checkout URL: https://test.dodopayments.com/checkout/...
   ```
4. **You should be redirected** to the Dodo Payment checkout page

## 🆘 Troubleshooting

### Error: "Product not found"

- **Check:** Is `DODO_PAYMENT_PRODUCT_ID` set correctly in Vercel?
- **Check:** Is the product ID correct? (copy it fresh from dashboard)
- **Check:** Is the product active in the dashboard?
- **Check:** Are you using the right environment? (sandbox vs production)

### Error: "DODO_PAYMENT_PRODUCT_ID not found"

- **Solution:** Add `DODO_PAYMENT_PRODUCT_ID` to Vercel environment variables
- **Solution:** Redeploy after adding the variable

### Product Created But Checkout Still Fails

- **Check:** Product has a price set
- **Check:** Product is not archived
- **Check:** API key has write access enabled
- **Check:** You're using the correct product ID for your environment

## 📚 Reference

- [Dodo Payment API Docs - Create Checkout Session](https://docs.dodopayments.com/api-reference/checkout-sessions/create)
- [Dodo Payment API Docs - Products](https://docs.dodopayments.com/api-reference/products)

