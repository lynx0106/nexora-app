import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import apiClient from '../api/client';

/** Token registrado localmente para poder hacer unregister en logout */
let lastRegisteredToken: string | null = null;

/**
 * Solicita permisos, obtiene el token Expo Push y lo registra en el backend.
 * Llamar tras login/register exitoso.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) console.log('[Push] No es dispositivo físico, skipping');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      if (__DEV__) console.log('[Push] Permiso denegado');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    if (!token) return null;

    await apiClient.post('/push/register', {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });

    lastRegisteredToken = token;
    if (__DEV__) console.log('[Push] Token registrado');
    return token;
  } catch (error) {
    if (__DEV__) console.error('[Push] Error registrando:', error);
    return null;
  }
}

/**
 * Desregistra el token en el backend. Llamar en logout.
 */
export async function unregisterPushToken(): Promise<void> {
  const token = lastRegisteredToken;
  lastRegisteredToken = null;

  if (!token) return;

  try {
    await apiClient.post('/push/unregister', { token });
    if (__DEV__) console.log('[Push] Token desregistrado');
  } catch (error) {
    if (__DEV__) console.error('[Push] Error desregistrando:', error);
  }
}
