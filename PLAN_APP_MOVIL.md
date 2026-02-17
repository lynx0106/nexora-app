# 📱 Plan de Desarrollo - App Móvil Nexora

## 🎯 Objetivo
Crear una aplicación móvil nativa (React Native) que consuma la API existente del backend NestJS, manteniendo la aplicación web de escritorio actual.

---

## 📊 Resumen del Progreso

| Fase | Estado | Progreso |
|------|--------|----------|
| **FASE 0: Planificación** | ✅ Completado | 100% |
| **FASE 1: Configuración Base** | ✅ Completado | 100% |
| **FASE 2: Autenticación** | ⏳ Pendiente | 0% |
| **FASE 3: Catálogo y Productos** | ⏳ Pendiente | 0% |
| **FASE 4: Pedidos y Pagos** | ⏳ Pendiente | 0% |
| **FASE 5: Chat y Citas** | ⏳ Pendiente | 0% |
| **FASE 6: Dashboard Admin** | ⏳ Pendiente | 0% |
| **FASE 7: Testing y Deploy** | ⏳ Pendiente | 0% |

**Progreso Total: 25% (2/8 fases)**

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
│  │  ✅ Existe   │  │  🆕 Nueva    │  │  ✅ Existe   │       │
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
│   │   └── chat.api.ts      # WebSocket chat
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
│   │   └── profile/
│   ├── navigation/          # Navegación
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── hooks/               # Custom hooks
│   ├── context/             # Context API
│   ├── utils/               # Utilidades
│   ├── types/               # TypeScript types
│   └── theme/               # Tema y estilos
├── app.json                 # Config Expo
├── package.json
└── tsconfig.json
```

### Dependencias a Instalar
```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "react-native": "0.73.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/native-stack": "^6.9.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "axios": "^1.6.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "socket.io-client": "^4.7.0",
    "expo-image-picker": "^14.0.0",
    "expo-secure-store": "^12.8.0"
  }
}
```

---

## 📋 FASE 2: Autenticación ⏳ (0%)

**Tiempo estimado:** 2-3 días

### Checklist
- [ ] Crear pantalla de Login
- [ ] Crear pantalla de Registro
- [ ] Crear pantalla de Recuperar Contraseña
- [ ] Implementar Context de Autenticación
- [ ] Implementar almacenamiento seguro de token
- [ ] Crear flujo de navegación condicional
- [ ] Implementar logout

### Pantallas
| Pantalla | Descripción | Endpoint |
|----------|-------------|----------|
| Login | Inicio de sesión | POST /auth/login |
| Register | Registro de usuario | POST /auth/register |
| ForgotPassword | Recuperar contraseña | POST /auth/password-reset/request |

### Componentes
- `LoginForm` - Formulario de login
- `RegisterForm` - Formulario de registro
- `AuthContext` - Context de autenticación

---

## 📋 FASE 3: Catálogo y Productos ⏳ (0%)

**Tiempo estimado:** 3-4 días

### Checklist
- [ ] Crear pantalla de Home
- [ ] Crear lista de productos
- [ ] Crear detalle de producto
- [ ] Implementar búsqueda de productos
- [ ] Implementar filtros por categoría
- [ ] Crear pantalla de favoritos

### Pantallas
| Pantalla | Descripción | Endpoint |
|----------|-------------|----------|
| Home | Dashboard inicial | GET /dashboard/metrics |
| ProductList | Lista de productos | GET /products |
| ProductDetail | Detalle de producto | GET /products/:id |
| Search | Búsqueda | GET /products?search= |

---

## 📋 FASE 4: Pedidos y Pagos ⏳ (0%)

**Tiempo estimado:** 4-5 días

### Checklist
- [ ] Crear carrito de compras
- [ ] Implementar Context de Carrito
- [ ] Crear pantalla de checkout
- [ ] Integrar MercadoPago
- [ ] Crear pantalla de confirmación
- [ ] Crear historial de pedidos
- [ ] Crear detalle de pedido

### Pantallas
| Pantalla | Descripción | Endpoint |
|----------|-------------|----------|
| Cart | Carrito de compras | Local state |
| Checkout | Proceso de pago | POST /orders |
| Payment | Pago MercadoPago | POST /payments/create-preference |
| Orders | Historial de pedidos | GET /orders |
| OrderDetail | Detalle de pedido | GET /orders/:id |

---

## 📋 FASE 5: Chat y Citas ⏳ (0%)

**Tiempo estimado:** 3-4 días

### Checklist
- [ ] Configurar WebSocket client
- [ ] Crear pantalla de lista de chats
- [ ] Crear pantalla de conversación
- [ ] Implementar envío de mensajes
- [ ] Implementar recepción en tiempo real
- [ ] Crear pantalla de agendar cita
- [ ] Crear lista de citas

### Pantallas
| Pantalla | Descripción | Endpoint |
|----------|-------------|----------|
| ChatList | Lista de conversaciones | GET /chat/messages |
| ChatRoom | Conversación activa | WebSocket |
| Appointments | Lista de citas | GET /appointments |
| BookAppointment | Agendar cita | POST /appointments |

---

## 📋 FASE 6: Dashboard Admin ⏳ (0%)

**Tiempo estimado:** 3-4 días

### Checklist
- [ ] Crear dashboard de métricas
- [ ] Crear gestión de productos (CRUD)
- [ ] Crear gestión de inventario
- [ ] Crear gestión de pedidos
- [ ] Crear gestión de usuarios
- [ ] Implementar notificaciones push

### Pantallas
| Pantalla | Descripción | Endpoint |
|----------|-------------|----------|
| AdminDashboard | Métricas | GET /dashboard/metrics |
| AdminProducts | Gestión productos | GET/POST/PUT/DELETE /products |
| AdminInventory | Inventario | GET /inventory/dashboard |
| AdminOrders | Gestión pedidos | GET/PUT /orders |
| AdminUsers | Gestión usuarios | GET /users |

---

## 📋 FASE 7: Testing y Deploy ⏳ (0%)

**Tiempo estimado:** 2-3 días

### Checklist
- [ ] Configurar EAS Build
- [ ] Crear build de prueba (Android)
- [ ] Crear build de prueba (iOS)
- [ ] Testing en dispositivos reales
- [ ] Corregir bugs encontrados
- [ ] Configurar EAS Submit
- [ ] Publicar en Google Play (interno)
- [ ] Publicar en App Store (interno)

### Proceso de Deploy
1. `eas build --platform android --profile preview`
2. `eas build --platform ios --profile preview`
3. Testing en TestFlight / Play Console
4. `eas submit --platform android`
5. `eas submit --platform ios`

---

## 📊 Cronograma Total

| Fase | Duración | Inicio | Fin |
|------|----------|--------|-----|
| FASE 0 | 1 día | ✅ Completado | ✅ |
| FASE 1 | 4 días | Pendiente | - |
| FASE 2 | 3 días | Pendiente | - |
| FASE 3 | 4 días | Pendiente | - |
| FASE 4 | 5 días | Pendiente | - |
| FASE 5 | 4 días | Pendiente | - |
| FASE 6 | 4 días | Pendiente | - |
| FASE 7 | 3 días | Pendiente | - |
| **TOTAL** | **~28 días** | - | - |

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

---

## ✅ Confirmación

**La app web de escritorio actual se mantiene intacta.** La app móvil será un proyecto nuevo en una carpeta separada (`nexora-mobile/`) que consumirá los mismos endpoints del backend existente.

---

*Documento creado: 17 de febrero de 2026*
*Última actualización: FASE 0 completada*
