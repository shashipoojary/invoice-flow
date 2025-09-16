# InvoiceFlow Pro - Enterprise Invoice Management

A modern, responsive invoice management system built with Next.js, designed for freelancers and small businesses. Features a clean, professional interface with dark/light mode support, client management, and comprehensive invoice tracking.

## 🚀 Features

- **Invoice Management**: Create, edit, view, and track invoices
- **Client Management**: Manage client information and contact details
- **PDF Generation**: Download invoices as PDF files
- **Email Integration**: Send invoices directly via email
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes for better user experience
- **Real-time Dashboard**: Track revenue, outstanding amounts, and overdue invoices
- **Professional UI**: Clean, modern interface with Google Fonts

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL
- **Icons**: Lucide React
- **Deployment**: Docker, Docker Compose

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Git

## 🐳 Quick Start with Docker (Recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/invoice-flow-pro.git
cd invoice-flow-pro
```

### 2. Environment Setup
```bash
# Copy the environment example file
cp env.example .env

# Edit the .env file with your configuration
nano .env
```

### 3. Start with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

### 4. Access the Application
- **Application**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 🏃‍♂️ Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
# Copy environment file
cp env.example .env

# Edit with your local database settings
nano .env
```

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗄️ Database Setup

The application uses PostgreSQL with the following default configuration:

- **Database**: `invoice_flow`
- **Username**: `invoice_user`
- **Password**: `invoice_password`
- **Port**: `5432`

### Database Schema

The application includes the following tables:
- `clients` - Client information
- `invoices` - Invoice details
- `invoice_items` - Individual invoice line items

Sample data is automatically loaded when using Docker.

## 🐳 Docker Services

### Services Included:
- **app**: Next.js application (Port 3000)
- **postgres**: PostgreSQL database (Port 5432)
- **redis**: Redis cache (Port 6379)

### Docker Commands:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up --build

# Remove all data (including database)
docker-compose down -v
```

## 📁 Project Structure

```
invoice-flow-pro/
├── src/
│   └── app/
│       ├── page.tsx          # Main application
│       ├── layout.tsx        # Root layout
│       └── globals.css       # Global styles
├── public/                   # Static assets
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Multi-service setup
├── init.sql                # Database initialization
├── env.example             # Environment variables template
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://invoice_user:invoice_password@localhost:5432/invoice_flow

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Email (for sending invoices)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🚀 Deployment

### Production Deployment

1. **Update Environment Variables**:
   ```bash
   # Set production values in .env
   NODE_ENV=production
   DATABASE_URL=your-production-database-url
   ```

2. **Build and Deploy**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

### Cloud Deployment

The application is ready for deployment on:
- **Vercel** (recommended for Next.js)
- **AWS ECS/Fargate**
- **Google Cloud Run**
- **DigitalOcean App Platform**
- **Railway**
- **Render**

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🎨 Customization

### Themes
- Toggle between dark and light modes
- Custom color schemes in `globals.css`
- Professional Google Fonts integration

### Styling
- Tailwind CSS v4 with custom configuration
- Component-based styling
- Responsive design patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@invoiceflowpro.com or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- Fonts by [Google Fonts](https://fonts.google.com/)
