# Budget Manager

A comprehensive budget management application built with Next.js, Tailwind CSS, shadcn/ui, Recharts, and Supabase.

## Features

- 📊 **Dashboard**: Visualize income vs expenses with interactive charts
- 💰 **Income & Expense Tracking**: Add, edit, and delete transactions
- 🏷️ **Category Management**: Organize transactions by custom categories
- 📈 **Financial Analytics**:
  - Total income vs expenses bar charts
  - Category-wise breakdown pie charts
  - Balance trends over time
  - Monthly financial summaries
- 🎯 **Savings Goals**: Set and track financial targets
- 📤 **Export Data**: Export transactions as CSV
- 🔐 **Authentication**: Secure user authentication with Supabase
- 📱 **Responsive Design**: Works seamlessly on all devices
- 🎨 **Modern UI**: Clean interface with shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: Zustand
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([sign up here](https://supabase.com))

### Quick Start

For detailed setup instructions, see our documentation:

- 📚 **[Complete Documentation](./docs/)** - All guides and documentation
- 🚀 **[Quick Start Guide](./docs/guides/QUICK_START.md)** - Get started in minutes
- 🗄️ **[Database Setup](./docs/database/)** - Database migration guide

### Installation

1. **Clone the repository**:

   ```bash
   git clone <your-repo-url>
   cd budget_manager
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up Supabase**:
   - Create a new project in [Supabase Dashboard](https://app.supabase.com)
   - Go to Project Settings > API
   - Copy your project URL and anon key

4. **Configure environment variables**:
   - Update `.env.local` with your Supabase credentials:

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Set up database** (One-Command Migration):
   - Go to Supabase Dashboard → SQL Editor → New Query
   - Copy and paste the entire contents of `src/lib/supabase/schema.sql`
   - Click "Run" to create all tables, indexes, policies, and functions
   - See [docs/database/](./docs/database/) for complete database documentation

6. **Run the development server**:

   ```bash
   npm run dev
   ```

7. **Open your browser**:
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Sign up for a new account
   - Start tracking your finances!

## Database Schema

The application uses the following tables:

- **categories**: Income and expense categories with color-coding
- **transactions**: All financial transactions (income/expenses)
- **savings_goals**: User-defined savings targets with progress tracking
- **user_settings**: User preferences and opening balance
- **category_budgets**: Budget limits per category (monthly/yearly)
- **recurring_transactions**: Templates for recurring transactions

All tables include Row Level Security (RLS) policies to ensure data privacy and multi-user support.

For complete database setup instructions, see [docs/database/](./docs/database/)

## Project Structure

```
budget_manager/
├── app/
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── dashboard/       # Main dashboard with charts
│   │   ├── categories/      # Category management
│   │   ├── income/          # Income transactions
│   │   ├── expenses/        # Expense transactions
│   │   └── settings/        # User settings & savings goals
│   ├── auth/                # Authentication pages
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home/redirect page
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── sidebar.tsx          # Navigation sidebar
├── lib/
│   ├── supabase/            # Supabase configuration
│   │   ├── client.ts        # Supabase client
│   │   ├── database.types.ts # TypeScript types
│   │   └── schema.sql       # Database schema
│   ├── store/               # Zustand state management
│   └── utils.ts             # Utility functions
└── public/                  # Static assets
```

## Features Breakdown

### Dashboard

- View total balance, income, and expenses
- Interactive charts:
  - Bar chart: Income vs Expenses over 6 months
  - Pie chart: Category breakdown
  - Line chart: Balance trend over time

### Categories

- Create custom categories for income and expenses
- Color-coded for easy identification
- Edit and delete categories

### Income & Expenses

- Add transactions with amount, date, category, and description
- Filter and search transactions
- Export data to CSV format
- Edit and delete existing transactions

### Settings & Savings Goals

- Update profile information
- Change password
- Create savings goals with:
  - Target amount
  - Current progress
  - Deadline
  - Progress visualization
- Add contributions to goals

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables (Supabase URL and key)
4. Deploy!

For detailed deployment instructions, see [docs/guides/VERCEL_DEPLOYMENT.md](./docs/guides/VERCEL_DEPLOYMENT.md)

## Documentation

📚 **[Complete Documentation](./docs/)** - All project documentation

- **[Quick Start Guide](./docs/guides/QUICK_START.md)** - Get started quickly
- **[Setup Guide](./docs/guides/SETUP_GUIDE.md)** - Detailed setup instructions
- **[Database Setup](./docs/database/)** - Database migration and setup
- **[Features Guide](./docs/guides/FEATURES_LOCATION_GUIDE.md)** - Understand the codebase
- **[Project Summary](./docs/guides/PROJECT_SUMMARY.md)** - Project overview

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and Supabase
