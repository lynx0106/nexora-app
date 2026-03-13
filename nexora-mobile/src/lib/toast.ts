import Toast from 'react-native-toast-message';

export type ToastType = 'success' | 'error' | 'info';

export function showToast(message: string, type: ToastType = 'error'): void {
  Toast.show({
    type,
    text1: type === 'error' ? 'Error' : type === 'success' ? 'Éxito' : 'Info',
    text2: message,
    visibilityTime: 3500,
  });
}
