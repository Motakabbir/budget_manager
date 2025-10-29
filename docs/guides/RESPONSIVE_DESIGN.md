# Responsive Design & Dark Mode Features

This document outlines the responsive mobile design and dark/light theme features added to Budget Manager v1.0.0.

## 🎨 Dark Mode / Light Mode

### Features

- **Three Theme Modes**: Light, Dark, and System (auto-detects OS preference)
- **Persistent Storage**: Theme preference saved in localStorage
- **Smooth Transitions**: Animated theme switching with 200ms transitions
- **System Sync**: Automatically follows system dark mode preference when set to "System"
- **Theme Toggle**: Accessible dropdown menu in the sidebar header

### Implementation

The theme system uses:

- **ThemeProvider**: React Context-based theme management
- **ThemeToggle Component**: Dropdown menu with Sun/Moon/Monitor icons
- **CSS Variables**: Dynamic color scheme switching via CSS custom properties
- **Tailwind Dark Mode**: Using the `dark:` variant for dark mode styles

### Usage

The theme toggle is located in the sidebar header. Users can:

1. Click the theme icon (Sun/Moon)
2. Select from three options:
   - ☀️ Light - Always use light theme
   - 🌙 Dark - Always use dark theme
   - 🖥️ System - Follow OS preference

### Color Scheme

#### Light Mode

- Background: Pure white (#FFFFFF)
- Text: Dark gray
- Cards: White with subtle shadows
- Primary: Blue-purple gradient
- Accent: Light gray

#### Dark Mode

- Background: Very dark gray (#1A1A1A)
- Text: Light gray/white
- Cards: Dark gray with subtle borders
- Primary: Light blue-purple
- Accent: Medium gray

## 📱 Responsive Mobile Design

### Mobile-First Approach

All pages and components are designed with mobile-first principles:

- Touch-friendly tap targets (minimum 44x44px)
- Responsive typography
- Adaptive layouts
- Optimized spacing

### Breakpoints

```
Mobile:    < 640px (sm)
Tablet:    640px - 768px (md)
Desktop:   768px - 1024px (lg)
Large:     1024px+ (xl)
```

### Key Responsive Features

#### 1. **Collapsible Sidebar**

- **Mobile**: Hamburger menu with slide-out sidebar
- **Tablet/Desktop**: Fixed sidebar always visible
- **Overlay**: Touch-friendly backdrop blur on mobile
- **Smooth Animations**: 300ms slide transitions

#### 2. **Responsive Navigation**

- Mobile menu button (top-left on mobile)
- Auto-close on navigation
- Touch-optimized tap targets
- Backdrop overlay for better UX

#### 3. **Adaptive Layouts**

- **Dashboard Cards**: 1 column mobile → 2 cols tablet → 3 cols desktop
- **Forms**: Stack vertically on mobile, horizontal on desktop
- **Charts**: Responsive containers with min-heights
- **Tables**: Horizontal scroll on mobile with proper overflow

#### 4. **Typography**

Responsive text utilities:

```css
.text-responsive-sm   /* text-sm md:text-base */
.text-responsive-base /* text-base md:text-lg */
.text-responsive-lg   /* text-lg md:text-xl lg:text-2xl */
.text-responsive-xl   /* text-xl md:text-2xl lg:text-3xl */
.text-responsive-2xl  /* text-2xl md:text-3xl lg:text-4xl */
```

#### 5. **Page Header Component**

```tsx
<PageHeader 
  title="Dashboard"
  description="Overview of your finances"
  actions={<Button>Add Transaction</Button>}
/>
```

- Stacks vertically on mobile
- Horizontal layout on desktop
- Flexible action buttons

#### 6. **Responsive Grid Component**

```tsx
<ResponsiveCardGrid minCardWidth="280px">
  <Card>...</Card>
  <Card>...</Card>
</ResponsiveCardGrid>
```

- Auto-fit grid layout
- Minimum card width with 100% max
- Configurable gap spacing

### Mobile Optimizations

#### Touch Targets

- All interactive elements minimum 44x44px
- Increased padding for better tapping
- Larger icon sizes (20-24px)

#### Performance

- Smooth scrolling enabled
- Hardware-accelerated transitions
- Optimized animations (transform/opacity only)
- Reduced motion support

#### Viewport

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

- Allows user scaling up to 5x
- Prevents layout shift
- Proper mobile scaling

#### Safe Areas

iOS notch/home indicator support:

```css
.safe-top    /* padding-top: env(safe-area-inset-top) */
.safe-bottom /* padding-bottom: env(safe-area-inset-bottom) */
```

#### PWA Features

- Installable on mobile devices
- Adaptive theme-color meta tags
- Apple-specific optimizations
- Full-screen capable

## 🎯 Accessibility

### Keyboard Navigation

- All interactive elements keyboard accessible
- Focus indicators visible
- Tab order logical

### Screen Readers

- Semantic HTML
- ARIA labels where needed
- SR-only text for icons

### Contrast

- WCAG AA compliant colors
- High contrast in dark mode
- Clear visual hierarchy

## 🔧 Custom Utilities

### Scrollbar Styles

```css
.scrollbar-hide       /* Hide scrollbar completely */
.custom-scrollbar     /* Styled scrollbar with hover effects */
```

### Card Mobile

```css
.card-mobile          /* p-4 md:p-6 - Responsive padding */
```

### Chart Responsiveness

```css
.recharts-responsive-container {
  min-h-[200px] md:min-h-[300px] lg:min-h-[350px]
}
```

## 📐 Layout Structure

### Main Layout

```tsx
<div className="flex min-h-screen">
  <Sidebar />
  <main className="flex-1 md:ml-64 w-full">
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
      {/* Page content */}
    </div>
  </main>
</div>
```

### Spacing System

- **Mobile**: p-4 (16px)
- **Tablet**: md:p-6 (24px)
- **Desktop**: lg:p-8 (32px)

### Container Widths

- **Mobile**: 100% with padding
- **Desktop**: max-w-7xl centered

## 🚀 Performance

### Transitions

- 200ms cubic-bezier timing
- Only animate transform/opacity
- Hardware acceleration enabled
- Reduced motion support

### Load Performance

- Prevent transition flash on load
- Lazy load heavy components
- Optimized CSS custom properties

## 🧪 Testing

### Test Checklist

#### Mobile

- [ ] Sidebar opens/closes smoothly
- [ ] All buttons are tappable
- [ ] Forms are easy to fill
- [ ] Charts are readable
- [ ] Text is legible
- [ ] No horizontal overflow

#### Dark Mode

- [ ] All text is readable
- [ ] Proper contrast ratios
- [ ] No white flashes on load
- [ ] System preference detection works
- [ ] Theme persists on reload

#### Responsive

- [ ] Test at 375px (mobile)
- [ ] Test at 768px (tablet)
- [ ] Test at 1024px (desktop)
- [ ] Test at 1440px+ (large)
- [ ] Test landscape orientation

## 📚 Resources

### Components

- `src/lib/providers/theme-provider.tsx` - Theme context
- `src/components/theme-toggle.tsx` - Theme switcher
- `src/components/page-header.tsx` - Responsive page header
- `src/components/responsive-grid.tsx` - Grid layouts
- `src/components/sidebar.tsx` - Mobile-responsive navigation

### Styles

- `src/index.css` - Global styles and utilities
- CSS custom properties for theme colors
- Tailwind responsive classes

### Hooks

- `useTheme()` - Access theme state and setter
- Available anywhere within ThemeProvider

---

Built with accessibility and user experience in mind! 🎉
