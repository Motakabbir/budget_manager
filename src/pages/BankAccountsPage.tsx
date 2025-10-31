import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    useBankAccounts,
    useAccountTransfers,
    useDeleteBankAccount,
    useDeleteAccountTransfer,
} from '@/lib/hooks/use-budget-queries';
import {
    AddBankAccountDialog,
    BankAccountCard,
    TransferDialog,
} from '@/components/bank-accounts';
import {
    Building2,
    Wallet,
    TrendingUp,
    ArrowRightLeft,
    Eye,
    EyeOff,
    Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function BankAccountsPage() {
    const [showTotalBalance, setShowTotalBalance] = useState(true);
    const { data: accounts = [], isLoading: accountsLoading } = useBankAccounts();
    const { data: transfers = [], isLoading: transfersLoading } = useAccountTransfers();
    const deleteAccount = useDeleteBankAccount();
    const deleteTransfer = useDeleteAccountTransfer();

    const activeAccounts = accounts.filter((acc) => acc.is_active);
    const totalBalance = activeAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    const handleDeleteAccount = (id: string) => {
        if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
            deleteAccount.mutate(id);
        }
    };

    const handleDeleteTransfer = (id: string) => {
        if (confirm('Delete this transfer? Note: This will not reverse the transaction.')) {
            deleteTransfer.mutate(id);
        }
    };

    const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount);
    };

    if (accountsLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
                        <p className="text-muted-foreground">Manage your accounts and transfers</p>
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-6 bg-muted rounded w-1/2" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-muted rounded w-3/4" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
                    <p className="text-muted-foreground">
                        Manage your bank accounts and track transfers
                    </p>
                </div>
                <div className="flex gap-2">
                    <TransferDialog accounts={activeAccounts} />
                    <AddBankAccountDialog />
                </div>
            </div>

            {/* Total Balance Card */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                <CardHeader>
                    <CardTitle className="text-white/90 text-lg font-medium flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Total Balance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className={showTotalBalance ? '' : 'blur-sm select-none'}>
                            <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
                            <p className="text-sm text-white/70 mt-1">
                                Across {activeAccounts.length}{' '}
                                {activeAccounts.length === 1 ? 'account' : 'accounts'}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={() => setShowTotalBalance(!showTotalBalance)}
                        >
                            {showTotalBalance ? (
                                <Eye className="h-5 w-5" />
                            ) : (
                                <EyeOff className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="accounts" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="accounts">
                        <Building2 className="mr-2 h-4 w-4" />
                        Accounts ({accounts.length})
                    </TabsTrigger>
                    <TabsTrigger value="transfers">
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Transfers ({transfers.length})
                    </TabsTrigger>
                </TabsList>

                {/* Accounts Tab */}
                <TabsContent value="accounts" className="space-y-6">
                    {accounts.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
                                <p className="text-muted-foreground text-center mb-4 max-w-md">
                                    Create your first bank account to start tracking your finances
                                    across multiple accounts.
                                </p>
                                <AddBankAccountDialog />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {accounts.map((account) => (
                                <BankAccountCard
                                    key={account.id}
                                    account={account}
                                    onDelete={handleDeleteAccount}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Transfers Tab */}
                <TabsContent value="transfers" className="space-y-6">
                    {transfers.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <ArrowRightLeft className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No transfers yet</h3>
                                <p className="text-muted-foreground text-center mb-4 max-w-md">
                                    Transfer money between your accounts to keep track of all movements.
                                </p>
                                {activeAccounts.length >= 2 ? (
                                    <TransferDialog accounts={activeAccounts} />
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Add at least 2 accounts to make transfers
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Transfer History</CardTitle>
                                <CardDescription>
                                    All money transfers between your accounts
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {transfers.map((transfer) => (
                                        <div
                                            key={transfer.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                                    <ArrowRightLeft className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium">
                                                            {transfer.from_account?.account_name}
                                                        </span>
                                                        <span className="text-muted-foreground">→</span>
                                                        <span className="font-medium">
                                                            {transfer.to_account?.account_name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span>
                                                            {format(new Date(transfer.date), 'MMM dd, yyyy')}
                                                        </span>
                                                        {transfer.description && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{transfer.description}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-semibold text-lg">
                                                        {formatCurrency(
                                                            transfer.amount,
                                                            transfer.from_account?.currency
                                                        )}
                                                    </p>
                                                    {transfer.transfer_fee > 0 && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Fee: {formatCurrency(transfer.transfer_fee)}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteTransfer(transfer.id)}
                                                    className="text-red-600"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
