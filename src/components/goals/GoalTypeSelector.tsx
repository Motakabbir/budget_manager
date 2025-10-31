import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GoalTypeConfig } from '@/lib/supabase/database.types';
import { GOAL_TYPE_CONFIGS } from '@/lib/hooks/useGoalAnalytics';
import {
    Shield,
    Plane,
    Home,
    PiggyBank,
    CreditCard,
    Car,
    Target,
    CheckCircle
} from 'lucide-react';

interface GoalTypeSelectorProps {
    selectedType: string;
    onTypeSelect: (type: string) => void;
    showRecommendations?: boolean;
}

const iconMap = {
    Shield,
    Plane,
    Home,
    PiggyBank,
    CreditCard,
    Car,
    Target,
    CheckCircle
};

export function GoalTypeSelector({ selectedType, onTypeSelect, showRecommendations = true }: GoalTypeSelectorProps) {
    const configs = Object.values(GOAL_TYPE_CONFIGS);

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold mb-2">Choose Goal Type</h3>
                <p className="text-sm text-muted-foreground">
                    Select a predefined goal type or create a custom goal
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configs.map((config) => {
                    const Icon = iconMap[config.icon as keyof typeof iconMap] || Target;
                    const isSelected = selectedType === config.type;

                    return (
                        <Card
                            key={config.type}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                                isSelected
                                    ? 'ring-2 ring-primary border-primary'
                                    : 'hover:border-primary/50'
                            }`}
                            onClick={() => onTypeSelect(config.type)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                    <div className={`p-2 rounded-lg ${
                                        isSelected
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                    }`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-medium text-sm">{config.label}</h4>
                                            {showRecommendations && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Priority {config.priority}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            {config.description}
                                        </p>
                                        {showRecommendations && (
                                            <div className="text-xs text-muted-foreground">
                                                <div>Target: ${config.default_target_amount.toLocaleString()}</div>
                                                <div>Timeframe: {config.recommended_timeframe_months} months</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {selectedType && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                        {React.createElement(iconMap[GOAL_TYPE_CONFIGS[selectedType]?.icon as keyof typeof iconMap] || Target, {
                            className: "h-5 w-5 text-primary"
                        })}
                        <span className="font-medium">{GOAL_TYPE_CONFIGS[selectedType]?.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {GOAL_TYPE_CONFIGS[selectedType]?.description}
                    </p>
                    {showRecommendations && (
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Recommended Target:</span>
                                <div className="font-medium">
                                    ${GOAL_TYPE_CONFIGS[selectedType]?.default_target_amount.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Suggested Timeframe:</span>
                                <div className="font-medium">
                                    {GOAL_TYPE_CONFIGS[selectedType]?.recommended_timeframe_months} months
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

interface GoalTypeCardProps {
    config: GoalTypeConfig;
    isSelected: boolean;
    onClick: () => void;
    showStats?: boolean;
    goalCount?: number;
}

export function GoalTypeCard({ config, isSelected, onClick, showStats = false, goalCount }: GoalTypeCardProps) {
    const Icon = iconMap[config.icon as keyof typeof iconMap] || Target;

    return (
        <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'hover:border-primary/50'
            }`}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                        isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                    }`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-medium text-sm">{config.label}</h4>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                        {showStats && goalCount !== undefined && (
                            <div className="mt-1">
                                <Badge variant="outline" className="text-xs">
                                    {goalCount} goal{goalCount !== 1 ? 's' : ''}
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}