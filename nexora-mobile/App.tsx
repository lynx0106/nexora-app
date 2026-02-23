import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Linking, AppState, AppStateStatus } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { CartProvider } from './src/context/CartContext';
import { ChatProvider } from './src/context/ChatContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import invitationsApi from './src/api/invitations.api';

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Manejar deep links
  const handleDeepLink = async (url: string | null) => {
    if (!url) return;

    console.log('Deep link recibido:', url);

    // Parsear el deep link
    const inviteParams = invitationsApi.parseDeepLink(url);
    
    if (inviteParams) {
      console.log('Parámetros de invitación:', inviteParams);
      
      // Navegar a la pantalla de registro con invitación
      // Esperar un poco para que la navegación esté lista
      setTimeout(() => {
        if (navigationRef.current) {
          navigationRef.current.navigate('Auth', {
            screen: 'InviteRegister',
            params: inviteParams,
          });
        }
      }, 500);
    }
  };

  useEffect(() => {
    // Manejar deep link inicial (si la app se abrió desde un link)
    Linking.getInitialURL().then(handleDeepLink);

    // Escuchar deep links mientras la app está corriendo
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Escuchar cambios de estado de la app
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // La app volvió a primer plano, verificar si hay un link pendiente
        Linking.getInitialURL().then(handleDeepLink);
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <ChatProvider>
            <FavoritesProvider>
              <CartProvider>
                <AppNavigator ref={navigationRef} />
              </CartProvider>
            </FavoritesProvider>
          </ChatProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
