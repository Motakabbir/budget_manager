import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions, useUserSettings } from '@/lib/hooks/use-budget-queries';
import { FinancialForecastingService } from '@/lib/services/financial-forecasting.service';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, DollarSign, Activity, Target } from 'lucide-react';
import { format } from 'date-fns';

export default function ForecastingPage() {
    const { data: transactions = [] } = useTransactions();
    const { data: userSettings } = useUserSettings();

    const [projectionMonths, setProjectionMonths] = useState<3 | 6 | 12>(6);
    const [currentBalance, setCurrentBalance] = useState<number>(
        userSettings?.opening_balance || 10000
    );

    // Generate cash flow projection
    const projection = FinancialForecastingService.generateCashFlowProjection(
        transactions,
        currentBalance,
        projectionMonths
    );

    // What-if scenario states
    const [salaryIncrease, setSalaryIncrease] = useState<number>(500);
    const [loanPayment, setLoanPayment] = useState<number>(300);
    const [loanMonths, setLoanMonths] = useState<number>(12);
    const [expenseReduction, setExpenseReduction] = useState<number>(200);
    const [newExpense, setNewExpense] = useState<number>(150);
    const [emergencySavings, setEmergencySavings] = useState<number>(300);
    const [emergencyTarget, setEmergencyTarget] = useState<number>(5000);

    // Generate scenarios
    const salaryScenario = FinancialForecastingService.scenarioSalaryIncrease(
        projection,
        salaryIncrease
    );

    const loanScenario = FinancialForecastingService.scenarioLoanPayoff(
        projection,
        loanPayment,
        loanMonths
    );

    const expenseReductionScenario = FinancialForecastingService.scenarioExpenseReduction(
        projection,
        expenseReduction,
        'dining out'
    );

    const newExpenseScenario = FinancialForecastingService.scenarioNewExpense(
        projection,
        newExpense,
        'subscription'
    );

    const emergencyScenario = FinancialForecastingService.scenarioEmergencyFund(
        projection,
        emergencySavings,
        emergencyTarget
    );

    const scenarios = [
        salaryScenario,
        loanScenario,
        expenseReductionScenario,
        emergencyScenario
    ];

    const comparison = FinancialForecastingService.compareScenarios(scenarios);

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Financial Forecasting</h1>
                <p className="text-muted-foreground mt-1">
                    Predict future balance, analyze cash flow, and explore what-if scenarios
                </p>
            </div>

            {/* Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Forecast Settings</CardTitle>
                    <CardDescription>Configure your projection parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="balance">Current Balance ($)</Label>
                            <Input
                                id="balance"
                                type="number"
                                value={currentBalance}
                                onChange={(e) => setCurrentBalance(Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="months">Projection Period</Label>
                            <Select
                                value={projectionMonths.toString()}
                                onValueChange={(v) => setProjectionMonths(Number(v) as 3 | 6 | 12)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3 Months</SelectItem>
                                    <SelectItem value="6">6 Months</SelectItem>
                                    <SelectItem value="12">12 Months</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Projected Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${projection.projectedBalance.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            In {projectionMonths} months
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg Monthly Cash Flow
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${projection.averageNetCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {projection.averageNetCashFlow >= 0 ? '+' : ''}${projection.averageNetCashFlow.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                            {projection.trend === 'improving' && (
                                <>
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    <span className="text-xs text-green-600">Improving</span>
                                </>
                            )}
                            {projection.trend === 'declining' && (
                                <>
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                    <span className="text-xs text-red-600">Declining</span>
                                </>
                            )}
                            {projection.trend === 'stable' && (
                                <span className="text-xs text-muted-foreground">Stable</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Burn Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {projection.burnRate === Infinity ? '∞' : projection.burnRate.toFixed(1)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {projection.burnRate === Infinity
                                ? 'Sustainable'
                                : `Months until $0`}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Financial Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {projection.trend === 'improving' && '😊 Good'}
                            {projection.trend === 'stable' && '😐 Fair'}
                            {projection.trend === 'declining' && '😟 Poor'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Based on trends
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Cash Flow Projection Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Cash Flow Projection</CardTitle>
                    <CardDescription>
                        Predicted income, expenses, and balance over the next {projectionMonths} months
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={projection.projections}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stackId="1"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.6}
                                name="Income"
                            />
                            <Area
                                type="monotone"
                                dataKey="expenses"
                                stackId="2"
                                stroke="#ef4444"
                                fill="#ef4444"
                                fillOpacity={0.6}
                                name="Expenses"
                            />
                            <Line
                                type="monotone"
                                dataKey="balance"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                name="Balance"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* What-If Scenarios */}
            <Tabs defaultValue="salary">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="salary">Salary</TabsTrigger>
                    <TabsTrigger value="loan">Loan Payoff</TabsTrigger>
                    <TabsTrigger value="reduce">Cut Expenses</TabsTrigger>
                    <TabsTrigger value="new">New Expense</TabsTrigger>
                    <TabsTrigger value="emergency">Emergency Fund</TabsTrigger>
                </TabsList>

                {/* Salary Increase Scenario */}
                <TabsContent value="salary" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Salary Increase Scenario</CardTitle>
                            <CardDescription>{salaryScenario.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="salary-increase">Monthly Income Increase ($)</Label>
                                <Input
                                    id="salary-increase"
                                    type="number"
                                    value={salaryIncrease}
                                    onChange={(e) => setSalaryIncrease(Number(e.target.value))}
                                />
                            </div>

                            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    <span className="font-semibold text-green-900 dark:text-green-100">
                                        Total Impact: +${salaryScenario.totalImpact.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    {salaryScenario.recommendation}
                                </p>
                            </div>

                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={salaryScenario.projections}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="balance"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        name="Projected Balance"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Loan Payoff Scenario */}
                <TabsContent value="loan" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Loan Payoff Scenario</CardTitle>
                            <CardDescription>{loanScenario.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="loan-payment">Monthly Loan Payment ($)</Label>
                                    <Input
                                        id="loan-payment"
                                        type="number"
                                        value={loanPayment}
                                        onChange={(e) => setLoanPayment(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="loan-months">Remaining Months</Label>
                                    <Input
                                        id="loan-months"
                                        type="number"
                                        value={loanMonths}
                                        onChange={(e) => setLoanMonths(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="h-5 w-5 text-blue-600" />
                                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                                        Total Impact: +${loanScenario.totalImpact.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    {loanScenario.recommendation}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Expense Reduction Scenario */}
                <TabsContent value="reduce" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Expense Reduction Scenario</CardTitle>
                            <CardDescription>{expenseReductionScenario.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="expense-reduction">Monthly Reduction ($)</Label>
                                <Input
                                    id="expense-reduction"
                                    type="number"
                                    value={expenseReduction}
                                    onChange={(e) => setExpenseReduction(Number(e.target.value))}
                                />
                            </div>

                            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    <span className="font-semibold text-green-900 dark:text-green-100">
                                        Total Savings: ${expenseReductionScenario.totalImpact.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    {expenseReductionScenario.recommendation}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* New Expense Scenario */}
                <TabsContent value="new" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>New Expense Scenario</CardTitle>
                            <CardDescription>{newExpenseScenario.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="new-expense">Monthly New Expense ($)</Label>
                                <Input
                                    id="new-expense"
                                    type="number"
                                    value={newExpense}
                                    onChange={(e) => setNewExpense(Number(e.target.value))}
                                />
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                    <span className="font-semibold text-amber-900 dark:text-amber-100">
                                        Total Cost: ${Math.abs(newExpenseScenario.totalImpact).toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    {newExpenseScenario.recommendation}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Emergency Fund Scenario */}
                <TabsContent value="emergency" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Emergency Fund Building</CardTitle>
                            <CardDescription>{emergencyScenario.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="emergency-savings">Monthly Savings ($)</Label>
                                    <Input
                                        id="emergency-savings"
                                        type="number"
                                        value={emergencySavings}
                                        onChange={(e) => setEmergencySavings(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="emergency-target">Target Amount ($)</Label>
                                    <Input
                                        id="emergency-target"
                                        type="number"
                                        value={emergencyTarget}
                                        onChange={(e) => setEmergencyTarget(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="h-5 w-5 text-purple-600" />
                                    <span className="font-semibold text-purple-900 dark:text-purple-100">
                                        Time to Goal: {Math.ceil(emergencyTarget / emergencySavings)} months
                                    </span>
                                </div>
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                    {emergencyScenario.recommendation}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Scenario Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Scenario Comparison</CardTitle>
                    <CardDescription>Compare the impact of different financial decisions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg p-4">
                            <div className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                🏆 Best Case Scenario
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                <span className="font-medium">{comparison.bestCase.name}</span>:
                                +${comparison.bestCase.totalImpact.toFixed(2)} over {projectionMonths} months
                            </p>
                        </div>

                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg p-4">
                            <div className="font-semibold text-red-900 dark:text-red-100 mb-1">
                                ⚠️ Worst Case Scenario
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                <span className="font-medium">{comparison.worstCase.name}</span>:
                                ${comparison.worstCase.totalImpact.toFixed(2)} over {projectionMonths} months
                            </p>
                        </div>

                        <p className="text-sm text-muted-foreground">{comparison.summary}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
