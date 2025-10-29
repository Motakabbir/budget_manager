import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button Component', () => {
    it('renders with children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('handles click events', async () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);

        const button = screen.getByText('Click me');
        await userEvent.click(button);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies variant classes correctly', () => {
        const { container } = render(<Button variant="destructive">Delete</Button>);
        const button = container.querySelector('button');
        expect(button).toHaveClass('bg-destructive');
    });

    it('can be disabled', () => {
        render(<Button disabled>Disabled</Button>);
        const button = screen.getByText('Disabled');
        expect(button).toBeDisabled();
    });
});
