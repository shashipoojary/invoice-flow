# InvoiceFlow - Fast Freelancer Invoicing

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
- 🗄️ **SQLite Database** - Simple, reliable data storage

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

### Getting Started
1. Create your account by clicking "Sign Up"
2. Complete your business settings in the Settings tab
3. Add your first client and create your first invoice

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
- **Backend:** Next.js API Routes, SQLite with better-sqlite3
- **Authentication:** Custom JWT-based system
- **Database:** SQLite (works out of the box)
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
3. Set environment variables:
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   DATABASE_URL=file:./invoice_flow.db
   ```
4. Deploy!

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.**

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

For production deployment, set these environment variables:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL=file:./invoice_flow.db
```

## 📦 Dependencies

### Core Dependencies
- `next` - React framework
- `react` - UI library
- `better-sqlite3` - Database
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `@react-pdf/renderer` - PDF generation
- `lucide-react` - Icons
- `tailwindcss` - Styling

## 🎨 Design System

- **Colors:** Professional blue and slate palette
- **Typography:** Clean, readable fonts
- **Spacing:** Consistent 4px grid system
- **Components:** Reusable, accessible UI elements
- **Dark Mode:** Full dark/light theme support

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization
- Secure environment variable handling

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

- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Review the code comments for implementation details
- Create an issue for bugs or feature requests

---

**Built with ❤️ for freelancers who want to get paid faster**