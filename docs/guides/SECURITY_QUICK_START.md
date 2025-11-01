# Security & Privacy - Quick Start Guide

Get the security features up and running in your Budget Manager app in 15 minutes!

---

## ⚡ Quick Setup (5 Steps)

### Step 1: Run Database Migration (2 minutes)

```bash
# Navigate to your project
cd /path/to/budget_manager

# Run the security migration in Supabase SQL Editor
# OR via psql command line:
psql $DATABASE_URL -f docs/database/migration_add_security.sql
```

**Verify Success:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public' 
AND table_name IN ('user_security_settings', 'security_audit_log', 'cloud_backup_settings');
```

You should see 3 tables listed.

---

### Step 2: Add Security Route (1 minute)

Update your app router to include the security settings page:

```typescript
// src/App.tsx or your router configuration
import SecuritySettingsPage from '@/pages/SecuritySettingsPage';

// Add this route
{
  path: '/security',
  element: <SecuritySettingsPage />,
}
```

---

### Step 3: Update Navigation (1 minute)

Add security link to your sidebar:

```typescript
// src/components/sidebar.tsx
import { Shield } from 'lucide-react';

// Add to your navigation items
{
  name: 'Security',
  href: '/security',
  icon: Shield,
}
```

---

### Step 4: Enable Auto-Logout (2 minutes)

Add auto-logout monitoring to your main layout:

```typescript
// src/pages/DashboardLayout.tsx
import { useAutoLogout } from '@/lib/hooks/use-security';

export function DashboardLayout() {
  // Enable auto-logout monitoring
  useAutoLogout();
  
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
```

---

### Step 5: Add PIN Lock Screen (2 minutes)

Wrap your app with PIN lock screen functionality:

```typescript
// src/App.tsx
import { useState, useEffect } from 'react';
import { PINLockScreen } from '@/components/security/PINLockScreen';
import { useSecuritySettings } from '@/lib/hooks/use-security';

function App() {
  const [isLocked, setIsLocked] = useState(false);
  const { data: settings } = useSecuritySettings();
  
  useEffect(() => {
    // Check if PIN is required on launch
    if (settings?.require_pin_on_launch && settings.pin_enabled) {
      setIsLocked(true);
    }
    
    // Listen for lock events
    const handleShowLock = () => setIsLocked(true);
    window.addEventListener('show-pin-lock', handleShowLock);
    
    return () => {
      window.removeEventListener('show-pin-lock', handleShowLock);
    };
  }, [settings]);
  
  if (isLocked) {
    return <PINLockScreen onUnlock={() => setIsLocked(false)} />;
  }
  
  return (
    <Router>
      <Routes>
        {/* Your existing routes */}
      </Routes>
    </Router>
  );
}
```

---

## 🎨 Using Data Masking (Optional, 3 minutes)

Apply data masking to your existing components:

```typescript
// Example: Bank Account Card
import { useDataMasking } from '@/lib/hooks/use-security';
import { maskAccountNumber, maskAmount } from '@/lib/utils/data-masking';

function BankAccountCard({ account }) {
  const masking = useDataMasking();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{account.account_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Account: {maskAccountNumber(
            account.account_number, 
            masking.maskAccountNumbers
          )}
        </p>
        <p className="text-2xl font-bold">
          {maskAmount(
            account.balance, 
            masking.maskAmounts
          )}
        </p>
      </CardContent>
    </Card>
  );
}
```

Apply the same pattern to:
- Payment cards (use `maskCardNumber`)
- Loan details
- Investment accounts
- Any sensitive financial data

---

## ✅ Verification (2 minutes)

### Test PIN Protection

1. Navigate to Settings → Security
2. Toggle "Enable PIN Protection"
3. Set a 4-digit PIN (e.g., 1234)
4. Confirm PIN
5. Toggle "Require PIN on Launch"
6. Refresh the page → PIN lock screen should appear
7. Enter correct PIN → App unlocks

### Test Biometric (if available)

1. Check if biometric section appears (device-dependent)
2. Toggle "Enable Biometric"
3. Follow device prompts
4. Try unlocking with biometric on lock screen

### Test Auto-Logout

1. Enable "Auto-Logout"
2. Set timeout to 5 minutes
3. Wait 5+ minutes without activity
4. App should automatically sign out

### Test Data Masking

1. Enable "Data Masking"
2. Toggle "Mask Account Numbers"
3. Navigate to Bank Accounts page
4. Account numbers should show as ****1234

---

## 📁 File Reference

All security files are already created:

### Database
- ✅ `/docs/database/migration_add_security.sql`

### Services
- ✅ `/src/lib/services/security.service.ts`
- ✅ `/src/lib/utils/data-masking.ts`

### Hooks
- ✅ `/src/lib/hooks/use-security.ts`

### Components
- ✅ `/src/components/security/PINLockScreen.tsx`

### Pages
- ✅ `/src/pages/SecuritySettingsPage.tsx`

### Documentation
- ✅ `/docs/guides/SECURITY_USER_GUIDE.md`
- ✅ `/docs/guides/SECURITY_TECHNICAL.md`
- ✅ `/docs/guides/SECURITY_IMPLEMENTATION_SUMMARY.md`

---

## 🐛 Common Issues

### Issue: "Table already exists" error
**Solution**: Migration already run, skip database step

### Issue: PIN lock screen not showing
**Solution**: 
- Check PIN is enabled in settings
- Verify "Require PIN on Launch" is toggled
- Clear browser cache and reload

### Issue: Biometric not available
**Solution**:
- Check device has biometric hardware
- Enable biometric in device settings
- Grant browser permissions

### Issue: Auto-logout not working
**Solution**:
- Verify auto-logout is enabled in settings
- Check timeout value is set
- Ensure `useAutoLogout()` hook is called in main layout

### Issue: Data masking not applied
**Solution**:
- Use the masking functions in components
- Check masking is enabled in settings
- Verify you're using the `useDataMasking()` hook

---

## 🚀 Next Steps

1. **Review Settings**: Go to Security page and configure preferences
2. **Test All Features**: Try PIN, biometric, auto-logout, masking
3. **Read Documentation**: Check user guide for detailed info
4. **Apply Masking**: Update your components to use masking utilities
5. **Monitor Logs**: Review security audit log for events

---

## 📞 Need Help?

- **User Guide**: `/docs/guides/SECURITY_USER_GUIDE.md`
- **Technical Docs**: `/docs/guides/SECURITY_TECHNICAL.md`
- **Full Summary**: `/docs/guides/SECURITY_IMPLEMENTATION_SUMMARY.md`
- **GitHub Issues**: Report bugs or ask questions

---

## 🎉 You're Done!

Security features are now active! Users can:
- ✅ Set up PIN protection
- ✅ Enable biometric authentication
- ✅ Configure auto-logout
- ✅ Enable data masking
- ✅ View security logs
- ✅ Manage all security settings

**Time to Complete**: ~15 minutes  
**Difficulty**: Easy  
**Status**: Ready for Production ✅

---

*Quick Start Guide - Version 1.0.0*  
*Last Updated: November 2025*
