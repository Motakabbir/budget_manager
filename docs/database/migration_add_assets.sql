-- Migration: Add Assets Table
-- Description: Creates table for tracking fixed assets (property, vehicles, jewelry, electronics, etc.)
-- Author: Development Team
-- Date: October 31, 2025

-- =====================================================
-- 1. CREATE ASSETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Asset Details
    asset_type TEXT NOT NULL CHECK (
        asset_type IN (
            'property', 
            'vehicle', 
            'jewelry', 
            'electronics',
            'furniture',
            'collectibles',
            'equipment',
            'other'
        )
    ),
    name TEXT NOT NULL,
    brand TEXT, -- Manufacturer or brand name
    model TEXT, -- Model number or identifier
    
    -- Financial Details
    purchase_price DECIMAL(15, 2) NOT NULL CHECK (purchase_price >= 0),
    purchase_date DATE NOT NULL,
    current_value DECIMAL(15, 2) NOT NULL CHECK (current_value >= 0),
    
    -- Depreciation
    depreciation_rate DECIMAL(5, 2) CHECK (depreciation_rate >= 0 AND depreciation_rate <= 100), -- Annual depreciation rate (%)
    salvage_value DECIMAL(15, 2), -- Estimated value at end of useful life
    useful_life_years INTEGER, -- Expected useful life in years
    
    -- Insurance & Documentation
    is_insured BOOLEAN DEFAULT false,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    insurance_expiry_date DATE,
    insurance_premium DECIMAL(10, 2),
    
    -- Physical Details
    serial_number TEXT,
    purchase_location TEXT,
    warranty_expiry_date DATE,
    
    -- Property Specific (if asset_type = 'property')
    property_address TEXT,
    property_size_sqft DECIMAL(10, 2),
    property_type TEXT, -- house, apartment, land, commercial
    
    -- Vehicle Specific (if asset_type = 'vehicle')
    vehicle_make TEXT,
    vehicle_year INTEGER,
    vehicle_vin TEXT,
    vehicle_mileage INTEGER,
    vehicle_license_plate TEXT,
    
    -- Additional Info
    condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    location TEXT, -- Where the asset is stored/located
    notes TEXT,
    is_active BOOLEAN DEFAULT true, -- False if sold/disposed
    
    -- Sale Information (if sold)
    sale_date DATE,
    sale_price DECIMAL(15, 2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Index for user lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_assets_user_id 
ON assets(user_id);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_assets_type 
ON assets(asset_type);

-- Index for active assets
CREATE INDEX IF NOT EXISTS idx_assets_active 
ON assets(user_id, is_active) 
WHERE is_active = true;

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_assets_purchase_date 
ON assets(purchase_date DESC);

-- Composite index for user + type queries
CREATE INDEX IF NOT EXISTS idx_assets_user_type 
ON assets(user_id, asset_type);

-- Index for insurance tracking
CREATE INDEX IF NOT EXISTS idx_assets_insured 
ON assets(user_id, is_insured) 
WHERE is_insured = true;

-- Index for warranty expiry
CREATE INDEX IF NOT EXISTS idx_assets_warranty_expiry 
ON assets(warranty_expiry_date) 
WHERE warranty_expiry_date IS NOT NULL;

-- =====================================================
-- 3. CREATE COMPUTED COLUMNS VIEW
-- =====================================================

-- Create a view with calculated depreciation and value changes
CREATE OR REPLACE VIEW assets_with_stats AS
SELECT 
    a.*,
    -- Depreciation calculations
    (a.purchase_price - a.current_value) AS total_depreciation,
    CASE 
        WHEN a.purchase_price > 0 
        THEN (((a.purchase_price - a.current_value) / a.purchase_price) * 100)
        ELSE 0
    END AS depreciation_percentage,
    
    -- Age calculations
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.purchase_date))::INTEGER AS age_years,
    EXTRACT(MONTH FROM AGE(CURRENT_DATE, a.purchase_date))::INTEGER AS age_months,
    
    -- Estimated annual depreciation
    CASE 
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.purchase_date)) > 0 
        THEN ((a.purchase_price - a.current_value) / EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.purchase_date)))
        ELSE 0
    END AS avg_annual_depreciation,
    
    -- Sale profit/loss (if sold)
    CASE 
        WHEN a.sale_price IS NOT NULL AND a.is_active = false
        THEN (a.sale_price - a.current_value)
        ELSE NULL
    END AS sale_profit_loss,
    
    -- Insurance status
    CASE 
        WHEN a.is_insured = true AND a.insurance_expiry_date < CURRENT_DATE 
        THEN 'expired'
        WHEN a.is_insured = true AND a.insurance_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
        THEN 'expiring_soon'
        WHEN a.is_insured = true 
        THEN 'active'
        ELSE 'not_insured'
    END AS insurance_status,
    
    -- Warranty status
    CASE 
        WHEN a.warranty_expiry_date IS NULL 
        THEN 'no_warranty'
        WHEN a.warranty_expiry_date < CURRENT_DATE 
        THEN 'expired'
        WHEN a.warranty_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
        THEN 'expiring_soon'
        ELSE 'active'
    END AS warranty_status
    
FROM assets a;

-- =====================================================
-- 4. CREATE FUNCTION FOR AUTOMATIC UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CREATE TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS assets_updated_at_trigger ON assets;

CREATE TRIGGER assets_updated_at_trigger
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_assets_updated_at();

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================

-- Policy: Users can view their own assets
DROP POLICY IF EXISTS "Users can view their own assets" ON assets;
CREATE POLICY "Users can view their own assets"
    ON assets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own assets
DROP POLICY IF EXISTS "Users can insert their own assets" ON assets;
CREATE POLICY "Users can insert their own assets"
    ON assets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own assets
DROP POLICY IF EXISTS "Users can update their own assets" ON assets;
CREATE POLICY "Users can update their own assets"
    ON assets
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own assets
DROP POLICY IF EXISTS "Users can delete their own assets" ON assets;
CREATE POLICY "Users can delete their own assets"
    ON assets
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 8. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function: Get assets summary for a user
CREATE OR REPLACE FUNCTION get_assets_summary(p_user_id UUID)
RETURNS TABLE (
    total_assets BIGINT,
    total_purchase_price DECIMAL(15, 2),
    total_current_value DECIMAL(15, 2),
    total_depreciation DECIMAL(15, 2),
    total_insured_value DECIMAL(15, 2),
    assets_insured_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        SUM(purchase_price)::DECIMAL(15, 2),
        SUM(current_value)::DECIMAL(15, 2),
        SUM(purchase_price - current_value)::DECIMAL(15, 2),
        SUM(CASE WHEN is_insured = true THEN current_value ELSE 0 END)::DECIMAL(15, 2),
        COUNT(CASE WHEN is_insured = true THEN 1 END)::BIGINT
    FROM assets
    WHERE user_id = p_user_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get asset type breakdown
CREATE OR REPLACE FUNCTION get_asset_breakdown(p_user_id UUID)
RETURNS TABLE (
    asset_type TEXT,
    count BIGINT,
    total_purchase_price DECIMAL(15, 2),
    total_current_value DECIMAL(15, 2),
    total_depreciation DECIMAL(15, 2),
    percentage_of_total DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH assets_total AS (
        SELECT SUM(current_value) AS total_value
        FROM assets
        WHERE user_id = p_user_id AND is_active = true
    )
    SELECT 
        a.asset_type,
        COUNT(*)::BIGINT,
        SUM(a.purchase_price)::DECIMAL(15, 2),
        SUM(a.current_value)::DECIMAL(15, 2),
        SUM(a.purchase_price - a.current_value)::DECIMAL(15, 2),
        CASE 
            WHEN at.total_value > 0 
            THEN ((SUM(a.current_value) / at.total_value) * 100)::DECIMAL(5, 2)
            ELSE 0
        END
    FROM assets a
    CROSS JOIN assets_total at
    WHERE a.user_id = p_user_id AND a.is_active = true
    GROUP BY a.asset_type, at.total_value
    ORDER BY SUM(a.current_value) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate depreciation for an asset
CREATE OR REPLACE FUNCTION calculate_asset_depreciation(
    p_asset_id UUID
)
RETURNS TABLE (
    current_book_value DECIMAL(15, 2),
    accumulated_depreciation DECIMAL(15, 2),
    remaining_useful_life_years DECIMAL(5, 2)
) AS $$
DECLARE
    v_purchase_price DECIMAL(15, 2);
    v_purchase_date DATE;
    v_depreciation_rate DECIMAL(5, 2);
    v_salvage_value DECIMAL(15, 2);
    v_useful_life_years INTEGER;
    v_years_elapsed DECIMAL(5, 2);
BEGIN
    -- Get asset details
    SELECT 
        purchase_price, 
        purchase_date, 
        depreciation_rate,
        COALESCE(salvage_value, 0),
        useful_life_years
    INTO 
        v_purchase_price, 
        v_purchase_date, 
        v_depreciation_rate,
        v_salvage_value,
        v_useful_life_years
    FROM assets
    WHERE id = p_asset_id;
    
    -- Calculate years elapsed
    v_years_elapsed := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_purchase_date)) + 
                       (EXTRACT(MONTH FROM AGE(CURRENT_DATE, v_purchase_date)) / 12.0);
    
    -- Calculate using straight-line depreciation if depreciation_rate is provided
    IF v_depreciation_rate IS NOT NULL AND v_depreciation_rate > 0 THEN
        RETURN QUERY
        SELECT 
            GREATEST(
                v_purchase_price - ((v_purchase_price - v_salvage_value) * (v_depreciation_rate / 100.0) * v_years_elapsed),
                v_salvage_value
            )::DECIMAL(15, 2) AS current_book_value,
            LEAST(
                (v_purchase_price - v_salvage_value) * (v_depreciation_rate / 100.0) * v_years_elapsed,
                v_purchase_price - v_salvage_value
            )::DECIMAL(15, 2) AS accumulated_depreciation,
            CASE 
                WHEN v_useful_life_years IS NOT NULL 
                THEN GREATEST(v_useful_life_years - v_years_elapsed, 0)
                ELSE NULL
            END::DECIMAL(5, 2) AS remaining_useful_life_years;
    ELSE
        -- Return current values from database if no depreciation rate
        RETURN QUERY
        SELECT 
            current_value,
            (v_purchase_price - current_value)::DECIMAL(15, 2),
            CASE 
                WHEN v_useful_life_years IS NOT NULL 
                THEN GREATEST(v_useful_life_years - v_years_elapsed, 0)
                ELSE NULL
            END::DECIMAL(5, 2)
        FROM assets
        WHERE id = p_asset_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get expiring insurance/warranties
CREATE OR REPLACE FUNCTION get_expiring_coverage(
    p_user_id UUID,
    p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
    asset_id UUID,
    asset_name TEXT,
    asset_type TEXT,
    coverage_type TEXT, -- 'insurance' or 'warranty'
    expiry_date DATE,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    -- Insurance expiring
    SELECT 
        id,
        name,
        asset_type,
        'insurance'::TEXT,
        insurance_expiry_date,
        (insurance_expiry_date - CURRENT_DATE)::INTEGER
    FROM assets
    WHERE user_id = p_user_id 
        AND is_active = true
        AND is_insured = true
        AND insurance_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
    
    UNION ALL
    
    -- Warranty expiring
    SELECT 
        id,
        name,
        asset_type,
        'warranty'::TEXT,
        warranty_expiry_date,
        (warranty_expiry_date - CURRENT_DATE)::INTEGER
    FROM assets
    WHERE user_id = p_user_id 
        AND is_active = true
        AND warranty_expiry_date IS NOT NULL
        AND warranty_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
    
    ORDER BY expiry_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. COMMENTS
-- =====================================================

COMMENT ON TABLE assets IS 'Stores user fixed assets including property, vehicles, jewelry, electronics, etc.';
COMMENT ON COLUMN assets.asset_type IS 'Type of asset: property, vehicle, jewelry, electronics, furniture, collectibles, equipment, other';
COMMENT ON COLUMN assets.depreciation_rate IS 'Annual depreciation rate as percentage (e.g., 15 for 15% per year)';
COMMENT ON COLUMN assets.salvage_value IS 'Estimated value at end of useful life';
COMMENT ON COLUMN assets.useful_life_years IS 'Expected useful life in years';
COMMENT ON COLUMN assets.is_active IS 'False if asset has been sold or disposed';
COMMENT ON COLUMN assets.condition IS 'Current condition: excellent, good, fair, poor';

-- =====================================================
-- 10. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO assets (
    user_id, asset_type, name, brand, model,
    purchase_price, purchase_date, current_value,
    depreciation_rate, condition, is_insured, notes
) VALUES 
    (auth.uid(), 'vehicle', 'Toyota Camry 2020', 'Toyota', 'Camry', 25000.00, '2020-01-15', 18000.00, 15, 'good', true, 'Family car'),
    (auth.uid(), 'electronics', 'MacBook Pro 16"', 'Apple', 'MacBook Pro 16" M1', 2500.00, '2023-06-01', 1800.00, 20, 'excellent', true, 'Work laptop'),
    (auth.uid(), 'property', 'Downtown Apartment', NULL, NULL, 300000.00, '2019-03-10', 350000.00, 0, 'excellent', true, 'Investment property'),
    (auth.uid(), 'jewelry', 'Gold Necklace', NULL, NULL, 1500.00, '2022-12-25', 1600.00, 0, 'excellent', true, 'Anniversary gift');
*/

-- =====================================================
-- ROLLBACK COMMANDS (for reverting migration)
-- =====================================================

/*
-- To rollback this migration, run:

DROP FUNCTION IF EXISTS get_expiring_coverage(UUID, INTEGER);
DROP FUNCTION IF EXISTS calculate_asset_depreciation(UUID);
DROP FUNCTION IF EXISTS get_asset_breakdown(UUID);
DROP FUNCTION IF EXISTS get_assets_summary(UUID);
DROP FUNCTION IF EXISTS update_assets_updated_at() CASCADE;
DROP VIEW IF EXISTS assets_with_stats;
DROP TABLE IF EXISTS assets CASCADE;
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================
