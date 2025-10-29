import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowUpRight, ArrowDownRight, PiggyBank } from 'lucide-react';

interface MonthlyData {
    month: string;
    income: number;
    expenses: number;
    savings: number;
}

interface MonthlyBreakdownCardsProps {
    monthlyData: MonthlyData[];
}

export function MonthlyBreakdownCards({ monthlyData }: MonthlyBreakdownCardsProps) {
    return (
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Monthly Breakdown (Last 12 Months)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {monthlyData.map((month, index) => {
                        const savingsPositive = month.savings >= 0;
                        return (
                            <Card
                                key={index}
                                className="overflow-hidden border shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                            >
                                <CardHeader className="pb-3 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                                    <CardTitle className="text-sm font-semibold text-center">{month.month}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <ArrowUpRight className="h-3 w-3 text-green-600" />
                                            Income
                                        </span>
                                        <span className="font-semibold text-green-600">${month.income.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground flex items-center gap-1">
                                            <ArrowDownRight className="h-3 w-3 text-red-600" />
                                            Expenses
                                        </span>
                                        <span className="font-semibold text-red-600">${month.expenses.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-2 border-t">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <PiggyBank className="h-3 w-3" />
                                                Savings
                                            </span>
                                            <span
                                                className={`font-bold ${savingsPositive ? 'text-blue-600' : 'text-red-600'
                                                    }`}
                                            >
                                                ${month.savings.toFixed(2)}
                                            </span>
                                        </div>
                                        {month.income > 0 && (
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${savingsPositive ? 'bg-blue-600' : 'bg-red-600'
                                                            }`}
                                                        style={{
                                                            width: `${Math.min(
                                                                Math.abs((month.savings / month.income) * 100),
                                                                100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground text-center mt-1">
                                                    {((month.savings / month.income) * 100).toFixed(0)}% rate
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
