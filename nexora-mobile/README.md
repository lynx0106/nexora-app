# Nexora Mobile App

Aplicación móvil de Nexora - Plataforma SaaS Multi-tenant para gestión de negocios.

## Características

- **Autenticación**: Login, registro y recuperación de contraseña
- **Catálogo de Productos**: Búsqueda, filtros y favoritos
- **Carrito de Compras**: Gestión de productos y cantidades
- **Pedidos**: Historial y seguimiento de pedidos
- **Pagos**: Integración con Wompi
- **Chat en Tiempo Real**: Soporte vía WebSocket
- **Citas**: Agendamiento y gestión de citas
- **Dashboard Admin**: Métricas y control (para administradores)

## Requisitos

- Node.js 18+
- npm o yarn
- Expo CLI
- Cuenta en Expo (para EAS Build)

## Instalación

```bash
# Clonar el repositorio
cd nexora-mobile

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npx expo start
```

## Configuración

### Variables de Entorno

Crear archivo `src/config/env.ts`:

```typescript
export const API_URL = 'https://tu-backend-url.com';
export const WS_URL = 'wss://tu-backend-url.com';
```

### EAS Build

El proyecto está configurado para EAS Build con tres perfiles:

- **development**: Build de desarrollo con APK
- **preview**: Build de testing interno
- **production**: Build para tiendas

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login en Expo
eas login

# Build de preview (APK para testing)
eas build --platform android --profile preview

# Build de producción (AAB para Play Store)
eas build --platform android --profile production
```

## Estructura del Proyecto

```
nexora-mobile/
src/
  api/              # Servicios de API
    client.ts       # Cliente HTTP base
    auth.api.ts     # Autenticación
    products.api.ts # Productos
    orders.api.ts   # Pedidos
    chat.api.ts     # Chat
    appointments.api.ts # Citas
    dashboard.api.ts # Dashboard
  components/       # Componentes reutilizables
  screens/          # Pantallas
    auth/           # Login, Register, ForgotPassword
    products/       # Products, ProductDetail, Favorites
    orders/         # Cart, Checkout, Orders, OrderDetail
    chat/           # ChatList, Chat
    appointments/   # Appointments, BookAppointment
    admin/          # Dashboard
  context/          # Context API
    AuthContext.tsx # Estado de autenticación
    CartContext.tsx # Estado del carrito
    FavoritesContext.tsx # Favoritos
    ChatContext.tsx # Chat WebSocket
  navigation/       # Navegación
    AppNavigator.tsx
  services/         # Servicios
    socket.service.ts # WebSocket
  theme/            # Tema y estilos
  types/            # TypeScript types
  utils/            # Utilidades
```

## Control de Acceso por Rol

| Rol | Acceso |
|-----|--------|
| `user` | Productos, Pedidos, Citas, Soporte |
| `staff` | Productos, Pedidos, Chat, Citas |
| `admin` | Productos, Pedidos, Chat, Citas, Dashboard |
| `superadmin` | Acceso completo |

## Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests con coverage
npm test -- --coverage
```

## Scripts Disponibles

```bash
npm start          # Iniciar Expo
npm test           # Ejecutar tests
npm run android    # Iniciar en Android
npm run ios        # Iniciar en iOS
npm run web        # Iniciar en web
```

## Tecnologías

- **React Native** con **Expo**
- **React Navigation** para navegación
- **Axios** para HTTP
- **Socket.io** para WebSocket
- **AsyncStorage** para persistencia local
- **SecureStore** para tokens
- **TypeScript**

## Licencia

Privado - Nexora