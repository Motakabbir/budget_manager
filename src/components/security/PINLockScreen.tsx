/**
 * PIN Lock Screen Component
 * 
 * Full-screen overlay that requires PIN entry before accessing the app
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Fingerprint, AlertCircle } from 'lucide-react';
import { useVerifyPIN, useVerifyBiometric, useSecuritySettings, useBiometricAvailability } from '@/lib/hooks/use-security';
import { cn } from '@/lib/utils';

type PINLockScreenProps = {
    onUnlock: () => void;
    allowBiometric?: boolean;
};

export function PINLockScreen({ onUnlock, allowBiometric = true }: PINLockScreenProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    const { data: settings } = useSecuritySettings();
    const { data: biometricAvailable } = useBiometricAvailability();
    const verifyPINMutation = useVerifyPIN();
    const verifyBiometricMutation = useVerifyBiometric();

    const inputRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const pinLength = 4; // Can be made configurable

    useEffect(() => {
        // Auto-focus first input
        inputRefs.current[0]?.focus();
    }, []);

    const handleNumberClick = (num: number) => {
        if (pin.length < pinLength) {
            const newPin = pin + num;
            setPin(newPin);
            setError('');

            // Auto-submit when PIN is complete
            if (newPin.length === pinLength) {
                handleSubmit(newPin);
            }
        }
    };

    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    const handleSubmit = async (pinToVerify: string = pin) => {
        if (pinToVerify.length !== pinLength) {
            setError(`PIN must be ${pinLength} digits`);
            return;
        }

        const success = await verifyPINMutation.mutateAsync(pinToVerify);

        if (success) {
            onUnlock();
        } else {
            setError('Incorrect PIN');
            setPin('');
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        }
    };

    const handleBiometric = async () => {
        const success = await verifyBiometricMutation.mutateAsync();
        if (success) {
            onUnlock();
        }
    };

    const isLocked = settings?.pin_locked_until ? new Date(settings.pin_locked_until) > new Date() : false;
    const canUseBiometric = allowBiometric && biometricAvailable && settings?.biometric_enabled;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <Card className={cn(
                "w-full max-w-md mx-4",
                isShaking && "animate-shake"
            )}>
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-full bg-primary/10">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle>Enter PIN</CardTitle>
                    <CardDescription>
                        {isLocked
                            ? 'PIN locked due to too many attempts'
                            : 'Enter your PIN to access the app'
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* PIN Dots Display */}
                    <div className="flex justify-center gap-3">
                        {Array.from({ length: pinLength }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-4 h-4 rounded-full border-2 transition-all",
                                    i < pin.length
                                        ? "bg-primary border-primary"
                                        : "border-muted-foreground"
                                )}
                            />
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive justify-center">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Locked Message */}
                    {isLocked && (
                        <div className="text-sm text-center text-muted-foreground">
                            Try again in {Math.ceil((new Date(settings!.pin_locked_until!).getTime() - Date.now()) / 60000)} minutes
                        </div>
                    )}

                    {/* Number Pad */}
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <Button
                                key={num}
                                ref={(el) => { inputRefs.current[num - 1] = el; }}
                                variant="outline"
                                size="lg"
                                className="h-16 text-xl font-semibold"
                                onClick={() => handleNumberClick(num)}
                                disabled={isLocked || verifyPINMutation.isPending}
                            >
                                {num}
                            </Button>
                        ))}

                        {/* Biometric Button */}
                        {canUseBiometric ? (
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-16"
                                onClick={handleBiometric}
                                disabled={verifyBiometricMutation.isPending}
                            >
                                <Fingerprint className="h-6 w-6" />
                            </Button>
                        ) : (
                            <div className="h-16" />
                        )}

                        {/* Zero Button */}
                        <Button
                            ref={(el) => { inputRefs.current[9] = el; }}
                            variant="outline"
                            size="lg"
                            className="h-16 text-xl font-semibold"
                            onClick={() => handleNumberClick(0)}
                            disabled={isLocked || verifyPINMutation.isPending}
                        >
                            0
                        </Button>

                        {/* Backspace Button */}
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-16"
                            onClick={handleBackspace}
                            disabled={pin.length === 0 || isLocked}
                        >
                            ←
                        </Button>
                    </div>

                    {/* Loading State */}
                    {(verifyPINMutation.isPending || verifyBiometricMutation.isPending) && (
                        <div className="text-center text-sm text-muted-foreground">
                            Verifying...
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * PIN Setup Component
 * 
 * Guides user through setting up a new PIN
 */

type PINSetupProps = {
    onComplete: () => void;
    onCancel?: () => void;
};

export function PINSetup({ onComplete, onCancel }: PINSetupProps) {
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');

    const setupPINMutation = useVerifyPIN(); // Using mutation for setup

    const pinLength = 4;

    const handleNumberClick = (num: number) => {
        const currentPin = step === 'enter' ? pin : confirmPin;

        if (currentPin.length < pinLength) {
            const newPin = currentPin + num;

            if (step === 'enter') {
                setPin(newPin);
                if (newPin.length === pinLength) {
                    setTimeout(() => setStep('confirm'), 300);
                }
            } else {
                setConfirmPin(newPin);
                if (newPin.length === pinLength) {
                    handleSubmit(newPin);
                }
            }

            setError('');
        }
    };

    const handleBackspace = () => {
        if (step === 'enter') {
            setPin(pin.slice(0, -1));
        } else {
            setConfirmPin(confirmPin.slice(0, -1));
        }
        setError('');
    };

    const handleSubmit = async (confirmPinValue: string) => {
        if (pin !== confirmPinValue) {
            setError('PINs do not match');
            setConfirmPin('');
            setTimeout(() => setStep('enter'), 1000);
            setTimeout(() => {
                setPin('');
                setError('');
            }, 1500);
            return;
        }

        // Setup PIN using the service
        const { setupPIN } = await import('@/lib/services/security.service');
        const success = await setupPIN(pin);

        if (success) {
            onComplete();
        }
    };

    const currentPin = step === 'enter' ? pin : confirmPin;

    return (
        <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-primary/10">
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle>
                    {step === 'enter' ? 'Create PIN' : 'Confirm PIN'}
                </CardTitle>
                <CardDescription>
                    {step === 'enter'
                        ? `Enter a ${pinLength}-digit PIN`
                        : 'Enter your PIN again to confirm'
                    }
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* PIN Dots Display */}
                <div className="flex justify-center gap-3">
                    {Array.from({ length: pinLength }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-4 h-4 rounded-full border-2 transition-all",
                                i < currentPin.length
                                    ? "bg-primary border-primary"
                                    : "border-muted-foreground"
                            )}
                        />
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive justify-center">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <Button
                            key={num}
                            variant="outline"
                            size="lg"
                            className="h-16 text-xl font-semibold"
                            onClick={() => handleNumberClick(num)}
                        >
                            {num}
                        </Button>
                    ))}

                    <div className="h-16" />

                    <Button
                        variant="outline"
                        size="lg"
                        className="h-16 text-xl font-semibold"
                        onClick={() => handleNumberClick(0)}
                    >
                        0
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        className="h-16"
                        onClick={handleBackspace}
                        disabled={currentPin.length === 0}
                    >
                        ←
                    </Button>
                </div>

                {onCancel && (
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
