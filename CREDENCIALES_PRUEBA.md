# 📋 CREDENCIALES DE PRUEBA - NEXORA APP

## Usuarios Creador para Pruebas

### 👑 SUPERADMIN (Plataforma)
| Campo | Valor |
|-------|-------|
| Email | superadmin@saas.com |
| Password | Super123! |
| Rol | superadmin |
| Tenant | system |

---

### 👨‍💼 ADMINISTRADORES (Por Tenant)

| Tenant | Email | Password | Rol |
|--------|-------|----------|-----|
| Restaurante Demo | admin@restaurante-demo.com | Admin123 | admin |
| Clínica Dental Demo | admin@clinica-demo.com | Admin123 | admin |
| Tienda Retail Demo | admin@tienda-demo.com | Admin123 | admin |
| Salón Belleza Demo | admin@belleza-demo.com | Admin123 | admin |

---

### 👥 USUARIOS DEMO (CREADOS AUTOMÁTICAMENTE)

| Email | Password | Rol | Tenant |
|-------|----------|-----|--------|
| carlos.demo@miempresa.com | Demo123! | admin | mi-empresa-saas |
| luis.demo@miempresa.com | Demo123! | user | mi-empresa-saas |
| ana.demo@clinica.com | Demo123! | admin | clinica-sonrisas |
| pedro.demo@clinica.com | Demo123! | user | clinica-sonrisas |

---

## 🌐 ACCESO A LA APLICACIÓN

| Servicio | URL |
|----------|-----|
| **Frontend (Producción)** | https://nexora-app.online |
| **Backend (API)** | https://nexora-app-production-3199.up.railway.app |
| **Health Check** | https://nexora-app-production-3199.up.railway.app/health |

---

## 🧪 CÓMO PROBAR LA APP

### 1. Prueba como ADMINISTRADOR
1. Ir a https://nexora-app.online
2. Iniciar sesión con:
   - Email: `admin@restaurante-demo.com`
   - Password: `Admin123`
3. Explorar el panel de administración
4. Crear productos, ver pedidos, gestionar usuarios

### 2. Prueba como USUARIO/CLIENTE
1. Ir a https://nexora-app.online
2. Iniciar sesión con:
   - Email: `luis.demo@miempresa.com`
   - Password: `Demo123!`
3. Ver productos, realizar pedidos

### 3. Prueba como SUPERADMIN
1. Ir a https://nexora-app.online
2. Iniciar sesión con:
   - Email: `superadmin@saas.com`
   - Password: `Super123!`
3. Gestionar todos los tenants, ver métricas globales

---

## 📱 TENANTS CREADOS

| ID | Nombre | Sector | Admin |
|----|--------|--------|-------|
| restaurante-demo | Restaurante Demo | restaurante | admin@restaurante-demo.com |
| clinica-demo | Clínica Dental Demo | salud | admin@clinica-demo.com |
| tienda-demo | Tienda Retail Demo | retail | admin@tienda-demo.com |
| belleza-demo | Salón Belleza Demo | belleza | admin@belleza-demo.com |
| mi-empresa-saas | Mi Empresa SaaS | retail | carlos.demo@miempresa.com |
| clinica-sonrisas | Clínica Sonrisas | salud | ana.demo@clinica.com |

---

## ⚠️ NOTAS IMPORTANTES

1. **Seed deshabilitado en producción** - Los endpoints de seed están deshabilitados en el entorno de Railway por seguridad
2. **Productos** - Solo se ha creado 1 producto de prueba (Hamburguesa Deluxe). Los admins pueden crear más desde el panel
3. **Contraseñas** - Todas las contraseñas de prueba siguen el patrón: `Admin123!` o `Demo123!`
4. **Dominio** - El dominio nexora-app.online debe estar funcionando para acceder al frontend

---

## 🔧 PARA CREAR MÁS DATOS DE PRUEBA

Si necesitas crear más productos, pedidos o citas, puedes:

1. **Iniciar sesión como admin** del tenant correspondiente
2. **Acceder al panel de administración**
3. **Crear productos/servicios** desde la sección correspondiente
4. **Crear pedidos** desde la vista de cliente o el panel

---

*Documento generado el 16 de febrero de 2026*
