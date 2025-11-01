# Budget Manager 💰

A modern, full-featured personal- **🔮 Financial Forecasting**
  - Cash flow projections (3/6/12 months)
  - Burn rate calculations
  - Future balance predictions based on trends
  - What-if scenario analysis (salary increase, loan payoff, expense reduction, etc.)
  - Scenario comparison tools
  - Financial health indicators

- **🎯 Financial Goals & Milestones**
  - 10 pre-configured goal types (Emergency Fund, Vacation, House Down Payment, etc.)
  - Custom goal creation with personalized targets
  - Milestone tracking with visual progress timeline
  - Goal analytics (required monthly savings, time to completion, health status)
  - Priority ranking system (1-10 scale)
  - Auto-contribution scheduling (weekly/bi-weekly/monthly/quarterly)
  - Smart recommendations based on progress
  - Contribution history tracking
  - Goal completion celebrations

- **🔔 Notifications & Alerts**management application built with **Vite**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **shadcn/ui**, **Recharts**, and **Supabase**.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/Motakabbir/budget_manager)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)

---

## ✨ Features

### 📊 Core Features

- **Interactive Dashboard**
  - Real-time financial analytics and visualizations
  - Income vs Expenses comparison charts (6-month trends)
  - Category-wise spending breakdown with pie charts
  - Balance trend line charts over time
  - Monthly financial summaries with quick stats cards
  - Time period filtering (7 days, 30 days, 90 days, 1 year, all time)

- **💰 Transaction Management**
  - Track income and expenses with detailed categorization
  - Add, edit, and delete transactions seamlessly
  - Calendar-based date picker for accurate record-keeping
  - Rich descriptions and notes for each transaction
  - Real-time balance calculations with opening balance support
  - CSV export functionality for reporting

- **🏷️ Smart Categorization**
  - Custom color-coded categories for income and expenses
  - Visual category icons and badges
  - Category-specific budget limits (monthly/yearly)
  - Budget vs actual spending tracking
  - Category usage analytics

- **🎯 Savings Goals**
  - Set financial targets with deadlines
  - Visual progress tracking with progress bars
  - Add contributions to goals incrementally
  - Goal completion notifications
  - Multiple simultaneous savings goals

- **� Advanced Budgeting**
  - 50/30/20 budget rule implementation
  - Custom budget allocation with flexible percentages
  - Automatic category classification (needs/wants/savings)
  - Budget vs actual spending comparison
  - Smart recommendations based on spending patterns
  - Real-time utilization tracking

- **🔮 Financial Forecasting**
  - Cash flow projections (3/6/12 months)
  - Burn rate calculations
  - Future balance predictions based on trends
  - What-if scenario analysis (salary increase, loan payoff, expense reduction, etc.)
  - Scenario comparison tools
  - Financial health indicators

- **�🔔 Notifications & Alerts**
  - Budget overspending alerts
  - Savings goal milestone notifications
  - Real-time toast notifications for all actions
  - Notification history and management page
  - Spending threshold warnings

- **📤 Data Management**
  - Export transactions to CSV (Excel-compatible)
  - Full backup/restore functionality (JSON format)
  - Bulk data import/export
  - Data integrity validation
  - Automatic data persistence

### 🎨 User Experience

- **Theme System**
  - 🌞 Light Mode: Clean, bright interface
  - 🌙 Dark Mode: Eye-friendly for low-light environments
  - 💻 System Mode: Automatically matches OS preferences
  - Persistent theme storage across sessions
  - Smooth theme transitions with no flicker

- **📱 Responsive Design**
  - Mobile-first approach with collapsible sidebar
  - Touch-optimized controls (44x44px minimum tap targets)
  - Adaptive layouts for all screen sizes (mobile/tablet/desktop)
  - Progressive Web App (PWA) support - installable on mobile
  - Works offline with service workers

- **⚡ Performance Optimizations**
  - Lazy loading for optimal initial load times
  - Smart data caching with TanStack Query (75% faster after first visit)
  - Optimized bundle splitting and code chunks
  - Skeleton loaders for smooth perceived performance
  - React 19 with automatic batching

- **♿ Accessibility**
  - WCAG AA compliant
  - Full keyboard navigation support
  - Screen reader friendly with ARIA labels
  - High contrast mode support
  - Focus management and visible focus indicators

## 🛠️ Tech Stack

### Frontend
- **Framework**: Vite 7 + React 19 + TypeScript 5
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS 4 with PostCSS
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts 3
- **Icons**: Lucide React
- **Animations**: tw-animate-css

### Backend & Database
- **Backend**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth with email/password
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Real-time**: Supabase Realtime subscriptions

### State & Data Management
- **State Management**: Zustand 5 (lightweight and performant)
- **Data Fetching**: TanStack Query v5 (React Query) with automatic caching
- **Form Validation**: Zod 4 with TypeScript integration
- **Date Handling**: date-fns 4

### Developer Tools
- **Testing**: Vitest 4 + React Testing Library
- **Linting**: ESLint 9 with modern config
- **Error Tracking**: Sentry React for production monitoring
- **PWA**: vite-plugin-pwa for Progressive Web App support
- **Type Safety**: Full TypeScript with strict mode enabled

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm
- A **Supabase account** ([sign up here](https://supabase.com))

### Quick Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Motakabbir/budget_manager.git
   cd budget_manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Supabase**:
   - Create a new project in [Supabase Dashboard](https://app.supabase.com)
   - Go to **Project Settings** > **API**
   - Copy your **Project URL** and **anon public key**

4. **Configure environment variables**:
   - Copy `env.example.local` to `.env.local`:
     ```bash
     cp env.example.local .env.local
     ```
   - Update `.env.local` with your Supabase credentials:
     ```env
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

5. **Set up the database**:
   - Go to Supabase Dashboard → **SQL Editor** → **New Query**
   - Open `src/lib/supabase/schema.sql` in your editor
   - Copy the entire contents and paste into SQL Editor
   - Click **Run** to create all tables, indexes, RLS policies, and functions
   - See [Database Setup Guide](./docs/database/) for details

6. **Run the development server**:
   ```bash
   npm run dev
   ```

7. **Open your browser**:
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Sign up for a new account
   - Start tracking your finances! 🎉

### One-Command Migration

The database schema includes:
- ✅ All tables with proper relationships
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for optimal performance
- ✅ Functions and triggers
- ✅ Sample categories (optional)

For migration details, see:
- 📚 [Database Setup](./docs/database/DATABASE_SETUP.md)
- 🚀 [Quick Migration Guide](./docs/database/QUICK_MIGRATION.md)
- 📖 [Migration Guide](./docs/database/MIGRATION_GUIDE.md)

## 📁 Project Structure

```
budget_manager/
├── src/
│   ├── pages/                    # Main page components
│   │   ├── AuthPage.tsx          # Authentication (sign in/up)
│   │   ├── DashboardLayout.tsx   # Layout wrapper with sidebar
│   │   ├── DashboardPage.tsx     # Main dashboard with charts
│   │   ├── IncomePage.tsx        # Income transaction management
│   │   ├── ExpensesPage.tsx      # Expense transaction management
│   │   ├── CategoriesPage.tsx    # Category management
│   │   ├── NotificationsPage.tsx # Notification center
│   │   └── SettingsPage.tsx      # Settings & savings goals
│   │
│   ├── components/               # Reusable components
│   │   ├── ui/                   # shadcn/ui components (20+ components)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── dashboard/            # Dashboard-specific components
│   │   │   ├── QuickStatsCards.tsx
│   │   │   ├── ChartsSection.tsx
│   │   │   ├── MonthlyBreakdownCards.tsx
│   │   │   ├── SpendingAlertsCard.tsx
│   │   │   ├── NotificationStatusWidget.tsx
│   │   │   └── TimePeriodFilter.tsx
│   │   ├── loading/              # Loading states
│   │   │   └── LoadingSkeletons.tsx
│   │   ├── notifications/        # Notification components
│   │   │   ├── notification-panel.tsx
│   │   │   └── notification-item.tsx
│   │   ├── settings/             # Settings components
│   │   │   ├── DataManagementCard.tsx
│   │   │   └── NotificationSettings.tsx
│   │   ├── ErrorBoundary.tsx     # Error boundary wrapper
│   │   ├── sidebar.tsx           # Navigation sidebar
│   │   ├── top-bar.tsx           # Top navigation bar
│   │   ├── footer.tsx            # Footer component
│   │   ├── theme-toggle.tsx      # Theme switcher
│   │   ├── page-header.tsx       # Page header component
│   │   └── responsive-grid.tsx   # Responsive grid layout
│   │
│   ├── lib/                      # Utilities and configurations
│   │   ├── supabase/             # Supabase configuration
│   │   │   ├── client.ts         # Supabase client instance
│   │   │   ├── database.types.ts # Generated TypeScript types
│   │   │   └── schema.sql        # Complete database schema
│   │   ├── store/                # Zustand state management
│   │   │   └── index.ts          # Global state store
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── use-toast.ts
│   │   │   ├── use-mobile.ts
│   │   │   └── ...
│   │   ├── providers/            # Context providers
│   │   │   └── theme-provider.tsx
│   │   ├── utils/                # Utility functions
│   │   │   ├── export.ts         # CSV/JSON export utilities
│   │   │   └── ...
│   │   ├── validations/          # Zod validation schemas
│   │   ├── sentry.ts             # Error tracking config
│   │   └── utils.ts              # Common utilities
│   │
│   ├── test/                     # Test setup and utilities
│   │   ├── setup.ts              # Vitest configuration
│   │   ├── mocks/                # Mock data and functions
│   │   └── utils/                # Test utilities
│   │
│   ├── App.tsx                   # Main app component with routing
│   ├── main.tsx                  # App entry point
│   ├── index.css                 # Global styles
│   └── vite-env.d.ts             # Vite type declarations
│
├── docs/                         # Documentation
│   ├── guides/                   # User guides
│   │   ├── QUICK_START.md
│   │   ├── SETUP_GUIDE.md
│   │   ├── FEATURES_LOCATION_GUIDE.md
│   │   ├── PROJECT_SUMMARY.md
│   │   ├── BUDGET_FEATURE_SETUP.md
│   │   ├── NOTIFICATION_IMPLEMENTATION_GUIDE.md
│   │   ├── NEW_FEATURES_GUIDE.md
│   │   ├── RESPONSIVE_DESIGN.md
│   │   ├── VERCEL_DEPLOYMENT.md
│   │   └── ...
│   └── database/                 # Database documentation
│       ├── DATABASE_SETUP.md
│       ├── MIGRATION_GUIDE.md
│       ├── QUICK_MIGRATION.md
│       ├── migration_add_budgets.sql
│       ├── migration_add_notifications.sql
│       ├── migration_add_recurring.sql
│       └── ...
│
├── public/                       # Static assets
│   └── manifest.json             # PWA manifest
│
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
├── vitest.config.ts              # Vitest test configuration
├── eslint.config.mjs             # ESLint configuration
├── postcss.config.mjs            # PostCSS configuration
├── components.json               # shadcn/ui configuration
├── vercel.json                   # Vercel deployment config
├── env.example.local             # Environment variables template
└── README.md                     # This file
```

## 🗄️ Database Schema

### Tables Overview

| Table | Description | Key Features |
|-------|-------------|--------------|
| **profiles** | User profile information | Auto-created on signup |
| **categories** | Income/expense categories | Color-coded, user-specific |
| **transactions** | Financial transactions | Income & expenses with categories |
| **savings_goals** | User savings targets | Progress tracking, deadlines |
| **user_settings** | User preferences | Opening balance, theme, notifications |
| **category_budgets** | Budget limits per category | Monthly/yearly periods |
| **recurring_transactions** | Recurring transaction templates | Auto-generation support |
| **notifications** | System notifications | Budget alerts, goal updates |

### Security Features

- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ Users can only access their own data
- ✅ Secure authentication with JWT tokens
- ✅ API key protection with environment variables
- ✅ SQL injection prevention with parameterized queries

### Database Relationships

```
profiles (1) ──── (*) transactions
    │
    ├──── (*) categories
    │         └──── (*) category_budgets
    │
    ├──── (*) savings_goals
    │
    ├──── (1) user_settings
    │
    ├──── (*) recurring_transactions
    │
    └──── (*) notifications
```

For complete database documentation, see [docs/database/](./docs/database/)

## 📖 Features Breakdown

### Dashboard Page (`/dashboard`)
- **Quick Stats Cards**: Balance, Income, Expenses, Transaction count
- **Income vs Expenses Chart**: 6-month bar chart comparison
- **Category Breakdown**: Pie chart showing spending by category
- **Balance Trend**: Line chart tracking balance over time
- **Monthly Breakdown**: Card view of monthly summaries
- **Spending Alerts**: Budget overspending warnings
- **Notification Widget**: Recent notifications summary
- **Time Period Filter**: Quick filters (7d, 30d, 90d, 1y, all)

### Income Page (`/income`)
- Add new income transactions with date picker
- View all income in a responsive table
- Edit/delete existing income entries
- Category filtering
- Search functionality
- Export to CSV
- Real-time balance updates

### Expenses Page (`/expenses`)
- Add new expense transactions
- View all expenses in a table
- Edit/delete expense entries
- Category filtering and search
- Export to CSV
- Budget comparison per category

### Categories Page (`/categories`)
- Create custom income/expense categories
- Color picker for visual organization
- Edit category names and colors
- Delete unused categories
- View category usage statistics
- Budget limit assignment

### Notifications Page (`/notifications`)
- View all system notifications
- Mark notifications as read/unread
- Filter by notification type
- Clear notification history
- Budget alerts and goal updates
- Real-time notification updates

### Settings Page (`/settings`)
- **Profile Section**: Update name and email
- **Opening Balance**: Set initial account balance
- **Savings Goals**: Create and track financial goals
- **Category Budgets**: Set spending limits
- **Data Management**: 
  - Export all data as JSON backup
  - Import previously exported backup
  - CSV export for transactions
- **Account Actions**: Change password, sign out
- **Notification Settings**: Configure alert preferences

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests once (CI mode)
npm run test:run
```

Testing stack:
- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing
- **jsdom** - DOM simulation
- **@testing-library/user-event** - User interaction testing

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production (TypeScript + Vite) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on the codebase |
| `npm test` | Run Vitest tests in watch mode |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:coverage` | Generate test coverage report |
| `npm run test:run` | Run tests once (CI mode) |

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push your code to GitHub**
2. **Import repository** in [Vercel](https://vercel.com)
3. **Configure build settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Add environment variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **Deploy!** 🚀

The `vercel.json` file is already configured for SPA routing.

For detailed instructions, see [Vercel Deployment Guide](./docs/guides/VERCEL_DEPLOYMENT.md)

### Other Deployment Options

- **Netlify**: Works out of the box with Vite
- **Cloudflare Pages**: Fast global CDN
- **AWS Amplify**: AWS-hosted solution
- **GitHub Pages**: Free hosting for public repos

## 📚 Documentation

### Quick Links

- 📖 **[Quick Start Guide](./docs/guides/QUICK_START.md)** - Get started in 5 minutes
- 🔧 **[Setup Guide](./docs/guides/SETUP_GUIDE.md)** - Detailed setup instructions
- 🗄️ **[Database Setup](./docs/database/)** - Complete database documentation
- 🎯 **[Features Guide](./docs/guides/FEATURES_LOCATION_GUIDE.md)** - Where to find features
- 📊 **[Project Summary](./docs/guides/PROJECT_SUMMARY.md)** - Project overview
- 🚀 **[Deployment Guide](./docs/guides/VERCEL_DEPLOYMENT.md)** - Deploy to production

### Additional Resources

- [Budget Feature Setup](./docs/guides/BUDGET_FEATURE_SETUP.md)
- [Notification Implementation](./docs/guides/NOTIFICATION_IMPLEMENTATION_GUIDE.md)
- [New Features Guide](./docs/guides/NEW_FEATURES_GUIDE.md)
- [Responsive Design](./docs/guides/RESPONSIVE_DESIGN.md)
- [System Improvements](./docs/guides/SYSTEM_IMPROVEMENTS_SUMMARY.md)

## 🎨 Customization

### Theme Customization

Edit `src/index.css` to customize colors:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... more variables */
}
```

### Component Styling

All UI components are in `src/components/ui/` and can be customized individually.

### Adding New Features

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation item in `src/components/sidebar.tsx`
4. Add any database migrations in `docs/database/`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

Please ensure:
- Code follows TypeScript and ESLint rules
- All tests pass (`npm test`)
- New features include tests
- Documentation is updated

## 🐛 Known Issues

- Chart labels may show TypeScript warnings (Recharts typing limitation)
- Export utility has some `any` types (can be improved)
- PWA may require manual refresh after updates

These are non-blocking and don't affect functionality.

## 🔮 Roadmap

### Planned Features

- [ ] **Recurring Transactions**: Automatic transaction generation
- [ ] **Advanced Filtering**: Multi-criteria search and filtering
- [ ] **Budget Forecasting**: Predict future spending patterns
- [ ] **Receipt Upload**: Attach images to transactions
- [ ] **Multi-Currency**: Support for multiple currencies
- [ ] **Bank Integration**: Connect to bank accounts via Plaid
- [ ] **Shared Budgets**: Family/team budget sharing
- [ ] **Mobile App**: React Native mobile application
- [ ] **Reports & Insights**: Advanced analytics and reports
- [ ] **Tax Categorization**: Expense categorization for taxes

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

You are free to:
- ✅ Use commercially
- ✅ Modify
- ✅ Distribute
- ✅ Private use

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- [React](https://reactjs.org/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Supabase](https://supabase.com/) - Backend and database
- [Recharts](https://recharts.org/) - Charting library
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Zustand](https://zustand-demo.pmnd.rs/) - State management

## 📞 Support

Need help? Here's how to get support:

1. **📖 Check the documentation** in the `/docs` folder
2. **🐛 Open an issue** on [GitHub Issues](https://github.com/Motakabbir/budget_manager/issues)
3. **💬 Start a discussion** on [GitHub Discussions](https://github.com/Motakabbir/budget_manager/discussions)

## 📊 Project Stats

- **Version**: 1.0.0
- **Status**: ✅ Production Ready
- **Last Updated**: October 29, 2025
- **Language**: TypeScript
- **License**: MIT

---

<div align="center">

**Built with ❤️ using Vite, React 19, TypeScript, and Supabase**

[Report Bug](https://github.com/Motakabbir/budget_manager/issues) · [Request Feature](https://github.com/Motakabbir/budget_manager/issues) · [Documentation](./docs/)

</div>
