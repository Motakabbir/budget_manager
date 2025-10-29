import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
    describe('cn (classnames helper)', () => {
        it('merges class names correctly', () => {
            const result = cn('text-red-500', 'bg-blue-500');
            expect(result).toContain('text-red-500');
            expect(result).toContain('bg-blue-500');
        });

        it('handles conditional classes', () => {
            const isActive = true;
            const result = cn('base-class', isActive && 'active-class');
            expect(result).toContain('base-class');
            expect(result).toContain('active-class');
        });

        it('removes falsy values', () => {
            const result = cn('valid', false, null, undefined, 'another-valid');
            expect(result).toContain('valid');
            expect(result).toContain('another-valid');
            expect(result).not.toContain('false');
        });

        it('handles Tailwind merge conflicts', () => {
            const result = cn('p-4', 'p-8');
            // tailwind-merge should keep only the last padding class
            expect(result).toBe('p-8');
        });
    });
});
