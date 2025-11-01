/**
 * Security Settings Page
 * 
 * Comprehensive security and privacy settings including PIN, biometric,
 * auto-logout, data masking, and cloud backup
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Lock,
    Fingerprint,
    Shield,
    Eye,
    EyeOff,
    Clock,
    Database,
    AlertTriangle,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import {
    useSecuritySettings,
    useUpdateSecuritySettings,
    useDisablePIN,
    useBiometricAvailability,
    useEnrollBiometric,
    useDisableBiometric,
    useSecurityStatus,
    useSecurityLogs,
} from '@/lib/hooks/use-security';
import { PINSetup } from '@/components/security/PINLockScreen';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SecuritySettingsPage() {
    const { data: settings, isLoading } = useSecuritySettings();
    const { data: biometricAvailable } = useBiometricAvailability();
    const securityStatus = useSecurityStatus();
    const { data: securityLogs = [] } = useSecurityLogs(20);

    const [showPINSetup, setShowPINSetup] = useState(false);

    const updateMutation = useUpdateSecuritySettings();
    const disablePINMutation = useDisablePIN();
    const enrollBiometricMutation = useEnrollBiometric();
    const disableBiometricMutation = useDisableBiometric();

    if (isLoading) {
        return <div className="p-8">Loading security settings...</div>;
    }

    const handleTogglePIN = async () => {
        if (settings?.pin_enabled) {
            await disablePINMutation.mutateAsync();
        } else {
            setShowPINSetup(true);
        }
    };

    const handleToggleBiometric = async () => {
        if (settings?.biometric_enabled) {
            await disableBiometricMutation.mutateAsync();
        } else {
            await enrollBiometricMutation.mutateAsync();
        }
    };

    const handleUpdateSetting = async (key: string, value: any) => {
        await updateMutation.mutateAsync({ [key]: value } as any);
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Security & Privacy</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your security settings and protect your financial data
                </p>
            </div>

            {/* Security Score */}
            <Card className="border-2 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security Score
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Overall Security</span>
                                <span className="text-2xl font-bold text-primary">
                                    {securityStatus.securityScore}%
                                </span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${securityStatus.securityScore}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <SecurityFeatureStatus
                            icon={<Lock className="h-4 w-4" />}
                            label="PIN"
                            enabled={securityStatus.pinEnabled}
                        />
                        <SecurityFeatureStatus
                            icon={<Fingerprint className="h-4 w-4" />}
                            label="Biometric"
                            enabled={securityStatus.biometricEnabled}
                        />
                        <SecurityFeatureStatus
                            icon={<Clock className="h-4 w-4" />}
                            label="Auto-Logout"
                            enabled={securityStatus.autoLogoutEnabled}
                        />
                        <SecurityFeatureStatus
                            icon={<Eye className="h-4 w-4" />}
                            label="Data Masking"
                            enabled={securityStatus.dataMaskingEnabled}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* PIN Protection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        PIN Protection
                    </CardTitle>
                    <CardDescription>
                        Protect your app with a PIN code
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="pin-enabled">Enable PIN Protection</Label>
                            <p className="text-sm text-muted-foreground">
                                Require PIN to access the app
                            </p>
                        </div>
                        <Switch
                            id="pin-enabled"
                            checked={settings?.pin_enabled ?? false}
                            onCheckedChange={handleTogglePIN}
                        />
                    </div>

                    {settings?.pin_enabled && (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="pin-on-launch">Require PIN on Launch</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Ask for PIN every time app opens
                                    </p>
                                </div>
                                <Switch
                                    id="pin-on-launch"
                                    checked={settings?.require_pin_on_launch ?? false}
                                    onCheckedChange={(checked) =>
                                        handleUpdateSetting('require_pin_on_launch', checked)
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="lock-on-minimize">Lock on Minimize</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Lock app when minimized or switched away
                                    </p>
                                </div>
                                <Switch
                                    id="lock-on-minimize"
                                    checked={settings?.lock_on_minimize ?? false}
                                    onCheckedChange={(checked) =>
                                        handleUpdateSetting('lock_on_minimize', checked)
                                    }
                                />
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => setShowPINSetup(true)}
                            >
                                Change PIN
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Biometric Authentication */}
            {biometricAvailable && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Fingerprint className="h-5 w-5" />
                            Biometric Authentication
                        </CardTitle>
                        <CardDescription>
                            Use fingerprint or face recognition to unlock
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="biometric-enabled">Enable Biometric</Label>
                                <p className="text-sm text-muted-foreground">
                                    Use biometric authentication
                                </p>
                            </div>
                            <Switch
                                id="biometric-enabled"
                                checked={settings?.biometric_enabled ?? false}
                                onCheckedChange={handleToggleBiometric}
                            />
                        </div>

                        {settings?.biometric_enabled && (
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="biometric-on-launch">Require on Launch</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Prompt for biometric every time app opens
                                    </p>
                                </div>
                                <Switch
                                    id="biometric-on-launch"
                                    checked={settings?.require_biometric_on_launch ?? false}
                                    onCheckedChange={(checked) =>
                                        handleUpdateSetting('require_biometric_on_launch', checked)
                                    }
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Auto-Logout */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Auto-Logout
                    </CardTitle>
                    <CardDescription>
                        Automatically sign out after period of inactivity
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="auto-logout-enabled">Enable Auto-Logout</Label>
                            <p className="text-sm text-muted-foreground">
                                Logout automatically when inactive
                            </p>
                        </div>
                        <Switch
                            id="auto-logout-enabled"
                            checked={settings?.auto_logout_enabled ?? false}
                            onCheckedChange={(checked) =>
                                handleUpdateSetting('auto_logout_enabled', checked)
                            }
                        />
                    </div>

                    {settings?.auto_logout_enabled && (
                        <div className="space-y-2">
                            <Label htmlFor="auto-logout-minutes">Inactivity Timeout</Label>
                            <Select
                                value={settings?.auto_logout_minutes?.toString()}
                                onValueChange={(value) =>
                                    handleUpdateSetting('auto_logout_minutes', parseInt(value))
                                }
                            >
                                <SelectTrigger id="auto-logout-minutes">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 minutes</SelectItem>
                                    <SelectItem value="10">10 minutes</SelectItem>
                                    <SelectItem value="15">15 minutes</SelectItem>
                                    <SelectItem value="30">30 minutes</SelectItem>
                                    <SelectItem value="60">1 hour</SelectItem>
                                    <SelectItem value="120">2 hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Data Masking */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Data Masking
                    </CardTitle>
                    <CardDescription>
                        Hide sensitive information in the app
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="data-masking-enabled">Enable Data Masking</Label>
                            <p className="text-sm text-muted-foreground">
                                Master switch for all masking features
                            </p>
                        </div>
                        <Switch
                            id="data-masking-enabled"
                            checked={settings?.data_masking_enabled ?? false}
                            onCheckedChange={(checked) =>
                                handleUpdateSetting('data_masking_enabled', checked)
                            }
                        />
                    </div>

                    {settings?.data_masking_enabled && (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="mask-accounts">Mask Account Numbers</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Show only last 4 digits (e.g., ****1234)
                                    </p>
                                </div>
                                <Switch
                                    id="mask-accounts"
                                    checked={settings?.mask_account_numbers ?? false}
                                    onCheckedChange={(checked) =>
                                        handleUpdateSetting('mask_account_numbers', checked)
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="mask-cards">Mask Card Numbers</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Show only last 4 digits of cards
                                    </p>
                                </div>
                                <Switch
                                    id="mask-cards"
                                    checked={settings?.mask_card_numbers ?? false}
                                    onCheckedChange={(checked) =>
                                        handleUpdateSetting('mask_card_numbers', checked)
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="mask-amounts">Mask Amounts</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Hide monetary values (show as ***)
                                    </p>
                                </div>
                                <Switch
                                    id="mask-amounts"
                                    checked={settings?.mask_amounts ?? false}
                                    onCheckedChange={(checked) =>
                                        handleUpdateSetting('mask_amounts', checked)
                                    }
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Security Activity Log */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Security Activity
                    </CardTitle>
                    <CardDescription>
                        Recent security events and actions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {securityLogs.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No security activity yet
                            </p>
                        ) : (
                            securityLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 p-3 rounded-lg border"
                                >
                                    <div className={`mt-0.5 ${log.success ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {log.success ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            <XCircle className="h-4 w-4" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium truncate">
                                                {log.event_description || log.event_type}
                                            </p>
                                            <span className={`text-xs px-2 py-0.5 rounded ${log.risk_level === 'critical' ? 'bg-red-100 text-red-800' :
                                                    log.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        log.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                }`}>
                                                {log.risk_level}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(log.created_at), 'PPp')}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* PIN Setup Dialog */}
            <Dialog open={showPINSetup} onOpenChange={setShowPINSetup}>
                <DialogContent>
                    <PINSetup
                        onComplete={() => {
                            setShowPINSetup(false);
                            toast.success('PIN updated successfully');
                        }}
                        onCancel={() => setShowPINSetup(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper component for security feature status
function SecurityFeatureStatus({
    icon,
    label,
    enabled
}: {
    icon: React.ReactNode;
    label: string;
    enabled: boolean;
}) {
    return (
        <div className={`flex items-center gap-2 p-2 rounded-lg border ${enabled ? 'bg-green-50 border-green-200 dark:bg-green-950/20' : 'bg-muted'
            }`}>
            <div className={enabled ? 'text-green-600' : 'text-muted-foreground'}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{label}</p>
                <p className="text-xs text-muted-foreground">
                    {enabled ? 'Enabled' : 'Disabled'}
                </p>
            </div>
        </div>
    );
}
