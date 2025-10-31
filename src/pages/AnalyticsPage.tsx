import { PortfolioDiversificationChart, ROITracker } from '@/components/investments';
import { DepreciationCalculator } from '@/components/assets';
import { NetWorthCalculator } from '@/components/analytics';
import { PageHeader } from '@/components/page-header';

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Financial Analytics"
                description="Comprehensive analysis of your investments, assets, and net worth"
            />

            {/* Net Worth Section */}
            <div className="grid gap-6">
                <NetWorthCalculator />
            </div>

            {/* Investment Analytics */}
            <div className="grid gap-6 lg:grid-cols-2">
                <PortfolioDiversificationChart />
                <ROITracker />
            </div>

            {/* Asset Analytics */}
            <div className="grid gap-6">
                <DepreciationCalculator />
            </div>
        </div>
    );
}
