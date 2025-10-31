import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { BankAccount } from '@/lib/hooks/use-budget-queries';
import {
    Building2,
    Wallet,
    TrendingUp,
    PiggyBank,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    EyeOff,
} from 'lucide-react';
import { useState } from 'react';

interface BankAccountCardProps {
    account: BankAccount;
    onEdit?: (account: BankAccount) => void;
    onDelete?: (id: string) => void;
}

const getAccountIcon = (type: string) => {
    switch (type) {
        case 'checking':
            return Building2;
        case 'savings':
            return PiggyBank;
        case 'investment':
            return TrendingUp;
        case 'cash':
        case 'wallet':
            return Wallet;
        default:
            return Building2;
    }
};

const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        checking: 'Checking',
        savings: 'Savings',
        investment: 'Investment',
        cash: 'Cash',
        wallet: 'Wallet',
        other: 'Other',
    };
    return labels[type] || type;
};

export function BankAccountCard({ account, onEdit, onDelete }: BankAccountCardProps) {
    const [showBalance, setShowBalance] = useState(true);
    const Icon = getAccountIcon(account.account_type);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: account.currency || 'USD',
        }).format(amount);
    };

    return (
        <Card
            className="relative overflow-hidden transition-all hover:shadow-md"
            style={{
                borderTop: `4px solid ${account.color}`,
            }}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 rounded-lg"
                            style={{
                                backgroundColor: `${account.color}20`,
                                color: account.color,
                            }}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold">
                                {account.account_name}
                            </CardTitle>
                            {account.bank_name && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {account.bank_name}
                                </p>
                            )}
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(account)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    onClick={() => onDelete(account.id)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent>
                <div className="space-y-3">
                    {/* Balance */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Balance</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${showBalance ? '' : 'blur-sm select-none'}`}>
                                {formatCurrency(account.balance)}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setShowBalance(!showBalance)}
                            >
                                {showBalance ? (
                                    <Eye className="h-4 w-4" />
                                ) : (
                                    <EyeOff className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Account Details */}
                    <div className="flex items-center justify-between text-sm">
                        <Badge variant="secondary">
                            {getAccountTypeLabel(account.account_type)}
                        </Badge>
                        {account.account_number && (
                            <span className="text-muted-foreground font-mono">
                                {account.account_number}
                            </span>
                        )}
                    </div>

                    {/* Status Badge */}
                    {!account.is_active && (
                        <Badge variant="destructive" className="w-full justify-center">
                            Inactive
                        </Badge>
                    )}

                    {/* Notes */}
                    {account.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                            {account.notes}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
