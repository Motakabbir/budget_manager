import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BackupData {
    version: string;
    exportDate: string;
    userData: {
        email: string;
        fullName: string | null;
    };
    categories: any[];
    transactions: any[];
    savingsGoals: any[];
    categoryBudgets: any[];
    userSettings: any | null;
    recurringTransactions?: any[];
}

/**
 * Export all user data to JSON file
 */
export async function exportAllData(): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        toast.info('Exporting data...', { description: 'Please wait' });

        // Fetch all data
        const [categories, transactions, savingsGoals, categoryBudgets, userSettings] = await Promise.all([
            supabase.from('categories').select('*').eq('user_id', user.id),
            supabase.from('transactions').select('*').eq('user_id', user.id),
            supabase.from('savings_goals').select('*').eq('user_id', user.id),
            supabase.from('category_budgets').select('*').eq('user_id', user.id),
            supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
        ]);

        // Check for errors
        if (categories.error) throw categories.error;
        if (transactions.error) throw transactions.error;
        if (savingsGoals.error) throw savingsGoals.error;
        if (categoryBudgets.error) throw categoryBudgets.error;
        // userSettings error is okay if not found

        const backupData: BackupData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            userData: {
                email: user.email || '',
                fullName: user.user_metadata?.full_name || null,
            },
            categories: categories.data || [],
            transactions: transactions.data || [],
            savingsGoals: savingsGoals.data || [],
            categoryBudgets: categoryBudgets.data || [],
            userSettings: userSettings.data || null,
        };

        // Create and download file
        const blob = new Blob([JSON.stringify(backupData, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-manager-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('Data exported successfully', {
            description: `${transactions.data?.length || 0} transactions backed up`,
        });
    } catch (error) {
        console.error('Export error:', error);
        toast.error('Failed to export data', {
            description: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}

/**
 * Import data from JSON backup file
 */
export async function importBackupData(file: File): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        toast.info('Importing data...', { description: 'This may take a moment' });

        // Read file
        const text = await file.text();
        const backupData: BackupData = JSON.parse(text);

        // Validate backup format
        if (!backupData.version || !backupData.categories || !backupData.transactions) {
            throw new Error('Invalid backup file format');
        }

        let importedCount = 0;

        // Import categories first (needed for foreign keys)
        if (backupData.categories.length > 0) {
            const categoriesToImport = backupData.categories.map(cat => ({
                name: cat.name,
                type: cat.type,
                color: cat.color,
                icon: cat.icon,
                user_id: user.id,
            }));

            const { error: catError, data: importedCategories } = await supabase
                .from('categories')
                .upsert(categoriesToImport, {
                    onConflict: 'user_id,name,type',
                    ignoreDuplicates: false,
                })
                .select();

            if (catError) throw catError;
            importedCount += importedCategories?.length || 0;

            // Create category mapping (old ID -> new ID)
            const categoryMap = new Map();
            backupData.categories.forEach((oldCat, index) => {
                if (importedCategories && importedCategories[index]) {
                    categoryMap.set(oldCat.id, importedCategories[index].id);
                }
            });

            // Import transactions with mapped category IDs
            if (backupData.transactions.length > 0) {
                const transactionsToImport = backupData.transactions.map(txn => ({
                    category_id: categoryMap.get(txn.category_id) || txn.category_id,
                    amount: txn.amount,
                    description: txn.description,
                    date: txn.date,
                    type: txn.type,
                    user_id: user.id,
                }));

                // Insert in batches to avoid timeouts
                const batchSize = 100;
                for (let i = 0; i < transactionsToImport.length; i += batchSize) {
                    const batch = transactionsToImport.slice(i, i + batchSize);
                    const { error: txnError } = await supabase
                        .from('transactions')
                        .insert(batch);

                    if (txnError) throw txnError;
                    importedCount += batch.length;
                }
            }

            // Import savings goals
            if (backupData.savingsGoals.length > 0) {
                const goalsToImport = backupData.savingsGoals.map(goal => ({
                    name: goal.name,
                    target_amount: goal.target_amount,
                    current_amount: goal.current_amount,
                    deadline: goal.deadline,
                    user_id: user.id,
                }));

                const { error: goalError } = await supabase
                    .from('savings_goals')
                    .insert(goalsToImport);

                if (goalError) throw goalError;
                importedCount += goalsToImport.length;
            }

            // Import category budgets with mapped IDs
            if (backupData.categoryBudgets.length > 0) {
                const budgetsToImport = backupData.categoryBudgets.map(budget => ({
                    category_id: categoryMap.get(budget.category_id) || budget.category_id,
                    amount: budget.amount,
                    period: budget.period,
                    user_id: user.id,
                }));

                const { error: budgetError } = await supabase
                    .from('category_budgets')
                    .upsert(budgetsToImport, {
                        onConflict: 'user_id,category_id,period',
                    });

                if (budgetError) throw budgetError;
                importedCount += budgetsToImport.length;
            }

            // Import user settings
            if (backupData.userSettings) {
                const { error: settingsError } = await supabase
                    .from('user_settings')
                    .upsert({
                        user_id: user.id,
                        opening_balance: backupData.userSettings.opening_balance,
                        opening_date: backupData.userSettings.opening_date,
                    }, {
                        onConflict: 'user_id',
                    });

                if (settingsError) throw settingsError;
            }
        }

        toast.success('Data imported successfully', {
            description: `${importedCount} items restored`,
        });

        // Refresh the page to show imported data
        setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import data', {
            description: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
}

/**
 * Export transactions to CSV (enhanced version)
 */
export async function exportTransactionsToCSV(
    transactions: any[],
    filename?: string
): Promise<void> {
    try {
        if (transactions.length === 0) {
            toast.warning('No transactions to export');
            return;
        }

        const headers = [
            'Date',
            'Type',
            'Category',
            'Amount',
            'Description',
            'Balance Change',
        ];

        const rows = transactions.map((t) => {
            const balanceChange = t.type === 'income' ? `+${t.amount}` : `-${t.amount}`;
            return [
                format(new Date(t.date), 'yyyy-MM-dd'),
                t.type.charAt(0).toUpperCase() + t.type.slice(1),
                t.category?.name || 'Unknown',
                t.amount.toFixed(2),
                `"${(t.description || '').replace(/"/g, '""')}"`, // Escape quotes
                balanceChange,
            ];
        });

        const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success('CSV exported successfully', {
            description: `${transactions.length} transactions exported`,
        });
    } catch (error) {
        console.error('CSV export error:', error);
        toast.error('Failed to export CSV');
        throw error;
    }
}
