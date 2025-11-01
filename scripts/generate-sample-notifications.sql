-- Sample Notifications Generator
-- Run this in Supabase SQL Editor to create test notifications

-- First, get your user ID
-- SELECT auth.uid();

-- Then replace 'YOUR_USER_ID' below with your actual user ID
-- Or use auth.uid() if running while authenticated

-- =====================================================
-- SAMPLE NOTIFICATIONS FOR TESTING
-- =====================================================

-- Delete existing test notifications (optional)
-- DELETE FROM notifications WHERE type IN ('test', 'budget_exceeded', 'unusual_spending_detected');

-- Insert sample notifications
INSERT INTO notifications (user_id, type, title, message, priority, channel, is_read, created_at) VALUES

-- URGENT PRIORITY NOTIFICATIONS
(auth.uid(), 'low_balance_warning', '💰 Low Balance Alert', 
 'Your Chase Checking account balance is $85. Consider transferring funds to avoid overdraft fees.', 
 'urgent', 'in-app', false, NOW() - INTERVAL '10 minutes'),

(auth.uid(), 'bill_reminder_today', '📅 Bill Due Today', 
 'Your Electric Bill of $125 is due today. Please make payment to avoid late fees.', 
 'urgent', 'in-app', false, NOW() - INTERVAL '30 minutes'),

-- HIGH PRIORITY NOTIFICATIONS
(auth.uid(), 'budget_exceeded', '⚠️ Budget Exceeded', 
 'You have exceeded your Groceries budget by $45. Current spending: $545/$500.', 
 'high', 'in-app', false, NOW() - INTERVAL '1 hour'),

(auth.uid(), 'unusual_spending_detected', '🔍 Unusual Spending Detected', 
 'We detected unusual spending of $350 in Entertainment category. This is 120% higher than your average.', 
 'high', 'in-app', false, NOW() - INTERVAL '2 hours'),

(auth.uid(), 'credit_card_payment_due', '💳 Credit Card Payment Due', 
 'Your Visa Credit Card payment of $850 is due on November 5th.', 
 'high', 'in-app', false, NOW() - INTERVAL '3 hours'),

(auth.uid(), 'loan_emi_reminder', '🏠 Loan EMI Due', 
 'Your Home Loan EMI of $1,200 is due on November 8th.', 
 'high', 'email', false, NOW() - INTERVAL '4 hours'),

-- NORMAL PRIORITY NOTIFICATIONS
(auth.uid(), 'goal_milestone', '🎯 Goal Milestone Achieved', 
 'Congratulations! You''ve reached 75% of your Emergency Fund goal.', 
 'normal', 'in-app', true, NOW() - INTERVAL '5 hours'),

(auth.uid(), 'bill_reminder_3_days', '📅 Bill Reminder', 
 'Your Internet Bill of $79 is due in 3 days on November 4th.', 
 'normal', 'in-app', false, NOW() - INTERVAL '6 hours'),

(auth.uid(), 'subscription_renewal', '🔄 Subscription Renewal', 
 'Your Netflix subscription will renew on November 10th for $15.99.', 
 'normal', 'email', false, NOW() - INTERVAL '7 hours'),

(auth.uid(), 'spending_insight', '📊 Spending Insight', 
 'Your dining out expenses increased 35% this month. Consider meal prepping to save $200/month.', 
 'normal', 'in-app', true, NOW() - INTERVAL '8 hours'),

(auth.uid(), 'goal_deadline', '⏰ Goal Deadline Approaching', 
 'Your Vacation Fund goal deadline is in 30 days. You''re 60% there!', 
 'normal', 'in-app', false, NOW() - INTERVAL '1 day'),

-- LOW PRIORITY NOTIFICATIONS
(auth.uid(), 'weekly_summary', '📈 Weekly Financial Summary', 
 'This week: Income $2,500, Expenses $1,200, Net $1,300. You''re 52% towards your savings goal.', 
 'low', 'in-app', true, NOW() - INTERVAL '1 day'),

(auth.uid(), 'tip', '💡 Financial Tip', 
 'Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. This helps maintain financial balance.', 
 'low', 'in-app', true, NOW() - INTERVAL '2 days'),

(auth.uid(), 'achievement', '🏆 Achievement Unlocked', 
 'Great job! You''ve stayed within your budget for 3 months in a row.', 
 'low', 'in-app', true, NOW() - INTERVAL '3 days'),

(auth.uid(), 'monthly_report', '📊 Monthly Financial Report', 
 'October summary: Total income $10,000, expenses $6,500, savings $3,500. Net worth increased 12%.', 
 'low', 'email', true, NOW() - INTERVAL '7 days');

-- Verify notifications were created
SELECT 
    type,
    title,
    priority,
    channel,
    is_read,
    created_at
FROM notifications
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 20;

-- Check notification counts
SELECT 
    priority,
    COUNT(*) as count,
    SUM(CASE WHEN is_read THEN 0 ELSE 1 END) as unread_count
FROM notifications
WHERE user_id = auth.uid()
GROUP BY priority
ORDER BY 
    CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
    END;

-- Check by type
SELECT 
    type,
    COUNT(*) as count
FROM notifications
WHERE user_id = auth.uid()
GROUP BY type
ORDER BY count DESC;
