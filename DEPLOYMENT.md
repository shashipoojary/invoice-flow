# Deployment Guide for InvoiceFlow

## 🚀 Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account
- SQLite database (will be created automatically)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to [Vercel](https://vercel.com) and sign in**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (default)

### Step 3: Set Environment Variables

In your Vercel project dashboard:

1. **Go to Settings → Environment Variables**
2. **Add these variables:**

   ```
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   DATABASE_URL=file:./invoice_flow.db
   ```

   **Important:** 
   - Replace `your-super-secret-jwt-key-change-this-in-production` with a strong, random secret
   - The SQLite database will be created automatically on first run

### Step 4: Deploy

1. **Click "Deploy"**
2. **Wait for the build to complete**
3. **Your app will be live at:** `https://your-project-name.vercel.app`

## 🔧 Alternative: Deploy with Docker

If you prefer to use Docker:

### Step 1: Build Docker Image
```bash
docker build -t invoice-flow .
```

### Step 2: Run with Docker Compose
```bash
docker-compose up -d
```

### Step 3: Access Your App
- **Local:** http://localhost:3000
- **Database:** PostgreSQL on port 5432

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- ✅ **Desktop** (1200px+)
- ✅ **Tablet** (768px - 1199px)
- ✅ **Mobile** (320px - 767px)

### Key Responsive Features:
- **Flexible navigation tabs** that wrap on mobile
- **Responsive grid layouts** for stats and actions
- **Touch-friendly buttons** with proper sizing
- **Mobile-optimized forms** and inputs
- **Responsive typography** that scales properly

## 🔒 Security Notes

1. **Change the JWT_SECRET** to a strong, random value
2. **Use HTTPS** in production (Vercel provides this automatically)
3. **Database:** SQLite is suitable for small to medium applications
4. **For high-traffic apps:** Consider upgrading to PostgreSQL

## 🐛 Troubleshooting

### Common Issues:

1. **Build fails:**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript errors are resolved

2. **Database errors:**
   - SQLite database is created automatically
   - Check environment variables are set correctly

3. **Authentication not working:**
   - Verify JWT_SECRET is set
   - Check browser console for errors

### Support:
- Check the terminal logs in Vercel dashboard
- Review browser console for client-side errors
- Ensure all environment variables are properly set

## 🎉 Success!

Once deployed, your InvoiceFlow application will be:
- ✅ **Fully responsive** on all devices
- ✅ **Secure** with JWT authentication
- ✅ **Fast** with optimized builds
- ✅ **Scalable** with Vercel's infrastructure

**Your freelancer invoicing app is ready to help people get paid faster!**
