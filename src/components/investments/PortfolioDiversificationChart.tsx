import { useInvestmentBreakdown } from '@/lib/hooks/use-investment-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

export function PortfolioDiversificationChart() {
    const { data: breakdown, isLoading } = useInvestmentBreakdown();

    const chartData = useMemo(() => {
        if (!breakdown) return [];
        return breakdown.map((item) => ({
            type: item.investment_type,
            value: item.total_current_value,
            percentage: item.percentage_of_portfolio,
            count: item.count,
        }));
    }, [breakdown]);

    const totalValue = useMemo(() => {
        return chartData.reduce((sum, item) => sum + item.value, 0);
    }, [chartData]);

    // Calculate SVG pie chart segments
    const pieSegments = useMemo(() => {
        let cumulativePercentage = 0;
        const colors = [
            'hsl(var(--chart-1))',
            'hsl(var(--chart-2))',
            'hsl(var(--chart-3))',
            'hsl(var(--chart-4))',
            'hsl(var(--chart-5))',
            'hsl(142, 71%, 45%)', // green
            'hsl(262, 83%, 58%)', // purple
            'hsl(346, 77%, 50%)', // red
            'hsl(220, 90%, 56%)', // blue
            'hsl(38, 92%, 50%)',  // orange
        ];

        return chartData.map((item, index) => {
            const percentage = item.percentage;
            const startAngle = (cumulativePercentage * 360) / 100;
            const endAngle = ((cumulativePercentage + percentage) * 360) / 100;
            cumulativePercentage += percentage;

            // Calculate pie slice path
            const startRad = (startAngle - 90) * (Math.PI / 180);
            const endRad = (endAngle - 90) * (Math.PI / 180);
            const largeArc = percentage > 50 ? 1 : 0;

            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);

            const path = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
                `Z`,
            ].join(' ');

            return {
                path,
                color: colors[index % colors.length],
                type: item.type,
                percentage: item.percentage,
                value: item.value,
                count: item.count,
            };
        });
    }, [chartData]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Portfolio Diversification</CardTitle>
                    <CardDescription>Investment allocation by type</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!chartData.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Portfolio Diversification</CardTitle>
                    <CardDescription>Investment allocation by type</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No investments to display</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Portfolio Diversification</CardTitle>
                <CardDescription>Investment allocation by type</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Pie Chart */}
                    <div className="flex-shrink-0 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-[200px] h-[200px]">
                            {pieSegments.map((segment, index) => (
                                <g key={index}>
                                    <path
                                        d={segment.path}
                                        fill={segment.color}
                                        stroke="hsl(var(--background))"
                                        strokeWidth="0.5"
                                        className="transition-opacity hover:opacity-80 cursor-pointer"
                                    />
                                </g>
                            ))}
                        </svg>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-3">
                        {pieSegments.map((segment, index) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div
                                        className="w-3 h-3 rounded-sm flex-shrink-0"
                                        style={{ backgroundColor: segment.color }}
                                    />
                                    <span className="text-sm font-medium capitalize truncate">
                                        {segment.type.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-sm text-muted-foreground">
                                        {segment.count} {segment.count === 1 ? 'item' : 'items'}
                                    </span>
                                    <span className="text-sm font-medium min-w-[4rem] text-right">
                                        {segment.percentage.toFixed(1)}%
                                    </span>
                                    <span className="text-sm text-muted-foreground min-w-[6rem] text-right">
                                        ${segment.value.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div className="pt-3 border-t">
                            <div className="flex items-center justify-between font-semibold">
                                <span className="text-sm">Total Portfolio Value</span>
                                <span className="text-base">${totalValue.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
