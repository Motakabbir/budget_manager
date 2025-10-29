import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface SpendingAlert {
    id: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    value?: number;
    icon: string;
    category?: {
        id: string;
        name: string;
        color: string;
    };
    actionable?: boolean;
}

interface SpendingAlertsCardProps {
    spendingAlerts: SpendingAlert[];
    criticalAlerts: SpendingAlert[];
    warningAlerts: SpendingAlert[];
    infoAlerts: SpendingAlert[];
    successAlerts: SpendingAlert[];
}

export function SpendingAlertsCard({
    spendingAlerts,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    successAlerts,
}: SpendingAlertsCardProps) {
    if (spendingAlerts.length === 0) {
        return null;
    }

    return (
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-amber-200 dark:border-amber-900">
            <CardHeader className="bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        Smart Alerts & Insights
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {criticalAlerts.length > 0 && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-600 text-white font-semibold">
                                {criticalAlerts.length} Critical
                            </span>
                        )}
                        {warningAlerts.length > 0 && (
                            <span className="px-2 py-1 text-xs rounded-full bg-orange-600 text-white font-semibold">
                                {warningAlerts.length} Warning
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="space-y-3">
                    {spendingAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-lg border-l-4 ${alert.type === 'critical'
                                    ? 'bg-red-50 dark:bg-red-950/20 border-red-600'
                                    : alert.type === 'warning'
                                        ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-600'
                                        : alert.type === 'success'
                                            ? 'bg-green-50 dark:bg-green-950/20 border-green-600'
                                            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-600'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1">
                                    <span className="text-2xl">{alert.icon}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4
                                                className={`font-semibold text-sm ${alert.type === 'critical'
                                                        ? 'text-red-900 dark:text-red-100'
                                                        : alert.type === 'warning'
                                                            ? 'text-orange-900 dark:text-orange-100'
                                                            : alert.type === 'success'
                                                                ? 'text-green-900 dark:text-green-100'
                                                                : 'text-blue-900 dark:text-blue-100'
                                                    }`}
                                            >
                                                {alert.title}
                                            </h4>
                                            {alert.category && (
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: alert.category.color }}
                                                />
                                            )}
                                        </div>
                                        <p
                                            className={`text-xs ${alert.type === 'critical'
                                                    ? 'text-red-700 dark:text-red-300'
                                                    : alert.type === 'warning'
                                                        ? 'text-orange-700 dark:text-orange-300'
                                                        : alert.type === 'success'
                                                            ? 'text-green-700 dark:text-green-300'
                                                            : 'text-blue-700 dark:text-blue-300'
                                                }`}
                                        >
                                            {alert.message}
                                        </p>
                                        {alert.category && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Category: {alert.category.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {alert.value !== undefined && (
                                    <div className="text-right">
                                        <p
                                            className={`text-lg font-bold ${alert.type === 'critical'
                                                    ? 'text-red-600'
                                                    : alert.type === 'warning'
                                                        ? 'text-orange-600'
                                                        : alert.type === 'success'
                                                            ? 'text-green-600'
                                                            : 'text-blue-600'
                                                }`}
                                        >
                                            ${alert.value.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary Footer */}
                <div className="mt-6 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
                        <p className="text-xs text-muted-foreground">Critical</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{warningAlerts.length}</p>
                        <p className="text-xs text-muted-foreground">Warnings</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{infoAlerts.length}</p>
                        <p className="text-xs text-muted-foreground">Info</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{successAlerts.length}</p>
                        <p className="text-xs text-muted-foreground">Positive</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
