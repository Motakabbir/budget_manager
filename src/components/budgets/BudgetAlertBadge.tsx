import { useBudgetAlertsCount } from '@/lib/hooks/use-budget-alerts';
import { Badge } from '@/components/ui/badge';

/**
 * Small badge to show budget alert count
 * Can be used in sidebar or anywhere to indicate budget issues
 */
export function BudgetAlertBadge() {
    const { totalCount } = useBudgetAlertsCount();

    if (totalCount === 0) return null;

    return (
        <Badge 
            variant="destructive" 
            className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
        >
            {totalCount > 9 ? '9+' : totalCount}
        </Badge>
    );
}
