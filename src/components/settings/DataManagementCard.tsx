import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Database, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { exportAllData, importBackupData } from '@/lib/utils/backup';
import { useRef } from 'react';

export function DataManagementCard() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        try {
            await exportAllData();
        } catch (error) {
            // Error already handled in exportAllData
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            toast.error('Invalid file type', { description: 'Please select a JSON backup file' });
            return;
        }

        const confirmed = window.confirm(
            'Importing a backup will add data to your account. This action cannot be undone. Continue?'
        );

        if (!confirmed) return;

        try {
            await importBackupData(file);
        } catch (error) {
            // Error already handled in importBackupData
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Card className="border-2 border-blue-200 dark:border-blue-900">
            <CardHeader className="bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    Data Management
                </CardTitle>
                <CardDescription>
                    Backup and restore your financial data
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Export Backup
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                        Download all your data as a JSON file. This includes transactions, categories,
                        savings goals, and settings.
                    </p>
                    <Button
                        onClick={handleExport}
                        variant="outline"
                        className="w-full"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export All Data
                    </Button>
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <Upload className="h-4 w-4" />
                        Import Backup
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                        Restore data from a previously exported backup file. Categories will be merged,
                        and transactions will be added.
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="hidden"
                        id="backup-file-input"
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="w-full"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Import Backup File
                    </Button>
                </div>

                <div className="border-t pt-4">
                    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-xs text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">Data Privacy</p>
                            <p>
                                Your data is stored securely in Supabase with end-to-end encryption. Backup
                                files are generated locally and never sent to external servers.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
