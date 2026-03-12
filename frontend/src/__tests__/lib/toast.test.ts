/**
 * Tests para showToast
 */
import { showToast } from '@/lib/toast';

describe('showToast', () => {
  let dispatchSpy: jest.SpyInstance;

  beforeEach(() => {
    dispatchSpy = jest.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    dispatchSpy.mockRestore();
  });

  it('debe despachar CustomEvent nexora:toast con message y type', () => {
    showToast('Test message', 'error');

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe('nexora:toast');
    expect(event.detail).toEqual({ message: 'Test message', type: 'error' });
  });

  it('debe usar error como type por defecto', () => {
    showToast('Mensaje sin tipo');

    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.detail.type).toBe('error');
  });

  it('debe aceptar success e info como tipos', () => {
    showToast('Éxito', 'success');
    expect((dispatchSpy.mock.calls[0][0] as CustomEvent).detail.type).toBe('success');

    showToast('Info', 'info');
    expect((dispatchSpy.mock.calls[1][0] as CustomEvent).detail.type).toBe('info');
  });
});
