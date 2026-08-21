# CyberSec Portal - Laravel Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd C:\Users\Kenshi\Desktop\WebDevFolder\LaravelMigration

# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

### 2. Configure Environment

Make sure your `.env` file has the correct database settings:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cybersec_portal
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Create Database

Create the database in phpMyAdmin or MySQL:

```sql
CREATE DATABASE cybersec_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run Migrations & Seeders

```bash
# Run all migrations
php artisan migrate

# Seed default users
php artisan db:seed --class=DefaultUserSeeder
```

### 5. Build Frontend Assets

```bash
# Development build with hot reload
npm run dev

# OR production build
npm run build
```

### 6. Start the Server

```bash
php artisan serve
```

Visit: http://localhost:8000

## 👤 Default Login Credentials

**Super Admin:**
- Email: `superadmin@company.com`
- Password: `password`

**Admin:**
- Email: `admin@company.com`
- Password: `password`

## 🎨 Features Implemented

### Phase 1-4 Complete ✅

- **Database Schema**: All 19 tables migrated
- **Eloquent Models**: 17 models with relationships
- **Authentication**: Laravel Fortify with role-based access
- **Layout Components**: Sidebar, Topbar, AppLayout
- **Theme Support**: Light, Dark, and Ember (black-orange) themes
- **Role System**: super_admin, admin, cyber_security, it, unassigned

## 🔐 Role Permissions

### Super Admin
- Full access to all modules
- User management
- Notifications configuration
- System settings

### Admin
- All modules except user management
- Cannot access notifications
- Can view reports and analytics

### Unassigned
- Dashboard (limited)
- Incident reporting only

## 📁 Project Structure

```
LaravelMigration/
├── app/
│   ├── Http/
│   │   ├── Controllers/        # Controllers (to be created)
│   │   └── Middleware/
│   │       └── RoleMiddleware.php  ✅
│   ├── Models/                 # ✅ All 17 models
│   └── Services/
│       ├── AuditService.php    ✅
│       └── TelegramService.php ✅
│
├── database/
│   ├── migrations/             # ✅ All 19 migrations
│   └── seeders/
│       └── DefaultUserSeeder.php ✅
│
├── resources/
│   └── js/
│       ├── components/
│       │   ├── AppLayout.tsx   ✅
│       │   ├── Sidebar.tsx     ✅
│       │   └── Topbar.tsx      ✅
│       ├── pages/
│       │   └── dashboard.tsx   ✅
│       └── types/
│           └── auth.ts         ✅ (updated with role)
│
└── public/
    ├── css/
    │   └── custom.css          ✅ (your design preserved)
    └── shield.png              ✅
```

## 🎯 Next Steps (Phase 5+)

### Controllers to Create:
- [ ] DashboardController
- [ ] IncidentController
- [ ] HardwareController
- [ ] SoftwareController
- [ ] SystemController
- [ ] ThreatIntelController
- [ ] RiskController
- [ ] BranchController
- [ ] BranchSecurityController
- [ ] UserController
- [ ] ReportController
- [ ] AnalyticsController
- [ ] NotificationController

### Pages to Create:
Each module needs: `index.tsx`, `create.tsx`, `edit.tsx`, `view.tsx`

## 🛠️ Common Commands

```bash
# Run migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Fresh migration (drops all tables)
php artisan migrate:fresh

# Seed database
php artisan db:seed

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Build assets for production
npm run build

# Development with hot reload
npm run dev
```

## 🐛 Troubleshooting

### Migration Errors
If you get foreign key constraint errors, run:
```bash
php artisan migrate:fresh
php artisan db:seed
```

### Frontend Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Theme Not Applying
Clear your browser cache and cookies, especially the `theme` cookie.

## 📝 Notes

- All your original custom CSS is preserved in `/public/css/custom.css`
- Font Awesome 6.4.0 is loaded from CDN
- Tailwind CSS is configured for dark mode with class strategy
- The layout automatically detects and applies saved theme preferences
- Role-based navigation is handled in the Sidebar component

## 🔒 Security Notes

- Change default passwords immediately in production
- Set `APP_DEBUG=false` in production `.env`
- Configure proper database credentials
- Set up SSL/TLS for production deployment
- Review and update CORS settings if needed
