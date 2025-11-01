# Security & Privacy - User Guide

## 🔒 Overview

Budget Manager provides comprehensive security and privacy features to protect your financial data. This guide will help you understand and configure all available security options.

---

## ✨ Features

### 1. **PIN Protection**
- Set a 4-6 digit PIN to lock your app
- Required to access the app or after inactivity
- Auto-lock on minimize/switch
- Failed attempt protection (locks for 15 minutes after 5 failed attempts)

### 2. **Biometric Authentication**
- Use fingerprint or face recognition to unlock
- Faster and more secure than PIN
- Works with your device's built-in biometric sensors
- Requires device with biometric hardware

### 3. **Auto-Logout**
- Automatically signs you out after inactivity
- Configurable timeout (5 minutes to 2 hours)
- Protects against unauthorized access
- Tracks user activity automatically

### 4. **Data Masking**
- Hides sensitive information in the app
- Masks account numbers (shows only last 4 digits)
- Masks card numbers (shows as **** **** **** 1234)
- Optional amount masking (shows as $***)

### 5. **Cloud Backup**
- Encrypted backups to Supabase Storage
- Multi-device sync support
- Manual and automatic backup options
- Configurable backup frequency

### 6. **Security Audit Log**
- Tracks all security events
- Monitor login attempts
- View PIN/biometric usage
- Review data export/import activities

---

## 📖 How to Use

### Setting Up PIN Protection

1. **Navigate to Security Settings**
   - Go to Settings → Security & Privacy
   - Or use the direct link in the sidebar

2. **Enable PIN**
   - Toggle "Enable PIN Protection"
   - Enter your desired 4-6 digit PIN
   - Confirm your PIN
   - PIN is immediately active

3. **Configure PIN Options**
   - **Require PIN on Launch**: Ask for PIN every time app opens
   - **Lock on Minimize**: Lock when switching away from app
   - **Change PIN**: Update your PIN anytime

4. **Forgot PIN?**
   - Use your regular email/password to sign in
   - Reset PIN from security settings

---

### Setting Up Biometric Authentication

1. **Check Availability**
   - Biometric option only appears if your device supports it
   - Works with fingerprint sensors and Face ID

2. **Enroll Biometric**
   - Toggle "Enable Biometric"
   - Follow your device's biometric enrollment prompt
   - Grant necessary permissions

3. **Configure Options**
   - **Require on Launch**: Prompt for biometric on app start
   - Works alongside PIN (either can unlock)

4. **Troubleshooting**
   - If biometric fails, you can always use PIN
   - Re-enroll if biometric stops working
   - Check device biometric settings

---

### Configuring Auto-Logout

1. **Enable Auto-Logout**
   - Toggle "Enable Auto-Logout"
   - Select inactivity timeout period

2. **Timeout Options**
   - 5 minutes (high security)
   - 10 minutes (recommended)
   - 15 minutes (balanced)
   - 30 minutes (low security)
   - 1-2 hours (minimal security)

3. **Activity Detection**
   - Tracks: mouse clicks, keyboard input, scrolling, touch
   - Updates activity automatically
   - Shows warning before logout

---

### Setting Up Data Masking

1. **Enable Data Masking**
   - Toggle "Enable Data Masking" master switch

2. **Configure Specific Masks**
   - **Account Numbers**: Shows ****1234
   - **Card Numbers**: Shows **** **** **** 1234
   - **Amounts**: Shows $*** (optional)

3. **When to Use**
   - ✅ Sharing screen in meetings
   - ✅ Taking screenshots
   - ✅ Public WiFi/shared computers
   - ✅ When others can see your screen

4. **Toggle Quickly**
   - Master switch turns all masking on/off
   - Individual switches for granular control

---

### Understanding Security Score

Your security score is calculated based on enabled features:

| Feature | Points | Total |
|---------|--------|-------|
| PIN Protection | 30 | 30% |
| Biometric Auth | 30 | 30% |
| Auto-Logout | 20 | 20% |
| Data Masking | 10 | 10% |
| Require Auth on Launch | 10 | 10% |
| **Maximum Score** | - | **100%** |

**Recommendations:**
- 🟢 90-100%: Excellent security
- 🟡 70-89%: Good security
- 🟠 50-69%: Basic security
- 🔴 0-49%: Weak security (improve!)

---

## 🛡️ Security Best Practices

### PIN Security
- ✅ Use a unique PIN (not your ATM PIN)
- ✅ Don't share your PIN with anyone
- ✅ Change PIN regularly (every 3-6 months)
- ✅ Don't use obvious numbers (1234, 0000)
- ❌ Don't write PIN down
- ❌ Don't use birthdays/anniversaries

### Biometric Security
- ✅ Keep biometric sensors clean
- ✅ Re-enroll if recognition degrades
- ✅ Use alongside PIN for backup
- ❌ Don't share device with biometric enrolled

### General Security
- ✅ Enable all security features
- ✅ Use strong password for account
- ✅ Enable two-factor authentication (2FA)
- ✅ Keep app updated
- ✅ Review security logs regularly
- ✅ Use private WiFi when possible
- ✅ Enable data masking in public
- ✅ Lock device when not in use
- ❌ Don't use on shared/public devices
- ❌ Don't save passwords in browsers

---

## 🔍 Security Audit Log

### What's Tracked
- Login successes/failures
- PIN creation/changes/failures
- Biometric enrollment/removal/failures
- Auto-logout events
- Data export/import
- Settings changes
- Password changes

### Reading the Log
- **Green checkmark**: Successful event (normal)
- **Red X**: Failed event (review carefully)
- **Risk levels**:
  - 🟢 Low: Normal operations
  - 🟡 Medium: Failed attempts (1-2)
  - 🟠 High: Multiple failures, locks
  - 🔴 Critical: Suspicious activity

### When to Check
- ✅ Weekly security review
- ✅ After receiving security alerts
- ✅ If suspicious activity suspected
- ✅ Before important transactions

---

## 🆘 Troubleshooting

### PIN Issues

**Problem: Forgot PIN**
- Solution: Sign out and sign in with email/password, then reset PIN

**Problem: PIN Locked**
- Solution: Wait 15 minutes, then try again
- Alternative: Sign out and sign in with password

**Problem: Can't Set PIN**
- Solution: Check browser permissions
- Try clearing cache and cookies

### Biometric Issues

**Problem: Biometric Not Available**
- Check device has biometric hardware
- Enable biometric in device settings
- Grant browser permissions

**Problem: Biometric Not Working**
- Re-enroll biometric in security settings
- Check device biometric sensor is clean
- Update device OS

**Problem: Biometric Always Fails**
- Use PIN as backup
- Remove and re-enroll biometric
- Check device biometric works in other apps

### Auto-Logout Issues

**Problem: Logged Out Too Quickly**
- Increase timeout period in settings
- Check for system time changes
- Ensure activity is being detected

**Problem: Not Logging Out**
- Check auto-logout is enabled
- Verify timeout period is set
- Try closing and reopening app

### Data Masking Issues

**Problem: Data Still Visible**
- Ensure master switch is enabled
- Check individual mask settings
- Refresh page after enabling

**Problem: Can't See Important Data**
- Temporarily disable masking
- Toggle individual mask types
- Use per-screen visibility toggle (if available)

---

## 📱 Multi-Device Sync

### How It Works
- Security settings sync across devices
- PIN/biometric are device-specific
- Backup settings are shared
- Activity logs are per-device

### Setting Up Sync
1. Enable cloud backup
2. Sign in on other device
3. Settings automatically sync
4. Set up PIN/biometric on each device

### Managing Devices
- View logged-in devices in security log
- Each device has unique session
- Sign out remotely not yet available (future feature)

---

## 🔐 Data Privacy

### What's Encrypted
- ✅ PIN (hashed with salt)
- ✅ Passwords (handled by Supabase Auth)
- ✅ Backup files (optional encryption)
- ✅ Data in transit (HTTPS)
- ✅ Data at rest (Supabase encryption)

### What's Not Encrypted
- ❌ Display-only data (masked instead)
- ❌ Analytics (anonymous)
- ❌ Public information

### Data Collection
We collect **minimal** data:
- ✅ Security events (for audit log)
- ✅ Usage patterns (anonymous)
- ❌ No third-party tracking
- ❌ No data selling
- ❌ No advertising

### Your Rights
- ✅ Export all your data
- ✅ Delete your account
- ✅ Control privacy settings
- ✅ Review security logs

---

## 💡 Tips & Recommendations

### Maximum Security Setup
1. ✅ Enable PIN protection
2. ✅ Enable biometric authentication
3. ✅ Enable auto-logout (15 minutes)
4. ✅ Enable all data masking
5. ✅ Require auth on launch
6. ✅ Enable lock on minimize
7. ✅ Use strong account password
8. ✅ Enable 2FA on account
9. ✅ Review security log weekly
10. ✅ Keep app updated

### Balanced Security Setup
1. ✅ Enable PIN protection
2. ✅ Enable auto-logout (30 minutes)
3. ✅ Enable account/card masking
4. ✅ Require PIN on launch
5. ✅ Use strong password

### Basic Security Setup
1. ✅ Enable PIN protection
2. ✅ Enable auto-logout (1 hour)
3. ✅ Use strong password

### For Shared Devices
- ⚠️ Not recommended!
- If necessary:
  - Enable all security features
  - Use private/incognito mode
  - Always sign out when done
  - Enable aggressive auto-logout (5 min)
  - Enable all data masking

---

## 📞 Support

Need help with security features?

1. **Check Documentation**
   - Read this guide thoroughly
   - Check troubleshooting section

2. **Review Logs**
   - Check security audit log
   - Look for error messages

3. **Community Support**
   - GitHub Issues
   - Discord Community (if available)

4. **Security Issues**
   - Report via GitHub Security tab
   - Email: security@example.com
   - Never share security details publicly

---

## 🚀 Future Features

Coming soon:
- [ ] SMS/Email alerts for security events
- [ ] Device management (view/remove devices)
- [ ] Security questions
- [ ] IP whitelist
- [ ] Advanced encryption options
- [ ] Hardware security key support
- [ ] Remote device wipe

---

## ✅ Security Checklist

Use this checklist to ensure optimal security:

**Initial Setup:**
- [ ] Set strong account password
- [ ] Enable PIN protection
- [ ] Set up biometric (if available)
- [ ] Configure auto-logout
- [ ] Enable data masking
- [ ] Review security settings

**Regular Maintenance:**
- [ ] Review security log weekly
- [ ] Change PIN every 3-6 months
- [ ] Update app regularly
- [ ] Check security score monthly
- [ ] Review active sessions
- [ ] Backup data regularly

**Before Sharing Screen:**
- [ ] Enable data masking
- [ ] Close sensitive tabs
- [ ] Clear recent history

**On Public WiFi:**
- [ ] Enable all data masking
- [ ] Reduce auto-logout time
- [ ] Avoid sensitive transactions

**When Traveling:**
- [ ] Backup data before trip
- [ ] Enable all security features
- [ ] Review security log daily
- [ ] Use VPN if possible

---

*Last Updated: November 2025*
*Version: 1.0.0*
