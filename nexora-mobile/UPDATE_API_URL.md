# Actualizar URL del Backend

Este documento explica cómo cambiar la URL del backend API sin necesidad de modificar el código fuente.

## 🚀 Método 1: Variables de Entorno (Recomendado)

### Paso 1: Crear archivo .env.local

```bash
cd nexora-mobile
cp .env.example .env.local
```

### Paso 2: Editar .env.local

```env
EXPO_PUBLIC_API_URL=https://nexora-app-production-3104.up.railway.app
API_URL=https://nexora-app-production-3104.up.railway.app
```

### Paso 3: Recompilar la app

```bash
# Para desarrollo con Expo Go
npx expo start

# Para build de producción
npx expo build:android
# o
npx expo build:ios
```

## 🔧 Método 2: Modificar Configuración Directa

Si necesitas cambiar la URL de forma permanente en el código:

1. Edita `src/config/api.config.ts`
2. Cambia `DEFAULT_API_URL`
3. Recompila la app

```typescript
const DEFAULT_API_URL = 'https://tu-nueva-url.up.railway.app';
```

## 📱 Método 3: Expo EAS Build (Producción)

Si usas EAS Build, configura las variables en el dashboard:

1. Ve a https://expo.dev
2. Selecciona tu proyecto
3. Project Settings → Secrets
4. Agrega `EXPO_PUBLIC_API_URL`
5. Genera nuevo build:

```bash
eas build --platform android
# o
eas build --platform ios
```

## ✅ Verificación

Para verificar que la URL está correcta:

1. Abre la app
2. Revisa los logs en consola:
   ```
   🔗 API_URL configurada: https://nexora-app-production-3104.up.railway.app
   ```

## 🐛 Solución de Problemas

### "No se conecta al backend"

1. Verifica que la URL sea correcta (sin `/` al final)
2. Verifica CORS esté configurado en backend
3. Verifica que el backend esté online

### "Variable de entorno no funciona"

1. Asegúrate de que la variable comience con `EXPO_PUBLIC_`
2. Reinicia el servidor de Expo: `npx expo start --clear`
3. Limpia caché: `npx expo start --reset-cache`
