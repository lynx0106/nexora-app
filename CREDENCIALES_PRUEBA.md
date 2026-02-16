# Credenciales de Prueba - Nexora App

## Credenciales Superadmin (Sistema)

| Email | Password | Rol |
|-------|----------|-----|
| superadmin@saas.com | SuperAdmin2024! | superadmin |

---

## Tenants de Demostración

### 1. Restaurante Demo (restaurante-demo)

**Admin del Tenant:**
- Email: admin@restaurante.com
- Password: admin123
- Rol: user

**Usuarios de Prueba:**
| Email | Password | Rol |
|-------|----------|-----|
| cliente1@restaurante.com | password123 | client |
| admin@restaurante.com | admin123 | user |
| user@restaurante.com | user123 | user |

**Productos:**
- Hamburguesa Clásica - $15,000
- Hamburguesa Deluxe - $15,000

**Pedidos de Prueba:**
- Pedido #1: Juan Pérez - 2 Hamburguesas Clásicas - $30,000 (pendiente)
- Pedido #2: Pedro Gómez - 1 Hamburguesa Clásica + 1 Deluxe - $30,000 (pendiente)

---

### 2. Clínica Dental Demo (clinica-demo)

**Admin del Tenant:**
- Email: admin@clinica.com
- Password: admin123
- Rol: user

**Usuarios de Prueba:**
| Email | Password | Rol |
|-------|----------|-----|
| cliente1@clinica.com | password123 | client |
| user@clinica.com | user123 | user |
| doctor@clinica.com | doctor123 | user |

**Servicios:**
- Limpieza Dental - $80,000

**Citas de Prueba:**
- Cita #1: Maria Lopez - 20/Feb/2026 10:00 - Limpieza Dental (pendiente)
- Cita #2: Carlos Martinez - 22/Feb/2026 11:00 - Control dental (pendiente)
- Cita #3: Laura Sanchez - 23/Feb/2026 15:30 - Blanqueamiento (pendiente)

---

### 3. Tienda de Ropa Demo (tienda-demo)

**Admin del Tenant:**
- Email: admin@tienda.com
- Password: admin123
- Rol: user

**Usuarios de Prueba:**
| Email | Password | Rol |
|-------|----------|-----|
| cliente1@tienda.com | password123 | client |
| user@tienda.com | user123 | user |
| vendedor@tienda.com | vendedor123 | user |

**Productos:**
- Camisa Roja - $45,000

**Pedidos de Prueba:**
- Pedido #1: Carlos Rodriguez - 3 Camisas Rojas - $135,000 (pendiente)
- Pedido #2: Diana Lopez - 2 Camisas Rojas - $90,000 (pendiente)

---

### 4. Belleza y Cuidado Personal Demo (belleza-demo)

**Admin del Tenant:**
- Email: admin@belleza.com
- Password: admin123
- Rol: user

**Usuarios de Prueba:**
| Email | Password | Rol |
|-------|----------|-----|
| cliente1@belleza.com | password123 | client |
| user@belleza.com | user123 | user |
| estilista@belleza.com | estilista123 | user |

**Servicios:**
- Corte de Cabello - $25,000

**Citas de Prueba:**
- Cita #1: Ana Garcia - 21/Feb/2026 14:00 - Corte y peinado (pendiente)
- Cita #2: Sofia Torres - 22/Feb/2026 10:00 - Coloración (pendiente)
- Cita #3: Miguel Reyes - 24/Feb/2026 16:00 - Corte varonil (pendiente)

---

## URLs de Acceso

### Frontend (Vercel)
- URL: https://nexora-app.vercel.app

### Backend (Railway)
- URL: https://nexora-app-production-3199.up.railway.app

### Panel Admin (Por tenant)
- https://nexora-app.vercel.app/dashboard/{tenantId}

### Reservas/Citas (Público)
- https://nexora-app.vercel.app/book/{tenantId}

---

## Notas

1. Todos los usuarios tienen `isActive: true`
2. Los pedidos están en estado `pending` con pago `pending`
3. Las citas están en estado `pending`
4. Los enlaces de pago de MercadoPago son de prueba
5. El token JWT expira en 7 días

## Cómo probar el flujo

### Flujo de Pedidos (Restaurante/Tienda):
1. Ir a https://nexora-app.vercel.app/book/restaurante-demo
2. Seleccionar productos
3. Completar datos del cliente
4. Verificar que se crea el pedido en estado "pending"
5. El admin puede ver el pedido en el dashboard

### Flujo de Citas (Clínica/Belleza):
1. Ir a https://nexora-app.vercel.app/book/clinica-demo
2. Seleccionar servicio
3. Elegir fecha y hora
4. Completar datos del cliente
5. Verificar que se crea la cita en el dashboard

### Acceso al Dashboard:
1. Ir a https://nexora-app.vercel.app/auth/login
2. Ingresar con credenciales de admin
3. Ver dashboard con métricas del tenant
