# CurioPay

A modern payment and financial management platform built with Next.js.

## 🚀 Features

- **User Management**
  - Email verification system
  - Profile management with avatar upload
  - Account deletion and data clearing
  - Password reset functionality

- **Financial Management**
  - Expense tracking with categories
  - Budget monitoring with alerts
  - Data export in CSV/ZIP formats
  - Recurring payment support

- **Analytics & Reporting**
  - Monthly spending trends
  - Category-wise expense analysis
  - Real-time budget tracking
  - Customizable date ranges

## 📡 API Endpoints

### Authentication
```bash
POST /api/auth/reset-password    # Request password reset
PATCH /api/auth/reset-password   # Reset password with token
GET  /api/auth/[...nextauth]     # NextAuth.js authentication routes
```

### User Management
```bash
GET  /api/profile               # Get user profile
PUT  /api/profile              # Update user profile
POST /api/verify               # Request email verification
GET  /api/verify               # Verify email token
```

### Settings & Data
```bash
GET  /api/settings             # Get user settings
PUT  /api/settings             # Update user settings
POST /api/settings/clear-data  # Clear user data
POST /api/settings/delete-account # Delete user account
```

### File Operations
```bash
POST /api/upload               # Upload files (avatars)
POST /api/export               # Export user data
```

### Financial Management
```bash
GET  /api/categories           # Get expense categories
POST /api/categories           # Create new category
```

## 🛠️ Setup Guide

1. Clone and install dependencies:
```bash
git clone https://github.com/AdhamAfis/curiopay
cd curiopay
npm install
```

2. Configure environment variables:
```bash
# .env.local
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email"
SMTP_PASS="your-password"
SMTP_FROM="noreply@example.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
SENTRY_DSN="your-sentry-dsn"
```

3. Initialize database:
```bash
npm run db:migrate   # Run migrations
npm run db:seed     # Seed initial data
```

4. Start development server:
```bash
npm run dev
```

## 🐋 Docker Setup

### Prerequisites
- Docker
- Docker Compose

### To Run Docker

To use docker container start `setup.sh` file in project root and follow instructions 

## 🔐 Security Features

- CSRF protection via Next.js defaults
- Rate limiting on sensitive routes
- Secure password hashing with bcrypt
- Email verification system
- JWT-based authentication
- Secure file uploads with type validation
- Data sanitization on API endpoints

## 🧪 Error Handling

- Sentry integration for error tracking
- Custom error boundaries
- API error responses with proper status codes
- Form validation with detailed error messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

