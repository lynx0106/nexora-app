/**
 * Tests para Skeleton
 */
import { render, screen } from '@testing-library/react';
import Skeleton from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('debe renderizar con clase ds-skeleton', () => {
    const { container } = render(<Skeleton />);
    const el = container.querySelector('.ds-skeleton');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('ds-skeleton');
  });

  it('debe aplicar className adicional', () => {
    const { container } = render(<Skeleton className="h-10 w-1/2" />);
    const el = container.querySelector('.ds-skeleton');
    expect(el).toHaveClass('h-10', 'w-1/2');
  });
});
