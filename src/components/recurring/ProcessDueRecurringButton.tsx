import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRecurringAutoProcess } from '@/lib/hooks/use-recurring-auto-process';

export function ProcessDueRecurringButton() {
    const [isProcessing, setIsProcessing] = useState(false);
    const { processRecurring } = useRecurringAutoProcess();

    const handleProcess = async () => {
        setIsProcessing(true);
        try {
            await processRecurring(false); // Not silent - show toast
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleProcess}
            disabled={isProcessing}
            className="gap-2"
        >
            {isProcessing ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : (
                <>
                    <Play className="h-4 w-4" />
                    Process Due Now
                </>
            )}
        </Button>
    );
}
