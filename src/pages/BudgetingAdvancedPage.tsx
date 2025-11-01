import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useTransactions, useCategories } from '@/lib/hooks/use-budget-queries';
import { BudgetAllocationService } from '@/lib/services/budget-allocation.service';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Target, PiggyBank } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function BudgetingAdvancedPage() {
    const { data: transactions = [] } = useTransactions();
    const { data: categories = [] } = useCategories();

    const [monthlyIncome, setMonthlyIncome] = useState<number>(5000);
    const [budgetType, setBudgetType] = useState<'503020' | 'custom' | 'zerobased'>('503020');

    // Custom allocation percentages
    const [needsPercent, setNeedsPercent] = useState<number>(50);
    const [wantsPercent, setWantsPercent] = useState<number>(30);
    const [savingsPercent, setSavingsPercent] = useState<number>(20);

    // Calculate 50/30/20 allocation
    const allocation = budgetType === '503020'
        ? BudgetAllocationService.calculate503020Allocation(monthlyIncome)
        : BudgetAllocationService.calculateCustomAllocation(
            monthlyIncome,
            needsPercent,
            wantsPercent,
            savingsPercent
        );

    // Get current month data
    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());

    const budgetSummary = BudgetAllocationService.generateBudgetSummary(
        transactions,
        categories,
        monthlyIncome,
        startDate,
        endDate
    );

    // Prepare data for pie chart
    const allocationData = [
        { name: 'Needs (50%)', value: allocation.needs, color: '#ef4444' },
        { name: 'Wants (30%)', value: allocation.wants, color: '#3b82f6' },
        { name: 'Savings (20%)', value: allocation.savings, color: '#10b981' },
    ];

    const spendingData = [
        {
            name: 'Needs',
            budget: allocation.needs,
            actual: budgetSummary.categoryBreakdown
                .filter(c => c.type === 'needs')
                .reduce((sum, c) => sum + c.currentSpending, 0),
            utilization: budgetSummary.needsUtilization
        },
        {
            name: 'Wants',
            budget: allocation.wants,
            actual: budgetSummary.categoryBreakdown
                .filter(c => c.type === 'wants')
                .reduce((sum, c) => sum + c.currentSpending, 0),
            utilization: budgetSummary.wantsUtilization
        },
        {
            name: 'Savings',
            budget: allocation.savings,
            actual: budgetSummary.categoryBreakdown
                .filter(c => c.type === 'savings')
                .reduce((sum, c) => sum + c.currentSpending, 0),
            utilization: budgetSummary.savingsUtilization
        },
    ];

    const COLORS = {
        needs: '#ef4444',
        wants: '#3b82f6',
        savings: '#10b981'
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold">Advanced Budgeting</h1>
                <p className="text-muted-foreground mt-1">
                    Smart budget allocation using 50/30/20 rule, zero-based budgeting, and envelope system
                </p>
            </div>

            {/* Income Input */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Income</CardTitle>
                    <CardDescription>Enter your total monthly income to calculate budget allocation</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Label htmlFor="income">Monthly Income ($)</Label>
                            <Input
                                id="income"
                                type="number"
                                value={monthlyIncome}
                                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                                placeholder="5000"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-6">
                            <DollarSign className="h-4 w-4" />
                            <span>{monthlyIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Budget Type Selector */}
            <Tabs value={budgetType} onValueChange={(v) => setBudgetType(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="503020">50/30/20 Rule</TabsTrigger>
                    <TabsTrigger value="custom">Custom Allocation</TabsTrigger>
                    <TabsTrigger value="zerobased">Zero-Based</TabsTrigger>
                </TabsList>

                {/* 50/30/20 Rule Tab */}
                <TabsContent value="503020" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>50/30/20 Budget Rule</CardTitle>
                            <CardDescription>
                                Allocate 50% to needs, 30% to wants, and 20% to savings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Allocation Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Target className="h-5 w-5 text-red-600" />
                                            Needs (50%)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-red-600">
                                            ${allocation.needs.toFixed(2)}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Rent, utilities, groceries, insurance
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-blue-600" />
                                            Wants (30%)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-blue-600">
                                            ${allocation.wants.toFixed(2)}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Dining out, entertainment, hobbies
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <PiggyBank className="h-5 w-5 text-green-600" />
                                            Savings (20%)
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-green-600">
                                            ${allocation.savings.toFixed(2)}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Emergency fund, investments, goals
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Pie Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Budget Allocation Visualization</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={allocationData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }: any) => `${name}: $${value.toFixed(0)}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {allocationData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </Card>

                    {/* Current Month Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Month Performance</CardTitle>
                            <CardDescription>How you're tracking against your budget</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Budget vs Actual Chart */}
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={spendingData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                    <Legend />
                                    <Bar dataKey="budget" fill="#94a3b8" name="Budget" />
                                    <Bar dataKey="actual" fill="#3b82f6" name="Actual Spending" />
                                </BarChart>
                            </ResponsiveContainer>

                            {/* Utilization Progress Bars */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <Label>Needs Utilization</Label>
                                        <span className="text-sm font-medium">{budgetSummary.needsUtilization.toFixed(1)}%</span>
                                    </div>
                                    <Progress
                                        value={Math.min(budgetSummary.needsUtilization, 100)}
                                        className="h-2"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <Label>Wants Utilization</Label>
                                        <span className="text-sm font-medium">{budgetSummary.wantsUtilization.toFixed(1)}%</span>
                                    </div>
                                    <Progress
                                        value={Math.min(budgetSummary.wantsUtilization, 100)}
                                        className="h-2"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-2">
                                        <Label>Savings Utilization</Label>
                                        <span className="text-sm font-medium">{budgetSummary.savingsUtilization.toFixed(1)}%</span>
                                    </div>
                                    <Progress
                                        value={Math.min(budgetSummary.savingsUtilization, 100)}
                                        className="h-2"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {budgetSummary.isBalanced ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                )}
                                Budget Health & Recommendations
                            </CardTitle>
                            <CardDescription>
                                {budgetSummary.isBalanced
                                    ? 'Your budget is well-balanced!'
                                    : 'Your budget needs adjustment'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {budgetSummary.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <span className="mt-0.5">{rec.charAt(0)}</span>
                                        <span>{rec.substring(1)}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Custom Allocation Tab */}
                <TabsContent value="custom" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Budget Allocation</CardTitle>
                            <CardDescription>
                                Customize your budget percentages (must total 100%)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="needs">Needs (%)</Label>
                                <Input
                                    id="needs"
                                    type="number"
                                    value={needsPercent}
                                    onChange={(e) => setNeedsPercent(Number(e.target.value))}
                                    min={0}
                                    max={100}
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    ${((monthlyIncome * needsPercent) / 100).toFixed(2)}
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="wants">Wants (%)</Label>
                                <Input
                                    id="wants"
                                    type="number"
                                    value={wantsPercent}
                                    onChange={(e) => setWantsPercent(Number(e.target.value))}
                                    min={0}
                                    max={100}
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    ${((monthlyIncome * wantsPercent) / 100).toFixed(2)}
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="savings">Savings (%)</Label>
                                <Input
                                    id="savings"
                                    type="number"
                                    value={savingsPercent}
                                    onChange={(e) => setSavingsPercent(Number(e.target.value))}
                                    min={0}
                                    max={100}
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    ${((monthlyIncome * savingsPercent) / 100).toFixed(2)}
                                </p>
                            </div>

                            <div className="pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Total:</span>
                                    <span className={`font-bold ${needsPercent + wantsPercent + savingsPercent === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                        {needsPercent + wantsPercent + savingsPercent}%
                                    </span>
                                </div>
                                {needsPercent + wantsPercent + savingsPercent !== 100 && (
                                    <p className="text-sm text-red-600 mt-2">
                                        Percentages must add up to 100%
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Zero-Based Budgeting Tab */}
                <TabsContent value="zerobased" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Zero-Based Budgeting</CardTitle>
                            <CardDescription>
                                Allocate every dollar of income to specific categories
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">
                                    Zero-based budgeting feature coming soon!
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    This will let you allocate every dollar to specific envelopes/categories
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
