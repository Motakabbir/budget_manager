import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EnhancedGoalDialog } from '@/components/goals/EnhancedGoalDialog';
import { useAddSavingsGoal } from '@/lib/hooks/use-budget-queries';
import { SavingsGoalInput } from '@/lib/validations/schemas';
import { Database } from '@/lib/supabase/database.types';
import { toast } from 'sonner';

export function GoalsPage() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const createGoalMutation = useAddSavingsGoal();

    const handleCreateGoal = async (goalData: Database['public']['Tables']['savings_goals']['Insert']) => {
        try {
            // Convert to the expected input format (basic fields only for now)
            const input: Omit<SavingsGoalInput, 'deadline'> & { deadline: string | null } = {
                name: goalData.name,
                target_amount: goalData.target_amount,
                deadline: goalData.target_date || null,
            };

            await createGoalMutation.mutateAsync(input);
            toast.success('Savings goal created successfully!');
            setDialogOpen(false);
        } catch {
            toast.error('Failed to create savings goal. Please try again.');
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Savings Goals</h1>
                <Button onClick={() => setDialogOpen(true)}>
                    Create New Goal
                </Button>
            </div>

            {/* Your existing goals list/grid would go here */}
            <div className="text-center text-muted-foreground py-12">
                <p>No savings goals yet. Create your first goal to get started!</p>
            </div>

            <EnhancedGoalDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleCreateGoal}
            />
        </div>
    );
}