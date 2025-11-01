import { driver, DriveStep, Config } from 'driver.js';
import 'driver.js/dist/driver.css';
import { supabase } from '@/lib/supabase/client';

/**
 * User Tour Service
 * 
 * Provides interactive first-time user tour using driver.js
 * Features:
 * - Step-by-step guided tour
 * - Highlights key features
 * - Stores completion status
 * - Can be restarted anytime
 */

export interface TourStep extends DriveStep {
    element?: string;
    popover?: {
        title: string;
        description: string;
        side?: 'top' | 'right' | 'bottom' | 'left';
        align?: 'start' | 'center' | 'end';
    };
}

export interface UserTourPreferences {
    tour_completed: boolean;
    tour_completed_at?: string;
    tour_version: string;
    tours_viewed: string[];
}

const TOUR_VERSION = '1.0.0';

/**
 * Main application tour steps
 */
const mainTourSteps: TourStep[] = [
    {
        element: '[data-tour="dashboard"]',
        popover: {
            title: 'Welcome to Budget Manager! 👋',
            description: 'Let\'s take a quick tour of the key features to help you get started. This tour will only take 2 minutes.',
            side: 'bottom',
            align: 'start',
        },
    },
    {
        element: '[data-tour="quick-add"]',
        popover: {
            title: 'Quick Add Transaction 💰',
            description: 'Quickly add income or expenses with one click. This is the fastest way to track your finances.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '[data-tour="notifications"]',
        popover: {
            title: 'Smart Notifications 🔔',
            description: 'Get AI-powered alerts for unusual spending, budget warnings, bill reminders, and more.',
            side: 'bottom',
            align: 'end',
        },
    },
    {
        element: '[data-tour="nav-budgets"]',
        popover: {
            title: 'Budget Management 📊',
            description: 'Create and track budgets for different categories. Set limits and get alerts when you\'re close to exceeding them.',
            side: 'right',
            align: 'start',
        },
    },
    {
        element: '[data-tour="nav-goals"]',
        popover: {
            title: 'Financial Goals 🎯',
            description: 'Set savings goals, track milestones, and monitor your progress toward financial objectives.',
            side: 'right',
            align: 'start',
        },
    },
    {
        element: '[data-tour="nav-reports"]',
        popover: {
            title: 'Reports & Analytics 📈',
            description: 'View comprehensive financial reports including income statements, balance sheets, and spending patterns.',
            side: 'right',
            align: 'start',
        },
    },
    {
        element: '[data-tour="nav-accounts"]',
        popover: {
            title: 'Bank Accounts 🏦',
            description: 'Manage multiple bank accounts, track balances, and view transaction history.',
            side: 'right',
            align: 'start',
        },
    },
    {
        element: '[data-tour="search"]',
        popover: {
            title: 'Quick Search 🔍',
            description: 'Search transactions, categories, and accounts instantly from anywhere in the app.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        popover: {
            title: 'You\'re All Set! 🎉',
            description: 'You can restart this tour anytime from Settings > Help. Now let\'s start managing your finances!',
        },
    },
];

/**
 * Budget-specific tour steps
 */
const budgetTourSteps: TourStep[] = [
    {
        element: '[data-tour="create-budget"]',
        popover: {
            title: 'Create Your First Budget',
            description: 'Click here to create a budget for any category. Set monthly limits and track your spending.',
            side: 'left',
            align: 'start',
        },
    },
    {
        element: '[data-tour="budget-alerts"]',
        popover: {
            title: 'Budget Alerts',
            description: 'You\'ll receive notifications when you reach 80%, 90%, and 100% of your budget limit.',
            side: 'bottom',
            align: 'center',
        },
    },
];

/**
 * Goals-specific tour steps
 */
const goalsTourSteps: TourStep[] = [
    {
        element: '[data-tour="create-goal"]',
        popover: {
            title: 'Set Financial Goals',
            description: 'Create goals for savings, debt payoff, emergency fund, and more.',
            side: 'left',
            align: 'start',
        },
    },
    {
        element: '[data-tour="goal-progress"]',
        popover: {
            title: 'Track Progress',
            description: 'Monitor your progress with visual indicators and milestone tracking.',
            side: 'top',
            align: 'center',
        },
    },
];

/**
 * Driver.js configuration
 */
const driverConfig: Config = {
    showProgress: true,
    showButtons: ['next', 'previous', 'close'],
    steps: mainTourSteps,
    nextBtnText: 'Next →',
    prevBtnText: '← Previous',
    doneBtnText: 'Get Started! 🚀',
    progressText: '{{current}} of {{total}}',
    popoverClass: 'tour-popover',
    animate: true,
    overlayOpacity: 0.7,
    allowClose: true,
    allowKeyboardControl: true,
};

/**
 * Create and configure driver instance
 */
export const createTourDriver = (steps: TourStep[] = mainTourSteps, config?: Partial<Config>) => {
    return driver({
        ...driverConfig,
        steps,
        ...config,
    });
};

/**
 * Check if user has completed the tour
 */
export const hasCompletedTour = async (tourName: string = 'main'): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data, error } = await supabase
            .from('user_preferences')
            .select('tour_completed, tours_viewed, tour_version')
            .eq('user_id', user.id)
            .maybeSingle(); // Use maybeSingle to handle no rows gracefully

        if (error) {
            console.error('Error checking tour status:', error);
            return false;
        }

        if (!data) {
            // No preferences record exists yet
            return false;
        }

        // Check if current tour version matches
        if (data.tour_version !== TOUR_VERSION) {
            return false;
        }

        // Check if specific tour was viewed
        if (tourName !== 'main') {
            return data.tours_viewed?.includes(tourName) || false;
        }

        return data.tour_completed || false;
    } catch (error) {
        console.error('Error checking tour status:', error);
        return false;
    }
};

/**
 * Save tour completion status
 */
export const saveTourCompletion = async (tourName: string = 'main'): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('No authenticated user found');
            return;
        }

        // Get existing preferences
        const { data: existing, error: fetchError } = await supabase
            .from('user_preferences')
            .select('tours_viewed, tour_completed')
            .eq('user_id', user.id)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching preferences:', fetchError);
        }

        const toursViewed = existing?.tours_viewed || [];
        if (!toursViewed.includes(tourName)) {
            toursViewed.push(tourName);
        }

        const updates: Record<string, any> = {
            tours_viewed: toursViewed,
            tour_version: TOUR_VERSION,
            updated_at: new Date().toISOString(),
        };

        if (tourName === 'main') {
            updates.tour_completed = true;
            updates.tour_completed_at = new Date().toISOString();
        }

        if (existing) {
            // Update existing record
            const { error: updateError } = await supabase
                .from('user_preferences')
                .update(updates)
                .eq('user_id', user.id);

            if (updateError) {
                console.error('Error updating tour status:', updateError);
            } else {
                console.log(`Tour ${tourName} completion saved successfully`);
            }
        } else {
            // Try to insert new record, but handle race condition with trigger
            const { error: insertError } = await supabase
                .from('user_preferences')
                .insert({
                    user_id: user.id,
                    ...updates,
                });

            if (insertError) {
                // If we get a duplicate key error, it means the trigger created it
                // So retry with an update instead
                if (insertError.code === '23505') {
                    console.log('Record exists (created by trigger), retrying with update...');
                    const { error: retryError } = await supabase
                        .from('user_preferences')
                        .update(updates)
                        .eq('user_id', user.id);
                    
                    if (retryError) {
                        console.error('Error on retry update:', retryError);
                    } else {
                        console.log(`Tour ${tourName} completion saved successfully (retry)`);
                    }
                } else {
                    console.error('Error inserting tour status:', insertError);
                }
            } else {
                console.log(`Tour ${tourName} completion saved successfully (insert)`);
            }
        }
    } catch (error) {
        console.error('Error saving tour completion:', error);
    }
};

/**
 * Reset tour status (for "Restart Tour" feature)
 */
export const resetTour = async (): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase
            .from('user_preferences')
            .update({
                tour_completed: false,
                tours_viewed: [],
                tour_version: TOUR_VERSION,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
    } catch (error) {
        console.error('Error resetting tour:', error);
    }
};

/**
 * Start the main application tour
 */
export const startMainTour = () => {
    const tourDriver = createTourDriver(mainTourSteps, {
        onDestroyStarted: async (element, step, options) => {
            // Get current step index
            const state = (options as any)?.state;
            const currentStepIndex = state?.activeIndex ?? 0;
            const totalSteps = mainTourSteps.length;
            
            // Save completion only if on last step (clicked "Get Started!")
            if (currentStepIndex >= totalSteps - 1) {
                console.log('Tour completed, saving...');
                await saveTourCompletion('main');
            } else {
                console.log('Tour closed early at step', currentStepIndex + 1);
            }
        },
        onDestroyed: (element, step) => {
            console.log('Tour ended');
        },
    });
    
    // Start the tour
    tourDriver.drive();
    return tourDriver;
};

/**
 * Start budget-specific tour
 */
export const startBudgetTour = () => {
    const tourDriver = createTourDriver(budgetTourSteps, {
        onDestroyStarted: async () => {
            await saveTourCompletion('budget');
        },
    });
    tourDriver.drive();
    return tourDriver;
};

/**
 * Start goals-specific tour
 */
export const startGoalsTour = () => {
    const tourDriver = createTourDriver(goalsTourSteps, {
        onDestroyStarted: async () => {
            await saveTourCompletion('goals');
        },
    });
    tourDriver.drive();
    return tourDriver;
};

/**
 * Auto-start tour for first-time users
 */
export const autoStartTourIfNeeded = async (): Promise<void> => {
    try {
        const completed = await hasCompletedTour('main');
        console.log('Tour completion status:', completed);
        
        if (!completed) {
            console.log('Starting tour for first-time user...');
            // Delay to ensure DOM is ready
            setTimeout(() => {
                startMainTour();
            }, 1500);
        } else {
            console.log('Tour already completed, skipping auto-start');
        }
    } catch (error) {
        console.error('Error checking tour status:', error);
    }
};
