export type ToastType = 'error' | 'success' | 'info';

export function showToast(message: string, type: ToastType = 'error') {
  if (typeof window === 'undefined') return;

  const event = new CustomEvent('nexora:toast', {
    detail: { message, type },
  });

  window.dispatchEvent(event);
}
