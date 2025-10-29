import { vi } from 'vitest';

export const mockSupabaseClient = {
    auth: {
        getUser: vi.fn().mockResolvedValue({
            data: {
                user: {
                    id: 'test-user-id',
                    email: 'test@example.com',
                },
            },
            error: null,
        }),
        getSession: vi.fn().mockResolvedValue({
            data: {
                session: {
                    user: {
                        id: 'test-user-id',
                        email: 'test@example.com',
                    },
                },
            },
            error: null,
        }),
        onAuthStateChange: vi.fn().mockReturnValue({
            data: {
                subscription: {
                    unsubscribe: vi.fn(),
                },
            },
        }),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
};

// Mock the supabase client module
vi.mock('@/lib/supabase/client', () => ({
    supabase: mockSupabaseClient,
}));
