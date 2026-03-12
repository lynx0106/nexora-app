/**
 * Tests para ToastProvider
 */
import { render, screen, act, waitFor } from '@testing-library/react';
import ToastProvider from '@/components/ToastProvider';
import { showToast } from '@/lib/toast';

describe('ToastProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debe renderizar el contenedor de toasts', () => {
    render(<ToastProvider />);
    const layer = document.querySelector('.ds-toast-layer');
    expect(layer).toBeInTheDocument();
    expect(layer).toHaveAttribute('aria-live', 'polite');
  });

  it('debe mostrar toast cuando se despacha evento nexora:toast', async () => {
    render(<ToastProvider />);
    await act(async () => {
      showToast('Mensaje de prueba', 'error');
    });

    await waitFor(() => {
      expect(screen.getByText('Mensaje de prueba')).toBeInTheDocument();
    });
    expect(document.querySelector('.ds-toast-error')).toBeInTheDocument();
  });

  it('debe eliminar toast después de 5 segundos', async () => {
    render(<ToastProvider />);
    await act(async () => {
      showToast('Toast temporal', 'success');
    });

    await waitFor(() => {
      expect(screen.getByText('Toast temporal')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.queryByText('Toast temporal')).not.toBeInTheDocument();
  });
});
