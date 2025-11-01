import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Building2, HandCoins } from 'lucide-react';
import { useBankAccounts } from '@/lib/hooks/use-budget-queries';
import { useLoans } from '@/lib/hooks/use-budget-queries';

interface BalanceSheetProps {
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export function BalanceSheet({ dateRange: _dateRange }: BalanceSheetProps) {
    const { data: bankAccounts = [] } = useBankAccounts();
    const { data: loans = [] } = useLoans();

    // Calculate Assets
    const bankAccountAssets = bankAccounts.reduce((sum: number, account) => sum + account.balance, 0);

    const totalAssets = bankAccountAssets; // For now, only bank accounts

    // Calculate Liabilities
    const loanLiabilities = loans.reduce((sum: number, loan) => sum + loan.outstanding_balance, 0);

    const creditCardLiabilities = bankAccounts
        .filter(account => account.account_type === 'checking') // Note: This might need adjustment based on actual credit card logic
        .reduce((sum: number, account) => sum + Math.abs(account.balance), 0);

    const totalLiabilities = loanLiabilities + creditCardLiabilities;

    // Calculate Net Worth
    const netWorth = totalAssets - totalLiabilities;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Balance Sheet (Assets vs Liabilities)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Financial position as of {new Date().toLocaleDateString()}
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Assets Section */}
                    <div>
                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            Assets
                        </h4>
                        <div className="space-y-4">
                            {/* Bank Accounts */}
                            <div>
                                <h5 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Bank Accounts
                                </h5>
                                <div className="space-y-2">
                                    {bankAccounts.map(account => (
                                        <div key={account.id} className="flex justify-between items-center py-1">
                                            <span className="text-sm">{account.account_name}</span>
                                            <span className="font-medium">${account.balance.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <Separator />
                                    <div className="flex justify-between items-center py-1 font-medium">
                                        <span>Total Assets</span>
                                        <span>${bankAccountAssets.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Liabilities Section */}
                    <div>
                        <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            Liabilities
                        </h4>
                        <div className="space-y-4">
                            {/* Loans */}
                            {loans.length > 0 && (
                                <div>
                                    <h5 className="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-2">
                                        <HandCoins className="h-4 w-4" />
                                        Loans
                                    </h5>
                                    <div className="space-y-2">
                                        {loans.map(loan => (
                                            <div key={loan.id} className="flex justify-between items-center py-1">
                                                <span className="text-sm">{loan.party_name}</span>
                                                <span className="font-medium text-red-600">${loan.outstanding_balance.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <Separator />
                                        <div className="flex justify-between items-center py-1 font-medium">
                                            <span>Total Loans</span>
                                            <span className="text-red-600">${loanLiabilities.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {totalLiabilities === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No liabilities found</p>
                                    <p className="text-sm">Great job staying debt-free!</p>
                                </div>
                            )}

                            {totalLiabilities > 0 && (
                                <>
                                    <Separator />
                                    <div className="flex justify-between items-center py-2 font-semibold text-lg">
                                        <span>Total Liabilities</span>
                                        <span className="text-red-600">${totalLiabilities.toLocaleString()}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Net Worth Section */}
                <div className="bg-muted/50 p-6 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                            <span className="font-semibold text-xl">Net Worth</span>
                        </div>
                        <span className={`font-bold text-2xl ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${netWorth.toLocaleString()}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Assets minus liabilities
                    </p>
                </div>

                {/* Financial Health Indicators */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                            {totalLiabilities > 0 ? ((totalAssets / totalLiabilities) * 100).toFixed(1) : '∞'}%
                        </div>
                        <div className="text-sm text-muted-foreground">Debt-to-Asset Ratio</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {totalAssets > 0 ? ((netWorth / totalAssets) * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Equity Ratio</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}