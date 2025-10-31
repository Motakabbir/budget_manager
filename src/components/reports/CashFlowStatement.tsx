import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, TrendingUp, TrendingDown, DollarSign, ArrowUpDown } from 'lucide-react';
import { useTransactions, type Transaction } from '@/lib/hooks/use-budget-queries';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface CashFlowStatementProps {
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export function CashFlowStatement({ dateRange }: CashFlowStatementProps) {
    const currentMonth = {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    };

    const previousMonth = {
        start: startOfMonth(subMonths(new Date(), 1)),
        end: endOfMonth(subMonths(new Date(), 1))
    };

    const { data: currentTransactions = [] } = useTransactions(
        (dateRange?.start || currentMonth.start).toISOString(),
        (dateRange?.end || currentMonth.end).toISOString()
    );

    const { data: previousTransactions = [] } = useTransactions(
        previousMonth.start.toISOString(),
        previousMonth.end.toISOString()
    );

    // Operating Activities (Income and regular expenses)
    const currentOperatingIncome = currentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const currentOperatingExpenses = currentTransactions
        .filter(t => t.type === 'expense' && !isInvestingOrFinancing(t))
        .reduce((sum, t) => sum + t.amount, 0);

    const currentOperatingCashFlow = currentOperatingIncome - currentOperatingExpenses;

    // Investing Activities (investments, asset purchases)
    const currentInvestingCashFlow = currentTransactions
        .filter(t => t.type === 'expense' && isInvestingActivity(t))
        .reduce((sum, t) => sum - t.amount, 0); // Negative because these are outflows

    // Financing Activities (loans, debt payments)
    const currentFinancingCashFlow = currentTransactions
        .filter(t => isFinancingActivity(t))
        .reduce((sum, t) => {
            // This would need more sophisticated logic based on loan/borrowing transactions
            return sum + (t.type === 'income' ? t.amount : -t.amount);
        }, 0);

    // Net Cash Flow
    const currentNetCashFlow = currentOperatingCashFlow + currentInvestingCashFlow + currentFinancingCashFlow;

    // Previous period calculations
    const previousOperatingIncome = previousTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const previousOperatingExpenses = previousTransactions
        .filter(t => t.type === 'expense' && !isInvestingOrFinancing(t))
        .reduce((sum, t) => sum + t.amount, 0);

    const previousOperatingCashFlow = previousOperatingIncome - previousOperatingExpenses;
    const previousNetCashFlow = previousOperatingCashFlow; // Simplified for now

    // Calculate changes
    const operatingChange = previousOperatingCashFlow !== 0 ? ((currentOperatingCashFlow - previousOperatingCashFlow) / Math.abs(previousOperatingCashFlow)) * 100 : 0;
    const netChange = previousNetCashFlow !== 0 ? ((currentNetCashFlow - previousNetCashFlow) / Math.abs(previousNetCashFlow)) * 100 : 0;

    // Helper functions
    function isInvestingOrFinancing(transaction: Transaction): boolean {
        return isInvestingActivity(transaction) || isFinancingActivity(transaction);
    }

    function isInvestingActivity(transaction: Transaction): boolean {
        // This would check for investment-related categories
        // For now, we'll assume certain categories are investing activities
        const investingCategories = ['investments', 'assets', 'property'];
        return investingCategories.some(cat =>
            transaction.category?.name?.toLowerCase().includes(cat)
        );
    }

    function isFinancingActivity(transaction: Transaction): boolean {
        // This would check for loan/borrowing related transactions
        const financingCategories = ['loans', 'borrowing', 'debt'];
        return financingCategories.some(cat =>
            transaction.category?.name?.toLowerCase().includes(cat)
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Cash Flow Statement
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    For the period: {format(dateRange?.start || currentMonth.start, 'MMM dd, yyyy')} - {format(dateRange?.end || currentMonth.end, 'MMM dd, yyyy')}
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Operating Activities */}
                <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <ArrowUpDown className="h-4 w-4 text-blue-600" />
                        Operating Activities
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm">Cash Inflows (Income)</span>
                            <span className="font-medium text-green-600">+${currentOperatingIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm">Cash Outflows (Expenses)</span>
                            <span className="font-medium text-red-600">-${currentOperatingExpenses.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center py-2 font-semibold">
                            <span>Net Cash from Operating Activities</span>
                            <div className="flex items-center gap-2">
                                <Badge variant={operatingChange >= 0 ? "default" : "destructive"} className="text-xs">
                                    {operatingChange >= 0 ? '+' : ''}{operatingChange.toFixed(1)}%
                                </Badge>
                                <span className={currentOperatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    ${currentOperatingCashFlow.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Investing Activities */}
                <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        Investing Activities
                    </h4>
                    <div className="space-y-3">
                        <div className="text-center py-4 text-muted-foreground">
                            <p className="text-sm">Investment transactions will appear here</p>
                            <p className="text-xs">Asset purchases, sales, and investment activities</p>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center py-2 font-semibold">
                            <span>Net Cash from Investing Activities</span>
                            <span className={currentInvestingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                                ${currentInvestingCashFlow.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Financing Activities */}
                <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-orange-600" />
                        Financing Activities
                    </h4>
                    <div className="space-y-3">
                        <div className="text-center py-4 text-muted-foreground">
                            <p className="text-sm">Loan and debt transactions will appear here</p>
                            <p className="text-xs">Borrowing, loan payments, and debt-related activities</p>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center py-2 font-semibold">
                            <span>Net Cash from Financing Activities</span>
                            <span className={currentFinancingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                                ${currentFinancingCashFlow.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Net Cash Flow */}
                <div className="bg-muted/50 p-6 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                            <span className="font-semibold text-xl">Net Cash Flow</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                variant={netChange >= 0 ? "default" : "destructive"}
                                className="text-xs"
                            >
                                {netChange >= 0 ? '+' : ''}{netChange.toFixed(1)}%
                            </Badge>
                            <span className={`font-bold text-2xl ${currentNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${currentNetCashFlow.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Previous period: ${previousNetCashFlow.toLocaleString()}
                    </p>
                </div>

                {/* Cash Flow Analysis */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {currentOperatingIncome > 0 ? ((currentOperatingCashFlow / currentOperatingIncome) * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Operating Cash Flow Ratio</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {currentOperatingCashFlow >= 0 ? 'Positive' : 'Negative'}
                        </div>
                        <div className="text-sm text-muted-foreground">Cash Flow Health</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}