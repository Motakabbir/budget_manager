'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart3,
    FileText,
    TrendingUp,
    TrendingDown,
    Download,
    Calendar,
    DollarSign,
    FileSpreadsheet
} from 'lucide-react';

import { IncomeStatement } from '@/components/reports/IncomeStatement';
import { BalanceSheet } from '@/components/reports/BalanceSheet';
import { CashFlowStatement } from '@/components/reports/CashFlowStatement';
import { NetWorthTracker } from '@/components/reports/NetWorthTracker';
import { TaxReports } from '@/components/reports/TaxReports';
import { SpendingHeatmap } from '@/components/reports/SpendingHeatmap';
import { CategoryComparisonCharts } from '@/components/reports/CategoryComparisonCharts';
import { IncomeBreakdownCharts } from '@/components/reports/IncomeBreakdownCharts';
import { ExpenseTrendsCharts } from '@/components/reports/ExpenseTrendsCharts';
import { BudgetVarianceCharts } from '@/components/reports/BudgetVarianceCharts';
import { useTransactions } from '@/lib/hooks/use-budget-queries';
import { subMonths, subDays, startOfYear } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Transaction {
    id: string;
    user_id: string;
    category_id: string;
    amount: number;
    description: string | null;
    date: string;
    type: 'income' | 'expense';
    created_at: string;
    updated_at: string;
    category?: Category | null;
}

interface Category {
    id: string;
    user_id: string;
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string | null;
    created_at: string;
    updated_at: string;
}

interface ReportData {
    income: number;
    expenses: number;
    netProfit: number;
    savingsRate: number;
    transactions: Transaction[];
    dateRange: { start: Date; end: Date };
    previousIncome: number;
    previousExpenses: number;
    previousNetProfit: number;
}

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState('last-year');
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

    // Convert dateRange string to actual date range
    const getDateRange = (range: string) => {
        const now = new Date();
        switch (range) {
            case 'last-7-days':
                return {
                    start: subDays(now, 7),
                    end: now
                };
            case 'last-30-days':
                return {
                    start: subDays(now, 30),
                    end: now
                };
            case 'last-3-months':
                return {
                    start: subMonths(now, 3),
                    end: now
                };
            case 'last-6-months':
                return {
                    start: subMonths(now, 6),
                    end: now
                };
            case 'last-year':
                return {
                    start: startOfYear(now),
                    end: now
                };
            case 'custom':
                // For now, default to last 30 days for custom
                return {
                    start: subDays(now, 30),
                    end: now
                };
            default:
                return {
                    start: subDays(now, 30),
                    end: now
                };
        }
    };

    const selectedDateRange = getDateRange(dateRange);


    // Get year-to-date data for year-end summary
    const yearStart = startOfYear(new Date());
    const { data: yearTransactions = [] } = useTransactions();

    // Get current period data - NO DATE FILTER, show all transactions
    const { data: currentTransactions = [], isLoading: isLoadingCurrent } = useTransactions();

    // Get previous period data for comparison (same duration as current period)
    const previousPeriodStart = new Date(selectedDateRange.start);
    const previousPeriodEnd = new Date(selectedDateRange.end);
    const periodDuration = selectedDateRange.end.getTime() - selectedDateRange.start.getTime();

    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodDuration);
    previousPeriodEnd.setTime(previousPeriodEnd.getTime() - periodDuration);

    const { data: previousTransactions = [] } = useTransactions();
    // Calculate metrics
    const currentIncome = currentTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

    const currentExpenses = currentTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

    const previousIncome = previousTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

    const previousExpenses = previousTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
    // Debug log
    console.log('ReportsPage - All Transactions (NO FILTER):', {
        transactionCount: currentTransactions.length,
        income: currentIncome,
        expenses: currentExpenses,
        netProfit: currentIncome - currentExpenses,
        isLoading: isLoadingCurrent,
        sampleTransactions: currentTransactions.slice(0, 5).map((t: any) => ({
            date: t.date,
            type: t.type,
            amount: t.amount,
            description: t.description
        }))
    });



    const netProfit = currentIncome - currentExpenses;
    const previousNetProfit = previousIncome - previousExpenses;

    const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0;

    // Calculate percentage changes
    const incomeChange = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
    const expenseChange = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0;
    const profitChange = previousNetProfit !== 0 ? ((netProfit - previousNetProfit) / Math.abs(previousNetProfit)) * 100 : 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const handleExport = (reportType: string) => {
        const reportData: ReportData = {
            income: currentIncome,
            expenses: currentExpenses,
            netProfit,
            savingsRate,
            transactions: currentTransactions,
            dateRange: selectedDateRange,
            previousIncome,
            previousExpenses,
            previousNetProfit
        };

        switch (reportType) {
            case 'pdf':
                exportToPDF(reportData);
                break;
            case 'excel':
                exportToExcel(reportData);
                break;
            case 'csv':
                exportToCSV(reportData);
                break;
            case 'tax-ready':
                exportTaxReady(reportData);
                break;
            case 'year-end':
                exportYearEndSummary();
                break;
            default:
                // Unknown export type - do nothing
                break;
        }
    };

    const exportToPDF = (data: ReportData) => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text('Financial Report', 20, 30);

        // Date range
        doc.setFontSize(12);
        doc.text(`Period: ${selectedDateRange.start.toLocaleDateString()} - ${selectedDateRange.end.toLocaleDateString()}`, 20, 45);

        // Summary metrics
        doc.setFontSize(14);
        doc.text('Financial Summary', 20, 65);

        const summaryData = [
            ['Total Income', formatCurrency(data.income)],
            ['Total Expenses', formatCurrency(data.expenses)],
            ['Net Profit', formatCurrency(data.netProfit)],
            ['Savings Rate', `${data.savingsRate.toFixed(1)}%`],
            ['Income Change', `${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}%`],
            ['Expense Change', `${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}%`],
            ['Profit Change', `${profitChange >= 0 ? '+' : ''}${profitChange.toFixed(1)}%`]
        ];

        (doc as any).autoTable({
            startY: 75,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [66, 139, 202] }
        });

        // Transaction details
        const transactionData = data.transactions.map((t: Transaction) => [
            t.date,
            t.description,
            t.category,
            t.type,
            formatCurrency(t.amount)
        ]);

        (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
            body: transactionData,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 139, 202] }
        });

        doc.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportToExcel = (data: ReportData) => {
        const workbook = XLSX.utils.book_new();

        // Summary sheet
        const summaryData = [
            ['Financial Report'],
            ['Period', `${selectedDateRange.start.toLocaleDateString()} - ${selectedDateRange.end.toLocaleDateString()}`],
            [''],
            ['Metric', 'Value'],
            ['Total Income', data.income],
            ['Total Expenses', data.expenses],
            ['Net Profit', data.netProfit],
            ['Savings Rate', `${data.savingsRate.toFixed(1)}%`],
            ['Income Change', `${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}%`],
            ['Expense Change', `${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}%`],
            ['Profit Change', `${profitChange >= 0 ? '+' : ''}${profitChange.toFixed(1)}%`]
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Transactions sheet
        const transactionHeaders = ['Date', 'Description', 'Category', 'Type', 'Amount'];
        const transactionData = data.transactions.map((t: Transaction) => [
            t.date,
            t.description,
            t.category,
            t.type,
            t.amount
        ]);

        const transactionsSheet = XLSX.utils.aoa_to_sheet([transactionHeaders, ...transactionData]);
        XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');

        XLSX.writeFile(workbook, `financial-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToCSV = (data: ReportData) => {
        const csvData = data.transactions.map((t: Transaction) => ({
            Date: t.date,
            Description: t.description,
            Category: t.category,
            Type: t.type,
            Amount: t.amount
        }));

        const worksheet = XLSX.utils.json_to_sheet(csvData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

        XLSX.writeFile(workbook, `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const exportTaxReady = (data: ReportData) => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text('Tax-Ready Financial Report', 20, 30);
        doc.setFontSize(12);
        doc.text(`Tax Year: ${new Date().getFullYear()}`, 20, 45);
        doc.text(`Report Period: ${selectedDateRange.start.toLocaleDateString()} - ${selectedDateRange.end.toLocaleDateString()}`, 20, 55);

        // Tax categories breakdown
        doc.setFontSize(14);
        doc.text('Tax Categories Summary', 20, 75);

        // Categorize transactions for tax purposes
        const taxCategories = {
            businessIncome: data.transactions.filter((t: Transaction) =>
                t.type === 'income' && t.category?.name?.toLowerCase().includes('business')
            ).reduce((sum: number, t: Transaction) => sum + t.amount, 0),

            investmentIncome: data.transactions.filter((t: Transaction) =>
                t.type === 'income' && t.category?.name?.toLowerCase().includes('invest')
            ).reduce((sum: number, t: Transaction) => sum + t.amount, 0),

            otherIncome: data.transactions.filter((t: Transaction) =>
                t.type === 'income' && !t.category?.name?.toLowerCase().includes('business') &&
                !t.category?.name?.toLowerCase().includes('invest')
            ).reduce((sum: number, t: Transaction) => sum + t.amount, 0),

            businessExpenses: data.transactions.filter((t: Transaction) =>
                t.type === 'expense' && t.category?.name?.toLowerCase().includes('business')
            ).reduce((sum: number, t: Transaction) => sum + t.amount, 0),

            investmentExpenses: data.transactions.filter((t: Transaction) =>
                t.type === 'expense' && t.category?.name?.toLowerCase().includes('invest')
            ).reduce((sum: number, t: Transaction) => sum + t.amount, 0),

            deductibleExpenses: data.transactions.filter((t: Transaction) =>
                t.type === 'expense' && (
                    t.category?.name?.toLowerCase().includes('home') ||
                    t.category?.name?.toLowerCase().includes('medical') ||
                    t.category?.name?.toLowerCase().includes('education') ||
                    t.category?.name?.toLowerCase().includes('charity')
                )
            ).reduce((sum: number, t: Transaction) => sum + t.amount, 0),

            personalExpenses: data.transactions.filter((t: Transaction) =>
                t.type === 'expense' && !t.category?.name?.toLowerCase().includes('business') &&
                !t.category?.name?.toLowerCase().includes('invest') &&
                !t.category?.name?.toLowerCase().includes('home') &&
                !t.category?.name?.toLowerCase().includes('medical') &&
                !t.category?.name?.toLowerCase().includes('education') &&
                !t.category?.name?.toLowerCase().includes('charity')
            ).reduce((sum: number, t: Transaction) => sum + t.amount, 0)
        };

        const taxData = [
            ['Business Income', formatCurrency(taxCategories.businessIncome)],
            ['Investment Income', formatCurrency(taxCategories.investmentIncome)],
            ['Other Income', formatCurrency(taxCategories.otherIncome)],
            ['Total Income', formatCurrency(data.income)],
            [''],
            ['Business Expenses', formatCurrency(taxCategories.businessExpenses)],
            ['Investment Expenses', formatCurrency(taxCategories.investmentExpenses)],
            ['Deductible Expenses', formatCurrency(taxCategories.deductibleExpenses)],
            ['Personal Expenses', formatCurrency(taxCategories.personalExpenses)],
            ['Total Expenses', formatCurrency(data.expenses)],
            [''],
            ['Taxable Income', formatCurrency(Math.max(0, data.income - taxCategories.businessExpenses - taxCategories.investmentExpenses - taxCategories.deductibleExpenses))],
            ['Estimated Tax Liability (25%)', formatCurrency(Math.max(0, (data.income - taxCategories.businessExpenses - taxCategories.investmentExpenses - taxCategories.deductibleExpenses) * 0.25))]
        ];

        (doc as any).autoTable({
            startY: 85,
            head: [['Tax Category', 'Amount']],
            body: taxData,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [66, 139, 202] }
        });

        // Detailed transaction breakdown
        const businessTransactions = data.transactions.filter((t: Transaction) =>
            t.category?.name?.toLowerCase().includes('business')
        );

        if (businessTransactions.length > 0) {
            const businessData = businessTransactions.map((t: Transaction) => [
                t.date,
                t.description,
                t.type,
                formatCurrency(t.amount)
            ]);

            (doc as any).autoTable({
                startY: (doc as any).lastAutoTable.finalY + 20,
                head: [['Date', 'Business Transaction', 'Type', 'Amount']],
                body: businessData,
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 139, 202] }
            });
        }

        doc.save(`tax-ready-report-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportYearEndSummary = () => {
        const yearIncome = yearTransactions
            .filter((t: Transaction) => t.type === 'income')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        const yearExpenses = yearTransactions
            .filter((t: Transaction) => t.type === 'expense')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text('Year-End Financial Summary', 20, 30);
        doc.setFontSize(12);
        doc.text(`Year: ${new Date().getFullYear()}`, 20, 45);

        // Year-end metrics
        doc.setFontSize(14);
        doc.text('Year-to-Date Summary', 20, 65);

        const yearEndData = [
            ['Total Income (YTD)', formatCurrency(yearIncome)],
            ['Total Expenses (YTD)', formatCurrency(yearExpenses)],
            ['Net Profit (YTD)', formatCurrency(yearIncome - yearExpenses)],
            ['Taxable Income Estimate', formatCurrency(Math.max(0, yearIncome - yearExpenses))],
            ['Savings Rate (YTD)', `${yearIncome > 0 ? (((yearIncome - yearExpenses) / yearIncome) * 100).toFixed(1) : 0}%`]
        ];

        (doc as any).autoTable({
            startY: 75,
            head: [['Metric', 'Value']],
            body: yearEndData,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [66, 139, 202] }
        });

        // Tax categories
        const taxCategories = [
            ['Business Income', yearTransactions.filter((t: Transaction) => t.type === 'income' && t.category?.name?.toLowerCase().includes('business')).reduce((sum: number, t: Transaction) => sum + t.amount, 0)],
            ['Investment Income', yearTransactions.filter((t: Transaction) => t.type === 'income' && t.category?.name?.toLowerCase().includes('invest')).reduce((sum: number, t: Transaction) => sum + t.amount, 0)],
            ['Other Income', yearTransactions.filter((t: Transaction) => t.type === 'income' && !t.category?.name?.toLowerCase().includes('business') && !t.category?.name?.toLowerCase().includes('invest')).reduce((sum: number, t: Transaction) => sum + t.amount, 0)],
            ['Business Expenses', yearTransactions.filter((t: Transaction) => t.type === 'expense' && t.category?.name?.toLowerCase().includes('business')).reduce((sum: number, t: Transaction) => sum + t.amount, 0)],
            ['Investment Expenses', yearTransactions.filter((t: Transaction) => t.type === 'expense' && t.category?.name?.toLowerCase().includes('invest')).reduce((sum: number, t: Transaction) => sum + t.amount, 0)],
            ['Personal Expenses', yearTransactions.filter((t: Transaction) => t.type === 'expense' && !t.category?.name?.toLowerCase().includes('business') && !t.category?.name?.toLowerCase().includes('invest')).reduce((sum: number, t: Transaction) => sum + t.amount, 0)]
        ];

        (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Tax Category', 'Amount']],
            body: taxCategories.map(([category, amount]) => [category, formatCurrency(amount as number)]),
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [66, 139, 202] }
        });

        doc.save(`year-end-summary-${new Date().getFullYear()}.pdf`);
    };

    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Reports & Analytics
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Comprehensive financial reports and visual analytics
                    </p>
                </div>

                {/* Export Controls */}
                <div className="flex items-center gap-4">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm"
                    >
                        <option value="last-7-days">Last 7 Days</option>
                        <option value="last-30-days">Last 30 Days</option>
                        <option value="last-3-months">Last 3 Months</option>
                        <option value="last-6-months">Last 6 Months</option>
                        <option value="last-year">Last Year</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
                        className="px-3 py-2 border rounded-md text-sm"
                    >
                        <option value="pdf">PDF</option>
                        <option value="excel">Excel</option>
                        <option value="csv">CSV</option>
                    </select>

                    <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export All
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            {isLoadingCurrent ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="animate-pulse">
                                    <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                                    <div className="h-4 bg-gray-100 rounded w-32"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : currentTransactions.length === 0 ? (
                <Card className="col-span-full">
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                            <p className="text-muted-foreground mb-4">
                                You haven't added any transactions yet.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Go to Income or Expenses pages to add your first transaction.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(currentIncome)}</div>
                            <p className="text-xs text-muted-foreground">
                                {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}% from last period
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                ({currentTransactions.filter((t: any) => t.type === 'income').length} income transactions)
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                            <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(currentExpenses)}</div>
                            <p className="text-xs text-muted-foreground">
                                {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}% from last period
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                ({currentTransactions.filter((t: any) => t.type === 'expense').length} expense transactions)
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(netProfit)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {profitChange >= 0 ? '+' : ''}{profitChange.toFixed(1)}% from last period
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{savingsRate.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">
                                Target: 20%
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Reports Tabs */}
            <Tabs defaultValue="comprehensive" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="comprehensive">Comprehensive Reports</TabsTrigger>
                    <TabsTrigger value="analytics">Visual Analytics</TabsTrigger>
                    <TabsTrigger value="exports">Export Options</TabsTrigger>
                </TabsList>

                <TabsContent value="comprehensive" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <IncomeStatement />
                        <BalanceSheet />
                        <CashFlowStatement />
                        <NetWorthTracker />
                        <div className="md:col-span-2">
                            <TaxReports />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <SpendingHeatmap />
                        <CategoryComparisonCharts />
                        <IncomeBreakdownCharts />
                        <ExpenseTrendsCharts />
                        <div className="md:col-span-2">
                            <BudgetVarianceCharts />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="exports" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-red-500" />
                                    PDF Reports
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Generate comprehensive PDF reports with professional formatting and detailed summaries.
                                </p>
                                <Button
                                    onClick={() => handleExport('pdf')}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Generate PDF
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5 text-green-500" />
                                    Excel Export
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Export data in Excel format with multiple sheets for comprehensive analysis.
                                </p>
                                <Button
                                    onClick={() => handleExport('excel')}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Export Excel
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    CSV Export
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Export transaction data in CSV format for spreadsheet analysis or tax software.
                                </p>
                                <Button
                                    onClick={() => handleExport('csv')}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Export CSV
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-purple-500" />
                                    Tax-Ready Format
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Generate tax-ready reports with categorized income and deductible expenses.
                                </p>
                                <Button
                                    onClick={() => handleExport('tax-ready')}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Tax Report
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2 lg:col-span-4">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-indigo-500" />
                                    Year-End Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Generate comprehensive year-end financial summaries for tax filing, planning, and record-keeping.
                                </p>
                                <Button
                                    onClick={() => handleExport('year-end')}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Generate Year-End Summary
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}