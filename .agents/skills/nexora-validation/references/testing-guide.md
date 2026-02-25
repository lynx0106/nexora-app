# Guía de Testing - Nexora App

Guía de pruebas manuales y automatizadas para el proyecto.

## Testing Automatizado

### Backend (NestJS)

```bash
cd backend

# Tests unitarios
npm test

# Tests con cobertura
npm run test:cov

# Tests en watch mode (desarrollo)
npm run test:watch

# Tests E2E
npm run test:e2e
```

### Frontend (Next.js)

```bash
cd frontend

# Tests (si están configurados)
npm test
```

### Mobile (Expo/React Native)

```bash
cd nexora-mobile

# Tests
npm test

# Validación de Expo
npx expo doctor
```

## Testing Manual - Flujos Críticos

### 1. Autenticación

#### Login como Superadmin
```
URL: https://nexora-app.online
Email: superadmin@saas.com
Contraseña: SuperAdmin2024!

✅ Debe redirigir al Dashboard
✅ Debe mostrar menú de Superadmin
```

#### Login como Admin de Tenant
```
Email: admin@sabor.com
Contraseña: Password123!

✅ Debe redirigir al Dashboard
✅ Solo debe ver su tenant
```

#### Logout
```
✅ Debe limpiar sesión
✅ Debe redirigir a login
```

### 2. Gestión de Productos

```
Como Admin:
1. Ir a Productos
2. Crear nuevo producto
3. Editar producto
4. Eliminar producto
5. Verificar stock

✅ CRUD funciona correctamente
✅ Validaciones de campos
✅ Precios y stock se guardan
```

### 3. Pedidos

```
Como Cliente (público):
1. Ir a página pública de tenant
2. Seleccionar productos
3. Completar checkout
4. Verificar creación de pedido

Como Admin:
1. Ver pedidos en dashboard
2. Cambiar estado de pedido
3. Ver detalle de pedido
```

### 4. Citas (Appointments)

```
Como Cliente:
1. Ir a booking de tenant
2. Seleccionar servicio
3. Elegir fecha/hora
4. Confirmar cita

Como Admin:
1. Ver calendario de citas
2. Confirmar/cancelar cita
3. Ver historial
```

### 5. Chat (Si aplica)

```
Como Cliente:
1. Iniciar chat desde web
2. Enviar mensaje

Como Staff:
1. Ver chat en tiempo real
2. Responder mensaje
```

## Testing de API (Manual)

### Health Check
```bash
curl https://nexora-app-production-3104.up.railway.app/health
```

### Login
```bash
curl -X POST https://nexora-app-production-3104.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@saas.com","password":"SuperAdmin2024!"}'
```

### Listar Productos (requiere auth)
```bash
curl https://nexora-app-production-3104.up.railway.app/products \
  -H "Authorization: Bearer TU_TOKEN"
```

## Testing de Seguridad

### Verificar CORS
```bash
# Desde origen no permitido
curl -H "Origin: https://evil-site.com" \
  https://nexora-app-production-3104.up.railway.app/auth/login

# Debe bloquear o no incluir headers de CORS
```

### Verificar Autenticación
```bash
# Sin token
curl https://nexora-app-production-3104.up.railway.app/users/profile

# Debe retornar 401
```

### SQL Injection (Básico)
```bash
# Intentar inyección en login
curl -X POST https://nexora-app-production-3104.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@saas.com' or '1'='1","password":"test"}'

# No debe funcionar
```

## Testing de Performance

### Backend Response Time
```bash
# Health check
for i in {1..10}; do 
  curl -s -o /dev/null -w "%{time_total}\n" \
    https://nexora-app-production-3104.up.railway.app/health
done
```

### Lighthouse (Frontend)
```bash
# En Chrome DevTools
# Performance tab > Run audit
# O usar lighthouse CLI
npx lighthouse https://nexora-app.online --view
```

## Checklist de Testing Completo

Antes de release:

- [ ] Login funciona (todos los roles)
- [ ] Logout funciona
- [ ] CRUD Productos funciona
- [ ] CRUD Pedidos funciona
- [ ] CRUD Citas funciona
- [ ] Chat funciona (si aplica)
- [ ] Uploads funcionan
- [ ] Pagos funcionan (sandbox)
- [ ] Responsive (mobile)
- [ ] No hay errores en consola
- [ ] No hay errores 500 en backend

## Debugging

### Ver Logs Backend
Railway Dashboard → Logs → Filtrar por errores

### Ver Logs Frontend
Chrome DevTools → Console

### Ver Network Requests
Chrome DevTools → Network → Filtrar por Fetch/XHR
