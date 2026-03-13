# Configuración de Notificaciones Push — Nexora App

**Fecha:** 12 de marzo de 2026  
**Referencia:** docs/PLAN_SOLUCION_GAPS_NEXORA.md (Gap 3)

---

## 1. Estado actual

| Componente | Estado | Notas |
|------------|--------|-------|
| Backend `POST /push/register` | ✅ Operativo | Requiere JWT. Registra token Expo por usuario |
| Backend `POST /push/unregister` | ✅ Operativo | Elimina token |
| Backend `POST /push/test` | ✅ Operativo | Envía notificación de prueba al usuario autenticado |
| Backend `GET /push/tokens/:userId` | ✅ Operativo | Cuenta tokens registrados |
| App Móvil (nexora-mobile) | ⚠️ Por integrar | Debe obtener token Expo y llamar a `/push/register` |
| Web (Next.js) | ❌ No implementado | Requeriría VAPID + Service Worker (futuro) |

El backend usa **Expo Push API** (`https://exp.host/--/api/v2/push/send`), compatible con tokens en formato `ExponentPushToken[...]`. No requiere VAPID keys.

---

## 2. Configuración Backend

### Variables de entorno

No se requieren variables adicionales para el módulo push. La Expo Push API permite envío gratuito con tokens válidos.

### Endpoints (requieren `Authorization: Bearer <token>`)

```http
POST /push/register
Content-Type: application/json
Body: { "token": "ExponentPushToken[xxx]", "platform": "ios" | "android" | "web" }

POST /push/unregister
Body: { "token": "ExponentPushToken[xxx]" }

POST /push/test
# Envía notificación de prueba al usuario autenticado

GET /push/tokens/:userId
# Devuelve { "count": N }
```

---

## 3. App Móvil (nexora-mobile)

### Dependencias

```bash
npx expo install expo-notifications expo-device
```

### Obtener token y registrar

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import apiClient from './api/client';

async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data; // ExponentPushToken[xxx]

  await apiClient.post('/push/register', {
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
  });

  return token;
}
```

### Variable de entorno

En `.env` o `app.config.js`:

```
EXPO_PUBLIC_API_URL=https://nexora-app-production-3104.up.railway.app
```

---

## 4. Web (Next.js) — Futuro

Para push en navegador se necesitaría:

1. **VAPID keys:** `npx web-push generate-vapid-keys`
2. **Service Worker** en `public/sw.js` para manejar `push` events
3. **Backend:** Añadir soporte para suscripciones Web Push (formato distinto a Expo)
4. **Variables:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` en Railway

Estimación: 4-6 h.

---

## 5. Pruebas

1. Autenticarse en la app móvil o con `curl` usando un JWT válido.
2. Registrar token: `POST /push/register` con cuerpo indicado.
3. Enviar prueba: `POST /push/test` (mismo token de auth).
4. Verificar que llega la notificación en el dispositivo.

---

## 6. Checklist

- [x] nexora-mobile: Integrar `expo-notifications` y llamar a `/push/register` tras login
- [x] nexora-mobile: Solicitar permiso al usuario en primera sesión
- [ ] Web: Evaluar prioridad de push en navegador
- [x] Logout: Llamar a `/push/unregister` con el token actual

---

*Documento generado como parte del plan de solución de gaps.*
