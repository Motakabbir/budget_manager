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
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Set up database**:
   - Go to Supabase SQL Editor
   - Run the SQL script from `lib/supabase/schema.sql`
   - This creates all necessary tables and policies

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

- **profiles**: User profile information
- **categories**: Income and expense categories
- **transactions**: Financial transactions
- **savings_goals**: User-defined savings targets

All tables include Row Level Security (RLS) policies to ensure data privacy.

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and Supabase
