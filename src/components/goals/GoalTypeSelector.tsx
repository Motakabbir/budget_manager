import { Button } from '@/components/ui/button';
import {
    PiggyBank, Shield, Plane, Home, TrendingUp, Target,
    Car, GraduationCap, Heart, LineChart
} from 'lucide-react';
import { FinancialGoalsService, type GoalTypeInfo } from '@/lib/services/financial-goals.service';
import { cn } from '@/lib/utils';

interface GoalTypeSelectorProps {
    selectedType: string | null;
    onSelect: (type: string) => void;
}

const goalIcons = {
    PiggyBank,
    Shield,
    Plane,
    Home,
    TrendingUp,
    Target,
    Car,
    GraduationCap,
    Heart,
    LineChart,
};

export function GoalTypeSelector({ selectedType, onSelect }: GoalTypeSelectorProps) {
    const goalTypes = FinancialGoalsService.getAllGoalTypes();

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {goalTypes.map((goalType) => {
                const Icon = goalIcons[goalType.icon as keyof typeof goalIcons] || PiggyBank;
                const isSelected = selectedType === goalType.type;

                return (
                    <Button
                        key={goalType.type}
                        variant="outline"
                        className={cn(
                            "h-auto flex-col gap-2 p-4 transition-all",
                            isSelected && "border-2 shadow-md"
                        )}
                        style={{
                            borderColor: isSelected ? goalType.color : undefined,
                            backgroundColor: isSelected ? `${goalType.color}10` : undefined,
                        }}
                        onClick={() => onSelect(goalType.type)}
                    >
                        <div
                            className="p-3 rounded-full"
                            style={{ backgroundColor: `${goalType.color}20` }}
                        >
                            <Icon className="h-6 w-6" style={{ color: goalType.color }} />
                        </div>
                        <span className="text-sm font-medium text-center leading-tight">
                            {goalType.label}
                        </span>
                    </Button>
                );
            })}
        </div>
    );
}
