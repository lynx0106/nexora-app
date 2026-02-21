# 🔐 Credenciales de Testing - Nexora App

> **Fecha de creación:** 19 de febrero de 2026  
> **Propósito:** Datos de prueba para testing de la aplicación móvil Nexora  
> **Nota:** Estos datos son temporales y se limpiarán después del testing

---

## 👑 Superadmin

| Campo | Valor |
|-------|-------|
| **Email** | `superadmin@saas.com` |
| **Contraseña** | `Super123!` |
| **Rol** | `superadmin` |
| **Tenant** | `system` |

---

## 🏢 Empresa 1: Restaurante El Sabor

**Tenant ID:** `restaurante-sabor`  
**Sector:** Restaurante

### Admin
| Campo | Valor |
|-------|-------|
| **Email** | `admin@sabor.com` |
| **Contraseña** | `Admin123!` |
| **Rol** | `admin` |

### Staff
| Email | Nombre | Rol |
|-------|--------|-----|
| `mesero1@sabor.com` | Carlos Mesero | user |
| `cocina@sabor.com` | Maria Cocina | user |
| `caja@sabor.com` | Juan Caja | user |

**Contraseña para todo el staff:** `Admin123!`

### Productos/Servicios Creados
- Bandeja Paisa ($25,000)
- Ajiaco Santafereño ($18,000)
- Empanadas Colombianas ($8,000)
- Arepa con Queso ($5,000)
- Churrasco ($32,000)
- Pescado Frito ($28,000)
- Limonada Natural ($6,000)
- Jugo de Mango ($7,000)
- Cerveza Nacional ($5,000)
- Postre de Tres Leches ($9,000)
- Flan de Caramelo ($7,500)
- Sopa de Lentejas ($12,000)
- Pollo a la Plancha ($22,000)
- Arroz con Pollo ($20,000)
- Gaseosa 400ml ($4,500)

---

## 🏢 Empresa 2: Clínica Dental Sonrisa Perfecta

**Tenant ID:** `clinica-sonrisa`  
**Sector:** Salud

### Admin
| Campo | Valor |
|-------|-------|
| **Email** | `admin@sonrisa.com` |
| **Contraseña** | `Admin123!` |
| **Rol** | `admin` |

### Staff
| Email | Nombre | Rol |
|-------|--------|-----|
| `doctor@sonrisa.com` | Dr. Fernando Gómez | user |
| `recepcion@sonrisa.com` | Ana Recepción | user |
| `asistente@sonrisa.com` | Laura Asistente | user |

**Contraseña para todo el staff:** `Admin123!`

### Servicios Creados
- Limpieza Dental Profunda ($80,000) - 60 min
- Blanqueamiento Dental ($350,000) - 90 min
- Ortodoncia Brackets ($2,800,000) - 120 min
- Ortodoncia Invisible ($4,500,000) - 60 min
- Implante Dental ($2,500,000) - 180 min
- Endodoncia ($450,000) - 90 min
- Extracción Simple ($120,000) - 45 min
- Extracción de Muela del Juicio ($450,000) - 120 min
- Corona Dental ($850,000) - 60 min
- Puente Dental ($2,200,000) - 90 min
- Prótesis Removible ($1,200,000) - 60 min
- Carillas de Porcelana ($950,000) - 60 min

---

## 🏢 Empresa 3: Fashion Store

**Tenant ID:** `fashion-store`  
**Sector:** Retail

### Admin
| Campo | Valor |
|-------|-------|
| **Email** | `admin@fashion.com` |
| **Contraseña** | `Admin123!` |
| **Rol** | `admin` |

### Staff
| Email | Nombre | Rol |
|-------|--------|-----|
| `vendedor@fashion.com` | Pedro Vendedor | user |
| `cajera@fashion.com` | Sofia Cajera | user |
| `bodega@fashion.com` | Diego Bodega | user |

**Contraseña para todo el staff:** `Admin123!`

### Productos Creados
- Camiseta Básica Blanca ($45,000)
- Camiseta Básica Negra ($45,000)
- Jeans Slim Fit Azul ($120,000)
- Jeans Clásico Negro ($115,000)
- Chaqueta de Cuero ($180,000)
- Sudadera con Capucha ($95,000)
- Vestido Casual ($85,000)
- Blusa Elegante ($75,000)
- Zapatos Deportivos ($180,000)
- Zapatos Formales ($220,000)
- Sandalias ($65,000)
- Cinturón de Cuero ($55,000)
- Gorra Snapback ($45,000)
- Bufanda de Lana ($38,000)
- Medias Pack x3 ($25,000)

---

## 🏢 Empresa 4: Barbería Estilo Urbano

**Tenant ID:** `barberia-estilo`  
**Sector:** Belleza

### Admin
| Campo | Valor |
|-------|-------|
| **Email** | `admin@estilo.com` |
| **Contraseña** | `Admin123!` |
| **Rol** | `admin` |

### Staff
| Email | Nombre | Rol |
|-------|--------|-----|
| `barbero1@estilo.com` | Luis Barbero | user |
| `barbero2@estilo.com` | Andrés Estilista | user |
| `recepcion@estilo.com` | Camila Recepción | user |

**Contraseña para todo el staff:** `Admin123!`

### Servicios Creados
- Corte Clásico ($25,000) - 45 min
- Corte Moderno ($30,000) - 60 min
- Afeitado Tradicional ($20,000) - 30 min
- Afeitado con Diseño ($28,000) - 45 min
- Arreglo de Barba ($18,000) - 30 min
- Corte + Barba ($40,000) - 75 min
- Tratamiento Facial ($35,000) - 45 min
- Coloración ($55,000) - 90 min
- Mechas/Reflejos ($75,000) - 120 min
- Tratamiento Capilar ($45,000) - 60 min
- Corte Infantil ($20,000) - 40 min
- Paquete Novio ($85,000) - 120 min

---

## 📱 Acceso a la App Móvil

### Backend (API)
```
https://nexora-app-production-3199.up.railway.app
```

### Endpoints de Autenticación
- **Login:** `POST /auth/login`
- **Registro:** `POST /auth/register`

### Ejemplo de Login
```json
{
  "email": "admin@sabor.com",
  "password": "Admin123!"
}
```

---

## 📝 Notas Importantes

1. **Contraseñas:**
   - Todos los usuarios de prueba usan: `Admin123!`
   - El superadmin usa: `Super123!`

2. **Datos de Prueba:**
   - Los tenants fueron creados exitosamente
   - Los usuarios staff no pudieron ser creados debido a restricciones de permisos (requieren autenticación como admin del tenant)
   - Los productos/servicios deben ser creados manualmente por cada admin de tenant

3. **Para Testing:**
   - Usa cualquiera de los admins para hacer login en la app móvil
   - Cada admin tiene acceso completo a su tenant
   - Puedes crear usuarios staff adicionales desde el panel de admin

4. **Limpieza:**
   - Estos datos son solo para testing
   - Se recomienda limpiar la base de datos después de las pruebas
   - Los tenants pueden ser eliminados desde el panel de superadmin

---

## 🚀 Scripts Disponibles

### Seed de Datos
```bash
cd backend
npx ts-node scripts/seed-test-data-via-api.ts
```

### Verificación de Login
```bash
cd backend
npx ts-node scripts/verify-test-logins.ts
```

---

## 📊 Resumen de Datos Creados

| Entidad | Cantidad |
|---------|----------|
| Superadmins | 1 |
| Tenants | 4 |
| Admins | 4 |
| Staff (pendiente) | 12 |
| Productos/Servicios (pendiente) | ~60 |

---

**Última actualización:** 19 de febrero de 2026  
**Creado por:** Kilo Code - Modo Code
