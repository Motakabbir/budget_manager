-- Migration: Add auto-contribution trigger for income transactions
-- This trigger automatically processes auto-contributions when income is recorded

-- Function to process auto-contributions on income
CREATE OR REPLACE FUNCTION process_auto_contributions_on_income()
RETURNS TRIGGER AS $$
DECLARE
    goal_record RECORD;
    contribution_amount DECIMAL(10,2);
    remaining_amount DECIMAL(10,2);
    contribution_id UUID;
BEGIN
    -- Only process for income transactions
    IF NEW.type != 'income' THEN
        RETURN NEW;
    END IF;

    -- Process auto-contributions for all goals with auto-contribution enabled
    FOR goal_record IN
        SELECT id, user_id, current_amount, target_amount,
               auto_contribution_amount, auto_contribution_frequency
        FROM savings_goals
        WHERE user_id = NEW.user_id
        AND auto_contribution_enabled = true
        AND auto_contribution_amount > 0
        AND current_amount < target_amount
    LOOP
        -- Check if contribution should be made based on frequency
        IF should_make_auto_contribution(goal_record.id, goal_record.auto_contribution_frequency) THEN
            -- Calculate contribution amount (don't exceed target)
            remaining_amount := goal_record.target_amount - goal_record.current_amount;
            contribution_amount := LEAST(goal_record.auto_contribution_amount, remaining_amount);

            -- Create contribution record
            INSERT INTO goal_contributions (
                goal_id,
                amount,
                contribution_date,
                source,
                notes
            ) VALUES (
                goal_record.id,
                contribution_amount,
                CURRENT_DATE,
                'auto',
                'Auto-contribution triggered by income (' || goal_record.auto_contribution_frequency || ')'
            ) RETURNING id INTO contribution_id;

            -- Update goal current amount
            UPDATE savings_goals
            SET current_amount = current_amount + contribution_amount,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = goal_record.id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if auto-contribution should be made
CREATE OR REPLACE FUNCTION should_make_auto_contribution(
    goal_id UUID,
    frequency TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    last_contribution_date DATE;
    days_since_last INTEGER;
BEGIN
    -- Get the most recent auto-contribution for this goal
    SELECT contribution_date INTO last_contribution_date
    FROM goal_contributions
    WHERE goal_id = $1 AND source = 'auto'
    ORDER BY contribution_date DESC
    LIMIT 1;

    -- If no previous contribution, make one
    IF last_contribution_date IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Calculate days since last contribution
    days_since_last := CURRENT_DATE - last_contribution_date;

    -- Check based on frequency
    CASE frequency
        WHEN 'weekly' THEN RETURN days_since_last >= 7;
        WHEN 'bi-weekly' THEN RETURN days_since_last >= 14;
        WHEN 'monthly' THEN RETURN days_since_last >= 30;
        WHEN 'quarterly' THEN RETURN days_since_last >= 90;
        ELSE RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on transactions table
DROP TRIGGER IF EXISTS trigger_auto_contributions_on_income ON transactions;
CREATE TRIGGER trigger_auto_contributions_on_income
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION process_auto_contributions_on_income();

-- Add comment
COMMENT ON FUNCTION process_auto_contributions_on_income() IS 'Automatically processes savings goal contributions when income transactions are recorded';
COMMENT ON FUNCTION should_make_auto_contribution(UUID, TEXT) IS 'Checks if an auto-contribution should be made based on frequency and last contribution date';