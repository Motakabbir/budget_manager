import { z } from 'zod';

export const transactionSchema = z.object({
    category_id: z.string().uuid('Please select a valid category'),
    amount: z.coerce
        .number()
        .positive('Amount must be positive')
        .max(999999999, 'Amount is too large'),
    description: z.string().max(500, 'Description is too long').optional().nullable(),
    date: z.date(),
    type: z.enum(['income', 'expense']),
});

export const categorySchema = z.object({
    name: z
        .string()
        .min(1, 'Category name is required')
        .max(50, 'Category name is too long')
        .trim(),
    type: z.enum(['income', 'expense']),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    icon: z.string().max(10).nullable().optional(),
});

export const savingsGoalSchema = z.object({
    name: z
        .string()
        .min(1, 'Goal name is required')
        .max(100, 'Goal name is too long')
        .trim(),
    target_amount: z.coerce
        .number()
        .positive('Target amount must be positive')
        .max(999999999, 'Target amount is too large'),
    deadline: z.date().optional().nullable(),
});

export const categoryBudgetSchema = z.object({
    category_id: z.string().uuid('Please select a valid category'),
    amount: z.coerce
        .number()
        .positive('Budget amount must be positive')
        .max(999999999, 'Budget amount is too large'),
    period: z.enum(['monthly', 'yearly']),
});

export const userSettingsSchema = z.object({
    opening_balance: z.coerce.number(),
    opening_date: z.date(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>;
export type CategoryBudgetInput = z.infer<typeof categoryBudgetSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
