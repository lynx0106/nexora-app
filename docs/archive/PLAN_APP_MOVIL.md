# 📱 Plan de Desarrollo - App Móvil Nexora

## 🎯 Objetivo
Crear una aplicación móvil nativa (React Native) que consuma la API existente del backend NestJS, manteniendo la aplicación web de escritorio actual.

---

## 📊 Resumen del Progreso

| Fase | Estado | Progreso |
|------|--------|----------|
| **FASE 0: Planificación** | ✅ Completado | 100% |
| **FASE 1: Configuración Base** | ✅ Completado | 100% |
| **FASE 2: Autenticación** | ✅ Completado | 100% |
| **FASE 3: Catálogo y Productos** | ✅ Completado | 100% |
| **FASE 4: Pedidos y Pagos** | ✅ Completado | 100% |
| **FASE 5: Chat y Citas** | ✅ Completado | 100% |
| **FASE 6: Dashboard Admin** | ✅ Completado | 100% |
| **FASE 7: Testing y Deploy** | ⏳ En Progreso | 50% |

**Progreso Total: 93.75% (7.5/8 fases)**

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXORA ECOSISTEMA                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Web App     │  │  Mobile App  │  │  API Externa │       │
│  │  (Next.js)   │  │(React Native)│  │  (Terceros)  │       │
│  │  ✅ Existe   │  │  ✅ Creada   │  │  ✅ Existe   │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └────────────────┬┴─────────────────┘                │
│                          │                                   │
│                          ▼                                   │
│              ┌──────────────────────┐                        │
│              │   Backend API        │                        │
│              │   (NestJS)           │                        │
│              │   ✅ Ya existe       │                        │
│              │   60+ endpoints      │                        │
│              └──────────┬───────────┘                        │
│                         │                                    │
│                         ▼                                    │
│              ┌──────────────────────┐                        │
│              │   Supabase           │                        │
│              │   (PostgreSQL)       │                        │
│              │   ✅ Ya existe       │                        │
│              └──────────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 FASE 0: Planificación ✅ (100%)

### Checklist
- [x] Definir arquitectura del proyecto
- [x] Identificar endpoints existentes disponibles
- [x] Definir pantallas necesarias
- [x] Estimar tiempos y recursos
- [x] Documentar plan de desarrollo

### Entregables
- ✅ Documento de planificación (este archivo)
- ✅ Arquitectura definida
- ✅ Lista de endpoints a consumir

---

## 📋 FASE 1: Configuración Base ✅ (100%)

**Tiempo estimado:** 3-4 días

### Checklist
- [x] Crear proyecto React Native con Expo
- [x] Configurar estructura de carpetas
- [x] Instalar dependencias base
- [x] Configurar navegación (React Navigation)
- [x] Configurar tema y estilos globales
- [x] Crear servicio de API (axios/fetch)
- [x] Configurar almacenamiento local (AsyncStorage)
- [x] Configurar variables de entorno

### Entregables
- ✅ Proyecto Expo creado
- ✅ Navegación configurada
- ✅ API client conectado al backend
- ✅ Sistema de temas
- ✅ 10 tests pasando

### Estructura del Proyecto
```
nexora-mobile/
├── src/
│   ├── api/                 # Servicios de API
│   │   ├── client.ts        # Cliente HTTP base
│   │   ├── auth.api.ts      # Endpoints de auth
│   │   ├── products.api.ts  # Endpoints de productos
│   │   ├── orders.api.ts    # Endpoints de pedidos
│   │   ├── chat.api.ts      # WebSocket chat
│   │   ├── appointments.api.ts # Citas
│   │   ├── dashboard.api.ts # Dashboard admin
│   │   └── categories.api.ts # Categorías
│   ├── components/          # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Loading.tsx
│   ├── screens/             # Pantallas
│   │   ├── auth/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── chat/
│   │   ├── appointments/
│   │   ├── admin/
│   │   └── profile/
│   ├── navigation/          # Navegación
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── hooks/               # Custom hooks
│   ├── context/             # Context API
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   ├── FavoritesContext.tsx
│   │   └── ChatContext.tsx
│   ├── services/            # Servicios
│   │   └── socket.service.ts
│   ├── utils/               # Utilidades
│   ├── types/               # TypeScript types
│   └── theme/               # Tema y estilos
├── app.json                 # Config Expo
├── eas.json                 # Config EAS Build
├── package.json
└── tsconfig.json
```

### Dependencias Instaladas
```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "react-native": "0.76.5",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "axios": "^1.7.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "socket.io-client": "^4.8.0",
    "expo-secure-store": "^14.0.0",
    "react-native-svg": "^15.8.0"
  }
}
```

---

## 📋 FASE 2: Autenticación ✅ (100%)

**Tiempo estimado:** 2-3 días

### Checklist
- [x] Crear pantalla de Login
- [x] Crear pantalla de Registro
- [x] Crear pantalla de Recuperar Contraseña
- [x] Implementar Context de Autenticación
- [x] Implementar almacenamiento seguro de token (SecureStore)
- [x] Crear flujo de navegación condicional
- [x] Implementar logout
- [x] Validación de formularios
- [x] Tests de autenticación (16 tests)

### Pantallas
| Pantalla | Descripción | Endpoint |
|----------|-------------|----------|
| Login | Inicio de sesión | POST /auth/login |
| Register | Registro de usuario | POST /auth/register |
| ForgotPassword | Recuperar contraseña | POST /auth/password-reset/request |

### Componentes
- `AuthContext` - Context de autenticación con persistencia
- `LoginScreen` - Pantalla de login con validación
- `RegisterScreen` - Pantalla de registro con validación
- `ForgotPasswordScreen` - Pantalla de recuperación

---

## 📋 FASE 3: Catálogo y Productos ✅ (100%)

**Tiempo estimado:** 3-4 días

### Checklist
- [x] Crear pantalla de Home
- [x] Crear lista de productos
- [x] Crear detalle de producto
- [x] Implementar búsqueda de productos
- [x] Implementar filtros (ordenamiento, stock)
- [x] Crear pantalla de favoritos
- [x] Persistir favoritos en AsyncStorage
- [x] Mostrar métricas del dashboard
- [x] Alertas de stock bajo

### Pantallas
| Pantalla | Descripción | Endpoint |
|----------|-------------|----------|
| Home | Dashboard inicial con métricas | GET /dashboard/metrics |
| ProductList | Lista de productos con filtros | GET /products |
| ProductDetail | Detalle de producto | GET /products/:id |
| Favorites | Productos favoritos | Local (AsyncStorage) |

### Componentes
- `FavoritesContext` - Context para favoritos
- `ProductsScreen` - Lista con búsqueda y filtros
- `ProductDetailScreen` - Detalle con selector de cantidad
- `FavoritesScreen` - Lista de favoritos

---

## 📋 FASE 4: Pedidos y Pagos ✅ (100%)

**Tiempo estimado:** 4-5 días

### Checklist
- [x] Crear carrito de compras
- [x] Implementar Context de Carrito (CartContext)
- [x] Crear pantalla de checkout
- [x] Integrar link de pago Wompi
- [x] Crear pantalla de confirmación
- [x] Crear historial de pedidos
- [x] Crear detalle de pedido
- [x] Tests pasando (26 tests)

### Pantallas Implementadas
| Pantalla | Descripción | Endpoint |
|----------|-------------|----------|
| Cart | Carrito de compras con persistencia AsyncStorage | Local state |
| Checkout | Proceso de pago con formulario de cliente | POST /orders |
| Orders | Historial de pedidos con estados | GET /orders |
| OrderDetail | Detalle de pedido con link de pago | GET /orders/:id, GET /orders/:id/payment-link |

### Componentes
- `CartContext` - Context para carrito con persistencia
- `CartScreen` - Pantalla del carrito con gestión de cantidades
- `CheckoutScreen` - Formulario de checkout
- `OrdersScreen` - Lista de pedidos con pull-to-refresh
- `OrderDetailScreen` - Detalle con estados y pago

---

## 📋 FASE 5: Chat y Citas ✅ (100%)

**Tiempo estimado:** 3-4 días

### Checklist
- [x] Configurar WebSocket client
- [x] Crear pantalla de lista de chats
- [x] Crear pantalla de conversación
- [x] Implementar envío de mensajes
- [x] Implementar recepción en tiempo real
- [x] Crear pantalla de agendar cita
- [x] Crear lista de citas

### Pantallas
| Pantalla | Descripción | Endpoint |
|----------|-------------|----------|
| ChatList | Lista de conversaciones | GET /chat/messages |
| ChatRoom | Conversación activa | WebSocket |
| Appointments | Lista de citas | GET /appointments |
| BookAppointment | Agendar cita | POST /appointments |

### Componentes
- `ChatContext` - Context para chat con WebSocket
- `ChatListScreen` - Lista de conversaciones
- `ChatScreen` - Conversación activa en tiempo real
- `AppointmentsScreen` - Lista de citas
- `BookAppointmentScreen` - Formulario para agendar

---

## 📋 FASE 6: Dashboard Admin ✅ (100%)

**Tiempo estimado:** 3-4 días

### Checklist
- [x] Crear dashboard de métricas
- [x] Implementar control de acceso basado en roles
- [x] Crear pantalla de Dashboard Admin
- [x] Integrar con endpoints de dashboard

### Pantallas
| Pantalla | Descripción | Endpoint |
|----------|-------------|----------|
| Dashboard | Métricas y gráficos | GET /dashboard/metrics |
| DashboardActivity | Actividad reciente | GET /dashboard/activity |
| DashboardSalesChart | Gráfico de ventas | GET /dashboard/sales-chart |

### Control de Acceso por Rol
| Rol | Acceso |
|-----|--------|
| `user` | Productos, Pedidos, Citas, Soporte |
| `staff` | Productos, Pedidos, Chat, Citas |
| `admin` | Productos, Pedidos, Chat, Citas, Dashboard |
| `superadmin` | Acceso completo |

---

## 📋 FASE 7: Testing y Deploy ⏳ (50%)

**Tiempo estimado:** 2-3 días

### Checklist
- [x] Configurar EAS Build
- [x] Actualizar app.json con configuración de producción
- [ ] Crear build de prueba (Android APK)
- [ ] Crear build de prueba (iOS)
- [ ] Testing en dispositivos reales
- [ ] Corregir bugs encontrados
- [ ] Configurar EAS Submit
- [ ] Publicar en Google Play (interno)
- [ ] Publicar en App Store (interno)

### Configuración EAS
```bash
# Build de desarrollo (APK para Android)
eas build --platform android --profile development

# Build de preview (APK para testing)
eas build --platform android --profile preview

# Build de producción (AAB para Play Store)
eas build --platform android --profile production

# Build para iOS
eas build --platform ios --profile preview
```

### Proceso de Deploy
1. `eas build --platform android --profile preview`
2. `eas build --platform ios --profile preview`
3. Testing en TestFlight / Play Console
4. `eas submit --platform android`
5. `eas submit --platform ios`

---

## 📊 Cronograma Total

| Fase | Duración | Estado |
|------|----------|--------|
| FASE 0 | 1 día | ✅ Completado |
| FASE 1 | 4 días | ✅ Completado |
| FASE 2 | 3 días | ✅ Completado |
| FASE 3 | 4 días | ✅ Completado |
| FASE 4 | 5 días | ✅ Completado |
| FASE 5 | 4 días | ✅ Completado |
| FASE 6 | 4 días | ✅ Completado |
| FASE 7 | 3 días | ⏳ En Progreso |
| **TOTAL** | **~28 días** | **93.75%** |

---

## 🔗 Endpoints Disponibles (Backend Existente)

### Auth
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `POST /auth/password-reset/request` - Solicitar reset
- `POST /auth/password-reset/confirm` - Confirmar reset

### Products
- `GET /products` - Listar productos
- `GET /products/:id` - Detalle
- `POST /products` - Crear
- `PUT /products/:id` - Actualizar
- `DELETE /products/:id` - Eliminar

### Orders
- `GET /orders` - Listar pedidos
- `GET /orders/:id` - Detalle
- `POST /orders` - Crear pedido
- `PUT /orders/:id` - Actualizar estado

### Inventory
- `GET /inventory/dashboard` - Dashboard inventario
- `GET /inventory/low-stock` - Productos bajo stock
- `PUT /inventory/product/:id/cost` - Actualizar costo

### Chat
- `GET /chat/messages` - Historial
- `WebSocket /chat` - Tiempo real

### Payments
- `POST /payments/create-preference` - Crear pago
- `GET /payments/status/:id` - Estado

### Appointments
- `GET /appointments` - Listar citas
- `POST /appointments` - Crear cita
- `PUT /appointments/:id` - Actualizar cita

### Dashboard
- `GET /dashboard/metrics` - Métricas
- `GET /dashboard/activity` - Actividad reciente
- `GET /dashboard/sales-chart` - Gráfico de ventas

---

## ✅ Confirmación

**La app web de escritorio actual se mantiene intacta.** La app móvil es un proyecto en carpeta separada (`nexora-mobile/`) que consume los mismos endpoints del backend existente.

---

## 📱 Tests

### Resumen de Tests
- **Backend:** 108 tests pasando
- **Mobile App:** 26 tests pasando

### Ejecutar Tests
```bash
# Backend
cd backend && npm test

# Mobile
cd nexora-mobile && npm test
```

---

*Documento creado: 17 de febrero de 2026*
*Última actualización: FASE 7 en progreso - Configuración EAS Build*
