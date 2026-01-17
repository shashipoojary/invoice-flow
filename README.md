# FlowInvoicer - Fast Freelancer Invoicing

> The fastest way for freelancers & contractors to get paid

A modern, responsive invoicing application built with Next.js, designed specifically for freelancers and small contractors who need to get paid quickly and professionally.

## ✨ Features

- ⚡ **60-Second Invoicing** - Create professional invoices in under a minute
- 📱 **Fully Responsive** - Perfect on mobile, tablet, and desktop
- 🎨 **Custom Branding** - Add your logo, business name, and colors
- 💳 **Payment Integration** - Display your payment details directly
- 📧 **Email Automation** - Send invoices and reminders automatically
- 📊 **Analytics Dashboard** - Track your business performance
- 🔒 **Secure Authentication** - JWT-based user authentication
- 📄 **PDF Generation** - Professional invoice PDFs
- 🗄️ **Supabase Database** - Scalable PostgreSQL database

## 🚀 Quick Start

### Local Development

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd subscription-pause-tool
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)**

### Test Credentials
- **Email:** `test@example.com`
- **Password:** `password123`

## 📱 Mobile Responsive

The application is fully responsive and works perfectly on:
- 📱 **Mobile** (320px - 767px) - Touch-optimized interface
- 📱 **Tablet** (768px - 1199px) - Balanced layout
- 💻 **Desktop** (1200px+) - Full feature experience

### Responsive Features:
- Flexible navigation that adapts to screen size
- Touch-friendly buttons and inputs
- Optimized typography and spacing
- Mobile-first design approach

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **PDF:** React PDF for invoice generation
- **Icons:** Lucide React
- **Styling:** Tailwind CSS with custom design system

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set environment variables (see [docs/SETUP.md](./docs/SETUP.md) for full list)
4. Deploy!

**See [docs/SETUP.md](./docs/SETUP.md) for detailed setup and deployment instructions.**

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (auth, invoices, etc.)
│   ├── auth/              # Authentication page
│   ├── invoices/          # Invoice management pages
│   └── settings/          # User settings page
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks (useAuth)
├── lib/                   # Database and utility functions
└── types/                 # TypeScript definitions
```

## 🎯 Key Features

### Dashboard
- Revenue and client statistics
- Recent invoices overview
- Quick action buttons
- Responsive grid layouts

### Authentication
- Secure login/registration
- JWT token management
- Protected routes
- Profile management

### Invoice Management
- Fast invoice creation
- Service-based invoicing (no quantities)
- PDF generation
- Email sending
- Status tracking

### Settings
- Business profile setup
- Payment details configuration
- Logo upload
- Brand customization

## 🔧 Environment Variables

For production deployment, set these environment variables (see [docs/SETUP.md](./docs/SETUP.md) for complete list):

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-key
```

## 📦 Dependencies

### Core Dependencies
- `next` - React framework
- `react` - UI library
- `@supabase/supabase-js` - Supabase client
- `@react-pdf/renderer` - PDF generation
- `resend` - Email service
- `lucide-react` - Icons
- `tailwindcss` - Styling

## 🎨 Design System

- **Colors:** Professional blue and slate palette
- **Typography:** Clean, readable fonts
- **Spacing:** Consistent 4px grid system
- **Components:** Reusable, accessible UI elements
- **Dark Mode:** Full dark/light theme support

## 🔒 Security

- Supabase Auth with JWT tokens
- Row Level Security (RLS) policies
- Protected API routes
- Input validation and sanitization
- Secure environment variable handling
- Webhook signature verification

## 📈 Performance

- Server-side rendering (SSR)
- Optimized images and assets
- Efficient database queries
- Minimal bundle size
- Fast page loads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own invoicing needs!

## 🆘 Support

- Check the [docs/SETUP.md](./docs/SETUP.md) for setup and deployment instructions
- Check the [docs/REFERENCE.md](./docs/REFERENCE.md) for detailed documentation
- Review the code comments for implementation details
- Create an issue for bugs or feature requests

---

**Built with ❤️ for freelancers who want to get paid faster**