import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions, useUserSettings } from '@/lib/hooks/use-budget-queries';
import { FinancialForecastingService } from '@/lib/services/financial-forecasting.service';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export function ForecastWidget() {
    const { data: transactions = [] } = useTransactions();
    const { data: userSettings } = useUserSettings();

    const currentBalance = userSettings?.opening_balance || 10000;

    const projection = FinancialForecastingService.generateCashFlowProjection(
        transactions,
        currentBalance,
        6
    );

    // Prepare mini chart data
    const chartData = projection.projections.slice(0, 6).map(p => ({
        balance: p.balance
    }));

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">6-Month Forecast</CardTitle>
                {projection.trend === 'improving' && (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                )}
                {projection.trend === 'declining' && (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                {projection.trend === 'stable' && (
                    <Activity className="h-4 w-4 text-blue-600" />
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div>
                        <div className="text-2xl font-bold">
                            ${projection.projectedBalance.toFixed(0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Projected balance in 6 months
                        </p>
                    </div>

                    {/* Mini trend chart */}
                    <ResponsiveContainer width="100%" height={60}>
                        <LineChart data={chartData}>
                            <Line
                                type="monotone"
                                dataKey="balance"
                                stroke={projection.trend === 'improving' ? '#10b981' : projection.trend === 'declining' ? '#ef4444' : '#3b82f6'}
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <p className="text-muted-foreground">Avg Cash Flow</p>
                            <p className={`font-semibold ${projection.averageNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {projection.averageNetCashFlow >= 0 ? '+' : ''}${projection.averageNetCashFlow.toFixed(0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Burn Rate</p>
                            <p className="font-semibold">
                                {projection.burnRate === Infinity ? '∞' : `${projection.burnRate.toFixed(1)}m`}
                            </p>
                        </div>
                    </div>

                    {projection.burnRate < 12 && projection.burnRate !== Infinity && (
                        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded p-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                At current rate, funds will deplete in {projection.burnRate.toFixed(1)} months
                            </p>
                        </div>
                    )}
                </div>

                <Link
                    to="/forecasting"
                    className="mt-4 block text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                    Explore what-if scenarios →
                </Link>
            </CardContent>
        </Card>
    );
}
