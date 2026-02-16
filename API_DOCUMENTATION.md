# 📚 Documentación API - Nexora App

**Versión:** 1.0  
**Base URL:** `https://nexora-app-production-3199.up.railway.app`  
**Docs Interactivos:** `https://nexora-app-production-3199.up.railway.app/api/docs`

---

## 🔐 Autenticación

La API utiliza **JWT Bearer Token** para autenticación.

```http
Authorization: Bearer <token>
```

Obtén el token mediante el endpoint de login.

---

## 📖 Endpoints por Módulo

### 🔑 Auth

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registrar nuevo usuario | ❌ |
| POST | `/auth/login` | Iniciar sesión | ❌ |
| POST | `/auth/password-reset/request` | Solicitar reset de contraseña | ❌ |
| POST | `/auth/password-reset/confirm` | Confirmar reset de contraseña | ❌ |

#### Ejemplos

**Login:**
```bash
curl -X POST https://nexora-app-production-3199.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@saas.com",
    "password": "SuperAdmin2024!"
  }'
```

**Respuesta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "superadmin@saas.com",
    "role": "superadmin"
  }
}
```

---

### 👥 Users

| Método | Endpoint | Descripción | Roles Permitidos |
|--------|----------|-------------|------------------|
| GET | `/users/profile` | Perfil del usuario actual | ✅ Cualquiera |
| PUT | `/users/profile` | Actualizar perfil | ✅ Cualquiera |
| GET | `/users` | Listar usuarios del tenant | ✅ Admin, Superadmin, User |
| GET | `/users/all` | Listar TODOS los usuarios | ✅ Superadmin |
| GET | `/users/tenants/summary` | Resumen de tenants | ✅ Superadmin |
| GET | `/users/:id` | Obtener usuario por ID | ✅ Mismo tenant |
| POST | `/users` | Crear usuario | ✅ Admin, Superadmin |
| PUT | `/users/:id` | Actualizar usuario | ✅ Admin, Superadmin, Self |
| DELETE | `/users/:id` | Eliminar usuario | ✅ Admin, Superadmin |

---

### 🏢 Tenants

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/tenants` | Listar todos los tenants | ✅ Superadmin |
| GET | `/tenants/:id` | Obtener tenant por ID | ✅ Superadmin, Admin propio |
| POST | `/tenants` | Crear nuevo tenant | ✅ Superadmin |
| PUT | `/tenants/:id` | Actualizar tenant | ✅ Superadmin, Admin propio |
| DELETE | `/tenants/:id` | Eliminar tenant | ✅ Superadmin |

---

### 📦 Products

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/products` | Listar productos | product:read |
| GET | `/products/:id` | Obtener producto | product:read |
| GET | `/products/tenant/:tenantId` | Productos por tenant | product:read |
| POST | `/products` | Crear producto | product:manage |
| PUT | `/products/:id` | Actualizar producto | product:manage |
| DELETE | `/products/:id` | Eliminar producto | product:manage |
| POST | `/products/upload` | Cargar productos CSV | product:manage |

---

### 🛒 Orders

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/orders` | Listar pedidos | order:read |
| GET | `/orders/:id` | Obtener pedido | order:read |
| GET | `/orders/tenant/:tenantId` | Pedidos por tenant | order:read |
| POST | `/orders` | Crear pedido | order:manage |
| PUT | `/orders/:id` | Actualizar pedido | order:manage |
| DELETE | `/orders/:id` | Eliminar pedido | order:manage |

---

### 📅 Appointments

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/appointments` | Listar citas | appointment:read |
| GET | `/appointments/:id` | Obtener cita | appointment:read |
| POST | `/appointments` | Crear cita | appointment:manage |
| PUT | `/appointments/:id` | Actualizar cita | appointment:manage |
| DELETE | `/appointments/:id` | Cancelar cita | appointment:manage |

---

### 💬 Chat

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| WebSocket | `/chat` | Conexión WebSocket | ✅ JWT |
| GET | `/chat/messages` | Historial de mensajes | ✅ |
| POST | `/chat/send` | Enviar mensaje | ✅ |

**Eventos WebSocket:**
- `send_message` - Enviar mensaje
- `message_received` - Recibir mensaje
- `join_room` - Unirse a sala de chat

---

### 🤖 AI

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/ai/generate-reply` | Generar respuesta con IA | ✅ |
| GET | `/ai/usage` | Uso de IA por tenant | ✅ Admin |

---

### 💳 Payments

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/payments/create-preference` | Crear preferencia MP | ✅ |
| POST | `/payments/webhook` | Webhook de MercadoPago | ❌ |
| GET | `/payments/status/:id` | Estado de pago | ✅ |

---

### 📊 Dashboard

| Método | Endpoint | Descripción | Roles |
|--------|----------|-------------|-------|
| GET | `/dashboard/metrics` | Métricas del tenant | ✅ |
| GET | `/dashboard/stats` | Estadísticas | ✅ |
| GET | `/dashboard/reports` | Reportes | ✅ Admin |

---

### 📤 Uploads

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/uploads/avatars` | Subir avatar | ✅ |
| POST | `/uploads/products` | Subir imagen de producto | ✅ |
| POST | `/uploads/chat` | Subir archivo de chat | ✅ |

---

### 🌐 Public (Sin Auth)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/public/tenant/:tenantId` | Info pública del tenant |
| GET | `/public/products/:tenantId` | Productos públicos |
| POST | `/public/orders` | Crear pedido público |
| POST | `/public/appointments` | Crear cita pública |
| GET | `/public/orders/status/:token` | Ver estado de pedido |

---

## 📋 Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Error de validación |
| 401 | Unauthorized - Token inválido o faltante |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: email existe) |
| 500 | Internal Server Error |

---

## 🔒 Seguridad

- **Rate Limiting:** 120 requests / 60 segundos
- **Helmet:** Headers de seguridad HTTP
- **CORS:** Configurado para dominios específicos
- **Input Validation:** Validación de DTOs con class-validator

---

## 🧪 Usuarios de Prueba

Ver `REPORTE_USUARIOS_PRUEBA.md` para credenciales completas.

---

**Última actualización:** 16 de febrero de 2026
