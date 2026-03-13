# Diagnóstico App Móvil Nexora — Seguridad, Usabilidad y UI/UX

**Fecha:** 12 de marzo de 2026  
**Proyecto:** nexora-mobile (Expo 52, React Native 0.76)  
**Referencia:** PLAN_APP_MOVIL.md

---

## 1. Resumen Ejecutivo

| Área | Estado | Puntuación estimada |
|------|--------|---------------------|
| Seguridad | ⚠️ Crítico | 65/100 |
| Usabilidad | ⚠️ Mejorable | 75/100 |
| UI/UX | ⚠️ Inconsistente | 72/100 |

La app móvil tiene la arquitectura y flujos principales implementados (auth, productos, pedidos, chat, citas, dashboard), pero presenta **gaps críticos de seguridad** (URLs incorrectas, console.log) y **inconsistencias** respecto a la web (tema light vs dark, Alert vs toast).

---

## 2. Seguridad

### 2.1 Crítico — URLs de API incorrectas

| Archivo | Problema | Impacto |
|---------|----------|---------|
| `src/api/client.ts` | `API_BASE_URL` hardcodeada a **3199** | **La app NO se conecta al backend en producción** (URL correcta: 3104) |
| `src/services/socket.service.ts` | `SOCKET_URL` hardcodeada a **3199** | WebSocket no conecta en producción |
| `src/config/api.config.ts` | Usa 3104 pero **no es usada por client.ts** | client.ts ignora api.config y usa su propia constante |

**Solución:** `client.ts` debe usar `API_URL` de `api.config.ts`. `socket.service.ts` debe usar la misma URL base (ej. `API_URL` o derivar WS de ella).

### 2.2 Almacenamiento de credenciales

| Aspecto | Estado |
|---------|--------|
| Token JWT | ✅ SecureStore (expo-secure-store) |
| Datos de usuario | ✅ SecureStore (USER_STORAGE_KEY) |
| Carrito / Favoritos | ⚠️ AsyncStorage (no sensible, aceptable) |

### 2.3 Logs en producción

| Archivo | Tipo | Recomendación |
|---------|------|---------------|
| `api.config.ts` | `console.log`, `console.error` | Eliminar o envolver en `__DEV__` |
| `socket.service.ts` | `console.log` (connect, disconnect, message) | Eliminar en producción; usar `__DEV__` |
| Múltiples screens | `console.error` en catch | Aceptable para debugging; en prod considerar logger que no exponga datos |

**Patrón sugerido:**
```ts
if (__DEV__) console.log('API_URL:', API_URL);
```

### 2.4 Validación y manejo de errores

| Aspecto | Estado |
|---------|--------|
| Validación email en login/registro | ✅ Regex básico |
| Validación contraseña (mín. 6 caracteres) | ✅ |
| Manejo 401 (logout automático) | ✅ client.ts hace clearAuth |
| Exposición de stack/errores al usuario | ⚠️ `error.response?.data?.message` — OK si backend no devuelve datos sensibles |

### 2.5 Permisos y configuración

| Aspecto | Estado |
|---------|--------|
| Permisos Android (cámara, storage) | ✅ Declarados en app.json |
| Permisos iOS (cámara, galería) | ✅ infoPlist |
| Certificado SSL | ✅ HTTPS en URLs |
| EAS Submit (Play Store) | ⚠️ Requiere `google-service-account.json` — no incluido en repo (correcto) |
| EAS Submit (App Store) | ⚠️ Placeholder (appleId, ascAppId) — hay que configurar |

---

## 3. Usabilidad

### 3.1 Feedback al usuario

| Patrón actual | Problema | Recomendación |
|---------------|----------|---------------|
| **Alert.alert** en errores y éxitos | Modal nativo bloqueante; interrumpe flujo | Migrar a **toast/snackbar** (react-native-toast-message o similar) |
| Estados de carga | ActivityIndicator en botones | ✅ Aceptable |
| Pull-to-refresh | En OrdersScreen, ProductsScreen | ✅ OK |
| Sin feedback en acciones menores | Ej. agregar al carrito, favorito | Considerar feedback breve (toast "Añadido al carrito") |

**Pantallas con Alert.alert:** LoginScreen, RegisterScreen, ForgotPasswordScreen, CheckoutScreen, OrderDetailScreen, BookAppointmentScreen, ChatRoomScreen, CartScreen, ProductDetailScreen, ProfileScreen, InviteRegisterScreen, AppNavigator (logout).

### 3.2 Validación en formularios

| Pantalla | Estado |
|----------|--------|
| Login | ✅ Email, contraseña, longitud |
| Register | ✅ Campos requeridos, coincidencia contraseñas |
| ForgotPassword | ✅ Email |
| Checkout | ✅ Nombre requerido |
| BookAppointment | ✅ Servicio seleccionado |

### 3.3 Navegación y roles

| Aspecto | Estado |
|---------|--------|
| RoleGuard | ✅ Componente para restringir por rol |
| Drawer con ítems por rol | ✅ menuConfig, getBusinessFeatures |
| Flujo Auth → Main | ✅ Correcto |
| Deep linking | ⚠️ expo-linking instalado; uso no verificado |

### 3.4 Manejo de errores de red

| Aspecto | Estado |
|---------|--------|
| Timeout | ❌ client.ts no usa timeout en fetch |
| Reintentos | ❌ api.config tiene API_RETRY_CONFIG pero no parece usarse en client |
| Mensaje genérico | ✅ "Error al iniciar sesión", etc. |
| Retry manual | ⚠️ Solo pull-to-refresh donde exista; no pantalla "Reintentar" genérica |

### 3.5 Accesibilidad

| Aspecto | Estado |
|---------|--------|
| Labels en inputs | ✅ Labels visibles |
| secureTextEntry en contraseña | ✅ |
| Touch targets | ⚠️ No verificado tamaño mínimo (44pt recomendado) |
| Screen reader | ⚠️ No se ven `accessibilityLabel` en revisión rápida |

---

## 4. UI/UX

### 4.1 Consistencia con la web

| Aspecto | Web | Móvil | Conclusión |
|---------|-----|-------|------------|
| Tema | Dark mode por defecto | **Light** (userInterfaceStyle: light) | ❌ Inconsistente |
| Paleta primaria | Teal/slate | Indigo (#6366f1) | ⚠️ Diferente |
| Componentes | Tailwind slate-*, teal-* | theme: primary indigo, background #fff | No alineado |

**Recomendación:** Unificar paleta (ej. slate/teal como web) o documentar razón de la divergencia. Ofrecer dark mode en móvil (Expo soporta `userInterfaceStyle: 'automatic'`).

### 4.2 Sistema de diseño

| Elemento | Estado |
|----------|--------|
| theme/index.ts | ✅ Colores, spacing, tipografía, sombras, borderRadius |
| Uso consistente | ✅ Pantallas usan theme |
| Variables para dark mode | ⚠️ `backgroundDark`, `cardDark` existen pero no hay toggle |

### 4.3 Componentes reutilizables

| Componente | Estado |
|------------|--------|
| RoleGuard | ✅ |
| Input, Button, Card | ⚠️ No hay carpeta components/ con primitivos compartidos; cada pantalla define sus estilos |

### 4.4 Responsive y adaptabilidad

| Aspecto | Estado |
|---------|--------|
| Orientación | portrait (app.json) |
| Tablet (iOS) | supportsTablet: true |
| Safe area | react-native-safe-area-context instalado |

### 4.5 Carga y estados vacíos

| Pantalla | Estado |
|----------|--------|
| Loading | ActivityIndicator donde corresponde |
| Empty state | ⚠️ Revisar ProductsScreen, OrdersScreen, ChatListScreen para mensajes "No hay X" |

---

## 5. Tests

| Suite | Estado |
|-------|--------|
| theme/index.test.ts | ✅ Pasa |
| AuthContext.test.ts | ✅ Pasa |
| api/client.test.ts | ❌ Falla — mock de `axios` pero el proyecto usa `fetch` (client.ts no usa axios) |

**Recomendación:** Actualizar o eliminar client.test.ts; el client real usa fetch nativo.

---

## 6. Dependencias y documentación

| Aspecto | Estado |
|---------|--------|
| README "Wompi" | ⚠️ Mención a Wompi; backend usa MercadoPago — documentación desactualizada |
| env.ts | README sugiere `src/config/env.ts`; existe `api.config.ts` con EXPO_PUBLIC_* |
| EAS build | ✅ eas.json configurado |

---

## 7. Gaps priorizados

| Prioridad | Gap | Impacto |
|-----------|-----|---------|
| **P0** | URLs 3199 en client.ts y socket.service.ts | App no funciona en producción |
| **P1** | Console.log en api.config y socket.service | Info sensible en logs |
| **P1** | client.test.ts mock axios (proyecto usa fetch) | Tests engañosos |
| **P2** | Alert.alert → Toast/Snackbar | Mejor UX |
| **P2** | Tema dark / alineación con web | Consistencia de marca |
| **P3** | Timeout y reintentos en fetch | Resilencia de red |
| **P3** | Accesibilidad (accessibilityLabel) | Inclusión |

---

## 8. Plan de acción sugerido

### Fase 1 — Crítico (inmediato)
1. Corregir `client.ts` para usar `API_URL` de `api.config.ts`.
2. Corregir `socket.service.ts` para usar la misma URL base (ej. importar de api.config).
3. Eliminar o condicionar `console.log` en api.config y socket.service.

### Fase 2 — Usabilidad
4. Integrar librería de toast (ej. react-native-toast-message).
5. Sustituir Alert.alert por toast en errores y confirmaciones no críticas (mantener Alert para logout, decisiones destructivas).

### Fase 3 — UI/UX
6. Añadir soporte dark mode (theme + toggle si aplica).
7. Alinear paleta primaria con web (teal/slate) o documentar criterio.

### Fase 4 — Tests y docs
8. Corregir o eliminar client.test.ts.
9. Actualizar README (Wompi → MercadoPago, URLs).
10. Documentar variables de entorno (EXPO_PUBLIC_API_URL).

---

## 9. Checklist de verificación

- [ ] App conecta al backend correcto (3104)
- [ ] WebSocket conecta correctamente
- [ ] No hay console.log con datos sensibles en builds de producción
- [ ] Token en SecureStore
- [ ] Logout limpia credenciales
- [ ] Tests pasan
- [ ] Tema alineado con web (o documentado)
- [ ] Feedback de errores no bloqueante (toast)

---

*Documento generado a partir del análisis del código en nexora-mobile/.*
