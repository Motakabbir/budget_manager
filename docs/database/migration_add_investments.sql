-- Migration: Add Investments Table
-- Description: Creates table for tracking investment portfolio (stocks, bonds, crypto, etc.)
-- Author: Development Team
-- Date: October 31, 2025

-- =====================================================
-- 1. CREATE INVESTMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS investments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Investment Details
    investment_type TEXT NOT NULL CHECK (
        investment_type IN (
            'stock', 
            'mutual_fund', 
            'bond', 
            'crypto', 
            'fixed_deposit', 
            'gold',
            'etf',
            'reit',
            'commodities',
            'other'
        )
    ),
    name TEXT NOT NULL,
    symbol TEXT, -- Stock ticker symbol or identifier (e.g., AAPL, BTC)
    
    -- Quantity & Pricing
    quantity DECIMAL(15, 8) NOT NULL CHECK (quantity > 0),
    purchase_price DECIMAL(15, 2) NOT NULL CHECK (purchase_price >= 0),
    current_price DECIMAL(15, 2) NOT NULL CHECK (current_price >= 0),
    purchase_date DATE NOT NULL,
    
    -- Financial Details
    currency TEXT DEFAULT 'USD' NOT NULL,
    platform TEXT, -- Trading platform or broker (e.g., Robinhood, Coinbase, Vanguard)
    
    -- Dividend/Interest Income
    dividend_yield DECIMAL(5, 2), -- Annual dividend yield percentage
    last_dividend_date DATE,
    total_dividends_received DECIMAL(15, 2) DEFAULT 0,
    
    -- Additional Info
    notes TEXT,
    is_active BOOLEAN DEFAULT true, -- False if sold/closed
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Index for user lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_investments_user_id 
ON investments(user_id);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_investments_type 
ON investments(investment_type);

-- Index for active investments
CREATE INDEX IF NOT EXISTS idx_investments_active 
ON investments(user_id, is_active) 
WHERE is_active = true;

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_investments_purchase_date 
ON investments(purchase_date DESC);

-- Composite index for user + type queries
CREATE INDEX IF NOT EXISTS idx_investments_user_type 
ON investments(user_id, investment_type);

-- =====================================================
-- 3. CREATE COMPUTED COLUMNS VIEW (Optional)
-- =====================================================

-- Create a view with calculated profit/loss fields
CREATE OR REPLACE VIEW investments_with_stats AS
SELECT 
    i.*,
    -- Current value
    (i.quantity * i.current_price) AS current_value,
    -- Total invested
    (i.quantity * i.purchase_price) AS total_invested,
    -- Profit/Loss
    ((i.quantity * i.current_price) - (i.quantity * i.purchase_price)) AS profit_loss,
    -- Profit/Loss Percentage
    (((i.current_price - i.purchase_price) / i.purchase_price) * 100) AS profit_loss_percentage,
    -- ROI (Return on Investment)
    ((((i.quantity * i.current_price) + COALESCE(i.total_dividends_received, 0) - (i.quantity * i.purchase_price)) / (i.quantity * i.purchase_price)) * 100) AS roi_percentage,
    -- Days held
    EXTRACT(DAY FROM (NOW() - i.purchase_date))::INTEGER AS days_held
FROM investments i;

-- =====================================================
-- 4. CREATE FUNCTION FOR AUTOMATIC UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_investments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CREATE TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS investments_updated_at_trigger ON investments;

CREATE TRIGGER investments_updated_at_trigger
    BEFORE UPDATE ON investments
    FOR EACH ROW
    EXECUTE FUNCTION update_investments_updated_at();

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================

-- Policy: Users can view their own investments
DROP POLICY IF EXISTS "Users can view their own investments" ON investments;
CREATE POLICY "Users can view their own investments"
    ON investments
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own investments
DROP POLICY IF EXISTS "Users can insert their own investments" ON investments;
CREATE POLICY "Users can insert their own investments"
    ON investments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own investments
DROP POLICY IF EXISTS "Users can update their own investments" ON investments;
CREATE POLICY "Users can update their own investments"
    ON investments
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own investments
DROP POLICY IF EXISTS "Users can delete their own investments" ON investments;
CREATE POLICY "Users can delete their own investments"
    ON investments
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 8. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function: Get portfolio summary for a user
CREATE OR REPLACE FUNCTION get_portfolio_summary(p_user_id UUID)
RETURNS TABLE (
    total_investments BIGINT,
    total_invested DECIMAL(15, 2),
    total_current_value DECIMAL(15, 2),
    total_profit_loss DECIMAL(15, 2),
    total_profit_loss_percentage DECIMAL(10, 2),
    total_dividends DECIMAL(15, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        SUM(quantity * purchase_price)::DECIMAL(15, 2),
        SUM(quantity * current_price)::DECIMAL(15, 2),
        SUM((quantity * current_price) - (quantity * purchase_price))::DECIMAL(15, 2),
        CASE 
            WHEN SUM(quantity * purchase_price) > 0 
            THEN ((SUM((quantity * current_price) - (quantity * purchase_price)) / SUM(quantity * purchase_price)) * 100)::DECIMAL(10, 2)
            ELSE 0
        END,
        SUM(COALESCE(total_dividends_received, 0))::DECIMAL(15, 2)
    FROM investments
    WHERE user_id = p_user_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get investment type breakdown
CREATE OR REPLACE FUNCTION get_investment_breakdown(p_user_id UUID)
RETURNS TABLE (
    investment_type TEXT,
    count BIGINT,
    total_invested DECIMAL(15, 2),
    total_current_value DECIMAL(15, 2),
    profit_loss DECIMAL(15, 2),
    percentage_of_portfolio DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH portfolio_total AS (
        SELECT SUM(quantity * current_price) AS total_value
        FROM investments
        WHERE user_id = p_user_id AND is_active = true
    )
    SELECT 
        i.investment_type,
        COUNT(*)::BIGINT,
        SUM(i.quantity * i.purchase_price)::DECIMAL(15, 2),
        SUM(i.quantity * i.current_price)::DECIMAL(15, 2),
        SUM((i.quantity * i.current_price) - (i.quantity * i.purchase_price))::DECIMAL(15, 2),
        CASE 
            WHEN pt.total_value > 0 
            THEN ((SUM(i.quantity * i.current_price) / pt.total_value) * 100)::DECIMAL(5, 2)
            ELSE 0
        END
    FROM investments i
    CROSS JOIN portfolio_total pt
    WHERE i.user_id = p_user_id AND i.is_active = true
    GROUP BY i.investment_type, pt.total_value
    ORDER BY SUM(i.quantity * i.current_price) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON TABLE investments IS 'Stores user investment portfolio including stocks, bonds, crypto, and other investment types';
COMMENT ON COLUMN investments.investment_type IS 'Type of investment: stock, mutual_fund, bond, crypto, fixed_deposit, gold, etf, reit, commodities, other';
COMMENT ON COLUMN investments.quantity IS 'Number of units/shares owned (supports up to 8 decimal places for crypto)';
COMMENT ON COLUMN investments.purchase_price IS 'Price per unit at time of purchase';
COMMENT ON COLUMN investments.current_price IS 'Current market price per unit';
COMMENT ON COLUMN investments.dividend_yield IS 'Annual dividend yield percentage (e.g., 2.5 for 2.5%)';
COMMENT ON COLUMN investments.is_active IS 'False if investment has been sold or closed';

-- =====================================================
-- 10. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO investments (
    user_id, investment_type, name, symbol, quantity, 
    purchase_price, current_price, purchase_date, 
    currency, platform, notes
) VALUES 
    (auth.uid(), 'stock', 'Apple Inc.', 'AAPL', 10, 150.00, 175.50, '2024-01-15', 'USD', 'Robinhood', 'Tech stock investment'),
    (auth.uid(), 'crypto', 'Bitcoin', 'BTC', 0.5, 45000.00, 67000.00, '2024-03-20', 'USD', 'Coinbase', 'Long-term crypto hold'),
    (auth.uid(), 'mutual_fund', 'Vanguard 500 Index', 'VFIAX', 25, 400.00, 425.00, '2024-02-10', 'USD', 'Vanguard', 'Retirement fund'),
    (auth.uid(), 'gold', 'Gold ETF', 'GLD', 5, 180.00, 195.00, '2024-04-05', 'USD', 'Fidelity', 'Hedge against inflation');
*/

-- =====================================================
-- ROLLBACK COMMANDS (for reverting migration)
-- =====================================================

/*
-- To rollback this migration, run:

DROP FUNCTION IF EXISTS get_investment_breakdown(UUID);
DROP FUNCTION IF EXISTS get_portfolio_summary(UUID);
DROP FUNCTION IF EXISTS update_investments_updated_at() CASCADE;
DROP VIEW IF EXISTS investments_with_stats;
DROP TABLE IF EXISTS investments CASCADE;
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================
