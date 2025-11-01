# User Onboarding & Navigation - Visual Guide

## 🎯 User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    NEW USER SIGN UP                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              DASHBOARD PAGE LOADS                           │
│  ┌─────────────────────────────────────────────┐           │
│  │  Top Bar:  [☰] Budget Manager  [🔍] [➕] [🔔]│           │
│  └─────────────────────────────────────────────┘           │
│  ┌──────────┐  ┌──────────────────────────────┐           │
│  │Sidebar   │  │   Dashboard Content          │           │
│  │Groups    │  │   (Charts, Stats, etc)       │           │
│  └──────────┘  └──────────────────────────────┘           │
└─────────────────┬───────────────────────────────────────────┘
                  │ (1 second delay)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              🎓 INTERACTIVE TOUR STARTS                      │
│  ┌───────────────────────────────────────────────────┐     │
│  │  Welcome to Budget Manager! 👋                     │     │
│  │  Let's take a quick tour...                       │     │
│  │  [← Previous]  [Next →]  [✕ Close]  (1 of 9)     │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   TOUR STEPS (9 TOTAL)                       │
├─────────────────────────────────────────────────────────────┤
│  Step 1: Dashboard Overview         ✅                      │
│  Step 2: Quick Add Transaction      ✅                      │
│  Step 3: Smart Notifications        ✅                      │
│  Step 4: Budget Management          ✅                      │
│  Step 5: Financial Goals            ✅                      │
│  Step 6: Reports & Analytics        ✅                      │
│  Step 7: Bank Accounts              ✅                      │
│  Step 8: Quick Search               ✅                      │
│  Step 9: Completion Message         ✅                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         TOUR COMPLETION SAVED TO DATABASE                    │
│  user_preferences:                                           │
│    - tour_completed = true                                   │
│    - tour_completed_at = 2025-11-01 10:30:00                │
│    - tour_version = "1.0.0"                                 │
│    - tours_viewed = ["main"]                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              USER STARTS USING APP                           │
│  - Quick Add for fast transactions                           │
│  - Grouped sidebar navigation                                │
│  - Smart notifications                                       │
│  - Tour won't auto-start again                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ (Later, if needed)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│         USER WANTS TO RESTART TOUR                           │
│  1. Navigate to Settings page                                │
│  2. Scroll to "Help & Support" section                       │
│  3. Click "Start Tour" button                                │
│  4. Tour resets and restarts                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI Component Layout

### Top Bar Structure
```
┌────────────────────────────────────────────────────────────────┐
│ [☰]  Budget Manager    [Search...]    [Quick Add ▼] [🔔] [🌙]  │
│                                         ↓                       │
│                          ┌──────────────────────────┐          │
│                          │ Quick Add Menu           │          │
│                          ├──────────────────────────┤          │
│                          │ [💰] Add Income          │          │
│                          │ [💸] Add Expense         │          │
│                          │ [📊] Create Budget       │          │
│                          │ [🎯] Add Goal            │          │
│                          ├──────────────────────────┤          │
│                          │ Most Used:               │          │
│                          │ • Dashboard              │          │
│                          │ • Budgets [Hot]          │          │
│                          │ • Reports                │          │
│                          └──────────────────────────┘          │
└────────────────────────────────────────────────────────────────┘
```

### Sidebar Structure (Simplified & Grouped)
```
┌──────────────────────────┐
│  📊 Overview             │
│    • Dashboard           │
│                          │
│  🏦 Financial Accounts ▼ │
│    • Bank Accounts       │
│    • Payment Cards       │
│    • Loans               │
│    • Investments         │
│    • Assets              │
│                          │
│  💰 Transactions ▼       │
│    • Income              │
│    • Expenses            │
│    • Recurring           │
│    • Categories          │
│                          │
│  🎯 Planning & Goals ▼   │
│    • Budgets [🔴]        │
│    • Advanced Budgeting  │
│    • Forecasting         │
│    • Financial Goals     │
│                          │
│  📈 Reports & Analytics ▼│
│    • Reports             │
│    • Analytics           │
│                          │
│  ⚙️  Settings ▼          │
│    • Notifications       │
│    • Preferences         │
│    • Security            │
│    • Settings            │
│                          │
│  ─────────────────────   │
│  [🚪] Sign Out           │
└──────────────────────────┘
```

---

## 📱 Responsive Breakpoints

### Mobile (< 768px)
```
┌────────────────────────────┐
│ [☰] Budget Manager  [🔍][➕][🔔]│
└────────────────────────────┘
    ↓ Click ☰
┌────────────────────────────┐
│                            │
│  SIDEBAR OVERLAY           │
│  (Full screen)             │
│  [✕] Close                 │
│  • Dashboard               │
│  • Bank Accounts ▼         │
│  • Transactions ▼          │
│  ...                       │
│                            │
└────────────────────────────┘

Tour adapts with smaller popovers
Quick Add shows: [➕ Quick Add]
```

### Tablet (768px - 1024px)
```
┌──────────┬─────────────────────────────┐
│ Sidebar  │ Top Bar + Content           │
│ (fixed)  │ [Search] [Quick Add] [🔔]   │
│          │                             │
│ • Groups │ Dashboard content           │
│   visible│                             │
│          │                             │
└──────────┴─────────────────────────────┘

Tour popovers position smartly
Quick Add shows full menu
```

### Desktop (> 1024px)
```
┌──────────┬──────────────────────────────────────────────┐
│ Sidebar  │ Top Bar [Search] [Quick Add] [Budgets] [Reports] [🔔]│
│ (fixed)  │                                               │
│          │ Dashboard content                             │
│ • Groups │                                               │
│   fully  │ (Maximum space)                               │
│   visible│                                               │
│          │                                               │
└──────────┴───────────────────────────────────────────────┘

Tour popovers large with descriptions
Quick Add shows desktop shortcuts
All features visible simultaneously
```

---

## 🎯 Tour Step Highlights

### Step 1: Dashboard
```
┌─────────────────────────────────────────┐
│  Welcome to Budget Manager! 👋           │
│  Let's take a quick tour of the key     │
│  features to help you get started.      │
│                                          │
│  [Next →]                    (1 of 9)   │
└─────────────────────────────────────────┘
     ↓ highlights entire dashboard
```

### Step 2: Quick Add
```
┌─────────────────────────────────────────┐
│  Quick Add Transaction 💰                │
│  Quickly add income or expenses with    │
│  one click. This is the fastest way.    │
│                                          │
│  [← Previous] [Next →]       (2 of 9)   │
└─────────────────────────────────────────┘
     ↓ highlights [Quick Add] button
```

### Step 3: Notifications
```
┌─────────────────────────────────────────┐
│  Smart Notifications 🔔                  │
│  Get AI-powered alerts for unusual      │
│  spending, budget warnings, and more.   │
│                                          │
│  [← Previous] [Next →]       (3 of 9)   │
└─────────────────────────────────────────┘
     ↓ highlights notification bell icon
```

### Steps 4-8: Continue through features...

### Step 9: Completion
```
┌─────────────────────────────────────────┐
│  You're All Set! 🎉                      │
│  You can restart this tour anytime      │
│  from Settings > Help. Now let's        │
│  start managing your finances!          │
│                                          │
│  [Get Started! 🚀]           (9 of 9)   │
└─────────────────────────────────────────┘
```

---

## 🎨 Color & Style Guide

### Gradients Used
```css
Primary Gradient:
  from-blue-600 to-purple-600

Hover State:
  from-blue-700 to-purple-700

Background Accent:
  from-blue-50 to-purple-50 (light mode)
  from-blue-950/20 to-purple-950/20 (dark mode)
```

### Component Styles

**Quick Add Button:**
```
┌──────────────────────────┐
│ ➕ Quick Add ⚡           │ ← Gradient background
└──────────────────────────┘   Blue → Purple
     ↓ Click
┌──────────────────────────┐
│ ⚡ Quick Actions          │
├──────────────────────────┤
│ [💰] Add Income  Ctrl+I  │ ← Keyboard shortcuts
│ [💸] Add Expense Ctrl+E  │   shown on desktop
│ [📊] Create Budget       │
│ [🎯] Add Goal            │
└──────────────────────────┘
```

**Sidebar Group (Collapsed):**
```
┌──────────────────────────┐
│ 🏦 Financial Accounts ▶  │ ← Chevron indicates state
└──────────────────────────┘
```

**Sidebar Group (Expanded):**
```
┌──────────────────────────┐
│ 🏦 Financial Accounts ▼  │
│   • Bank Accounts        │ ← Items visible
│   • Payment Cards        │
│   • Loans                │
│   • Investments          │
│   • Assets               │
└──────────────────────────┘
```

**Active Navigation Item:**
```
┌──────────────────────────┐
│   Budgets [🔴 2]         │ ← Gradient bg + badge
└──────────────────────────┘   Blue → Purple
```

---

## 🔄 State Management

### Tour State Flow
```
hasCompletedTour('main')
         ↓
     false (new user)
         ↓
   autoStartTourIfNeeded()
         ↓
   Tour starts (1s delay)
         ↓
   User completes/skips
         ↓
   saveTourCompletion('main')
         ↓
   Database updated
         ↓
   hasCompletedTour('main')
         ↓
     true (returning user)
         ↓
   Tour doesn't auto-start
```

### Sidebar Collapse State
```typescript
// State: Set<string> of collapsed group IDs
const [collapsedGroups, setCollapsedGroups] = useState(new Set());

// Toggle logic
const toggleGroup = (groupId: string) => {
  const newCollapsed = new Set(collapsedGroups);
  if (newCollapsed.has(groupId)) {
    newCollapsed.delete(groupId);  // Expand
  } else {
    newCollapsed.add(groupId);     // Collapse
  }
  setCollapsedGroups(newCollapsed);
};
```

---

## 📊 Database Structure

### user_preferences Table
```sql
┌──────────────────┬──────────────┬──────────────────┐
│ Column           │ Type         │ Default          │
├──────────────────┼──────────────┼──────────────────┤
│ user_id          │ UUID         │ [PK]             │
│ tour_completed   │ BOOLEAN      │ FALSE            │
│ tour_completed_at│ TIMESTAMPTZ  │ NULL             │
│ tour_version     │ TEXT         │ '1.0.0'          │
│ tours_viewed     │ TEXT[]       │ ARRAY[]::TEXT[]  │
│ ...other columns │              │                  │
└──────────────────┴──────────────┴──────────────────┘
```

### Sample Data
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "tour_completed": true,
  "tour_completed_at": "2025-11-01T10:30:00Z",
  "tour_version": "1.0.0",
  "tours_viewed": ["main", "budget"]
}
```

---

## 🎯 Quick Reference

### Keyboard Shortcuts
- `Ctrl + I` → Add Income
- `Ctrl + E` → Add Expense
- `Ctrl + B` → Create Budget
- `Ctrl + G` → Add Goal

### Data Attributes for Tour
- `data-tour="dashboard"` → Dashboard link
- `data-tour="quick-add"` → Quick Add button
- `data-tour="notifications"` → Notification bell
- `data-tour="nav-budgets"` → Budgets link
- `data-tour="nav-goals"` → Goals link
- `data-tour="nav-reports"` → Reports link
- `data-tour="nav-accounts"` → Bank Accounts link
- `data-tour="search"` → Search input

### Important Files
```
📁 User Tour Service
   src/lib/services/user-tour.service.ts

📁 Quick Access Component
   src/components/quick-access.tsx

📁 Sidebar Component
   src/components/sidebar.tsx

📁 Database Migration
   docs/database/migration_add_user_tour.sql

📁 Documentation
   USER_ONBOARDING_NAVIGATION.md
   ONBOARDING_QUICK_SUMMARY.md
   IMPLEMENTATION_COMPLETE.md
```

---

## ✅ Testing Quick Checklist

```
□ New user → Tour auto-starts
□ Tour → Complete all 9 steps
□ Tour → Skip/close works
□ Database → Tour completion saved
□ Returning user → Tour doesn't restart
□ Settings → "Start Tour" button visible
□ Settings → Click restart works
□ Top bar → Quick Add button visible
□ Quick Add → Dropdown opens/closes
□ Quick Add → Navigation works
□ Sidebar → Groups collapse/expand
□ Sidebar → Active item highlighted
□ Mobile → Responsive behavior works
□ Desktop → All shortcuts visible
□ Keyboard → Ctrl+I/E/B/G works
```

---

**Status**: ✅ **READY FOR PRODUCTION**

All components implemented, documented, and ready to deploy! 🚀
