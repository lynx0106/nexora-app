/**
 * Tests para EmptyState
 */
import { render, screen } from '@testing-library/react';
import EmptyState from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('debe renderizar el título', () => {
    render(<EmptyState titulo="Sin resultados" />);
    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
  });

  it('debe renderizar descripción cuando se proporciona', () => {
    render(
      <EmptyState
        titulo="Lista vacía"
        descripcion="No hay elementos para mostrar"
      />
    );
    expect(screen.getByText('Lista vacía')).toBeInTheDocument();
    expect(screen.getByText('No hay elementos para mostrar')).toBeInTheDocument();
  });

  it('no debe renderizar descripción cuando no se proporciona', () => {
    const { container } = render(<EmptyState titulo="Solo título" />);
    expect(screen.getByText('Solo título')).toBeInTheDocument();
    expect(container.querySelector('p')).toBeNull();
  });
});
