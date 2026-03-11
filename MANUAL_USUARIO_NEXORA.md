# 📱 Manual de Usuario - Nexora App

## Plataforma SaaS de Gestión Empresarial

---

## 📋 Información General

**Nexora** es una plataforma SaaS multi-tenant que permite a empresas gestionar:
- Productos y catálogos
- Pedidos y ventas
- Citas y agendamientos
- Comunicación con clientes
- Equipos de trabajo

### Roles en el Sistema

| Rol | Descripción |
|-----|-------------|
| **Superadmin** | Administrador general de la plataforma. Gestiona todas las empresas. |
| **Admin** | Dueño/a o administrador de una empresa específica. |
| **Empleado** | Personal de la empresa (vendedores, doctores, cajeros). |
| **Usuario** | Cliente que reserva servicios o compra productos. |

---

## 🔐 Acceso a la Aplicación

### URL Principal
```
https://nexora-app.online
```

### Página de Reserva Pública (para clientes)
```
https://nexora-app.online/book/[nombre-de-tu-empresa]
```

Ejemplo: `https://nexora-app.online/book/mi-empresa-test`

---

## 👤 PERFIL: SUPERADMIN

El **Superadmin** es el administrador máximo de la plataforma. Puede gestionar todas las empresas y vedere información global.

### 🚀 ¿Qué puede hacer?

#### 1. Panel de Control (Resumen)
- ✅ Ver estadísticas globales de todas las empresas
- ✅ Ver lista de empresas registradas
- ✅ Ver métricas de uso de IA
- ✅ Acceder a auditoría global

#### 2. Gestión de Empresas
- ✅ Ver lista completa de empresas
- ✅ Acceder a cualquier empresa
- ✅ Monitorear actividad de todas las empresas

#### 3. Chat con Clientes
- ✅ Chatear con clientes de CUALQUIER empresa
- ✅ Seleccionar la empresa desde la cual comunicarse
- ✅ Enviar mensajes, imágenes y archivos
- ✅ Activar/desactivar IA automática para clientes

#### 4. Usuarios Globales
- ✅ Ver todos los usuarios de la plataforma
- ✅ Gestionar usuarios globales

#### 5. Auditoría
- ✅ Ver logs de todas las actividades
- ✅ Monitorear acciones de admins y empleados

### 📖 Cómo usar:

1. **Iniciar sesión** con credenciales de superadmin
2. En el **menú lateral** verás todas las opciones disponibles
3. Para cambiar entre empresas: usa el **selector de empresa** en la parte superior
4. Para chatear: ve a "Mensajes" → selecciona la empresa → selecciona el cliente

### ⚠️ Qué esperar:
- Al seleccionar una empresa, los datos del dashboard cambiarán para mostrar información de esa empresa específica
- Los mensajes de chat se envían desde la perspectiva de la empresa seleccionada
- Puedes ver productos, pedidos y citas de cualquier empresa

---

## 👔 PERFIL: ADMIN (Dueño de Empresa)

El **Admin** gestiona una empresa específica. Es el rol principal para negocios que usan Nexora.

### 🚀 ¿Qué puede hacer?

#### 1. Panel de Control ( Ver estadísticas de ventasResumen)
- ✅ del día
- ✅ Ver productos más vendidos
- ✅ Ver citas/pedidos recientes
- ✅ Ver métricas de uso de IA

#### 2. Gestión de Productos/Catálogo
- ✅ Crear nuevos productos o servicios
- ✅ Editar productos existentes
- ✅ Eliminar productos
- ✅ Subir imágenes de productos
- ✅ Configurar precios, stock y descripción
- ✅ Importar productos desde CSV
- ✅ Actualizar stock rápidamente

#### 3. Gestión de Pedidos (Retail/Ecommerce)
- ✅ Ver todos los pedidos
- ✅ Cambiar estado de pedidos (pendiente → completado → cancelado)
- ✅ Ver detalles de cada pedido
- ✅ Ver productos más vendidos

#### 4. Gestión de Citas (Servicios/Restaurantes)
- ✅ Ver agenda del día
- ✅ Ver citas programadas
- ✅ Gestionar disponibilidad
- ✅ Ver historial de citas

#### 5. Gestión de Equipo
- ✅ Invitar nuevos empleados
- ✅ Asignar roles (admin, doctor, support, employee)
- ✅ Gestionar usuarios del equipo
- ✅ Revisar desempeño

#### 6. Gestión de Clientes
- ✅ Ver lista de clientes
- ✅ Ver historial de pedidos/citas
- ✅ Gestionar información de clientes

#### 7. Chat con Clientes
- ✅ Chatear con clientes en tiempo real
- ✅ Enviar mensajes de texto
- ✅ Enviar imágenes y archivos
- ✅ Activar/desactivar IA automática
- ✅ Responder consultas de clientes

#### 8. Configuración
- ✅ Editar información de la empresa
- ✅ Configurar logo y branding
- ✅ Configurar sector (restaurante, servicio, retail)
- ✅ Gestionar integraciones

### 📖 Cómo usar:

**Crear un producto:**
1. Ve al menú lateral → "Catálogo"
2. Haz clic en "+ Nuevo Producto"
3. Completa: nombre, precio, descripción, stock
4. Sube una imagen (opcional)
5. Haz clic en "Crear Producto"

**Gestionar un pedido:**
1. Ve a "Pedidos"
2. Busca el pedido que deseas modificar
3. Haz clic en el estado actual para cambiarlo
4. Selecciona el nuevo estado

**Chatear con un cliente:**
1. Ve a "Mensajes"
2. Selecciona la pestaña "Clientes"
3. Selecciona el cliente de la lista
4. Escribe y envía tu mensaje

### ⚠️ Qué esperar:
- Los productos que crees aparecerán automáticamente en tu página pública de reservas
- Los clientes pueden ver tus productos y realizar pedidos sin iniciar sesión
- El chat te permite comunicación directa con clientes

---

## 👥 PERFIL: EMPLEADO

El **Empleado** es el personal que trabaja en la empresa. Puede tener diferentes roles internos.

### 🚀 ¿Qué puede hacer?

#### Según el tipo de empleado:

**Doctor / Profesional de servicios:**
- ✅ Ver su agenda de citas
- ✅ Gestionar sus citas del día
- ✅ Ver historial de clientes

**Cajero / Retail:**
- ✅ Ver pedidos entrantes
- ✅ Actualizar estado de pedidos
- ✅ Ver productos disponibles

**Soporte:**
- ✅ Chatear con clientes
- ✅ Responder consultas

### 📖 Cómo usar:

1. **Inicia sesión** con tus credenciales
2. Verás solo las secciones que corresponden a tu rol
3. Si eres doctor: tu agenda se mostrará automáticamente
4. Si eres cajero: verás los pedidos pendientes

### ⚠️ Qué esperar:
- No puedes crear ni eliminar productos
- No puedes invitar nuevos empleados
- No puedes cambiar la configuración de la empresa
- Solo ves información relevante para tu trabajo

---



## 🙋 PERFIL: USUARIO (Cliente)

El **Usuario** es el cliente final que reserva servicios o compra productos.

### 🚀 ¿Qué puede hacer?

#### 1. Ver Catálogo Público
- ✅ Navegar por productos/servicios de la empresa
- ✅ Ver precios y disponibilidad
- ✅ Ver imágenes y descripciones

#### 2. Reservar Citas (Servicios)
- ✅ Seleccionar servicio deseado
- ✅ Elegir fecha y hora disponible
- ✅ Confirmar la reserva
- ✅ Recibir confirmación

#### 3. Realizar Pedidos (Retail)
- ✅ Agregar productos al carrito
- ✅ Seleccionar método de pago
- ✅ Confirmar el pedido
- ✅ Recibir confirmación

#### 4. Comunicación
- ✅ Chatear con la empresa
- ✅ Recibir respuestas (incluidas de IA automática)
- ✅ Enviar mensajes de texto

#### 5. Historial
- ✅ Ver mis reservas pasadas
- ✅ Ver mis pedidos anteriores
- ✅ Ver estado de pedidos activos

### 📖 Cómo usar:

**Reservar una cita:**
1. Ve a: `https://nexora-app.online/book/[nombre-empresa]`
   - Ejemplo: `https://nexora-app.online/book/mi-empresa-test`
2. Selecciona el servicio deseado
3. Elige fecha y hora disponible
4. Ingresa tus datos de contacto
5. Confirma la reserva
6. ¡Recibes confirmación!

**Realizar un pedido:**
1. Ve a la página pública de la empresa
2. Navega por los productos disponibles
3. Haz clic en "Agregar" en los productos que deseas
4. Revisa tu carrito
5. Selecciona método de pago
6. Confirma el pedido

**Chatear:**
1. Desde la página pública, haz clic en el **widget de chat** (esquina inferior derecha)
2. Escribe tu mensaje
3. ¡Recibes respuesta automática o de un empleado!

### ⚠️ Qué esperar:
- No necesitas cuenta para comprar/reservar
- Puedes usar la página pública sin iniciar sesión
- El sistema te pide datos de contacto al reservar/comprar
- Puedes recibir respuestas automáticas de IA
- Un empleado puede atenderte en cualquier momento

---

## 💬 CHAT - Guía Completa

El sistema de chat tiene diferentes comportamientos según el rol:

### Para Admins/Superadmin:

| Pestaña | Descripción | Con quién chatea |
|---------|-------------|-------------------|
| **Interno** | Comunicación del equipo | Con otros empleados de la empresa |
| **Clientes** | Atención al cliente | Con clientes que han reservado/comprado |
| **Soporte** | Mensajes directos | Comunicación específica |

### Para Usuarios (Clientes):
- Solo pueden chatear desde la página pública
- El chat aparece como widget flotante
- Pueden recibir respuestas automáticas de IA
- Un empleado puede tomar la conversación

### Enviar archivos:
- Admins pueden enviar imágenes y PDFs en el chat
- El archivo se sube y el receptor puede verlo/descargarlo

---

## 🛒 PRODUCTOS Y CATÁLOGO

### Para Administradores:

**Crear producto:**
1. Ve a "Catálogo" o "Productos"
2. Haz clic en "+ Nuevo Producto"
3. Completa los campos:
   - **Nombre:** (requerido) Ej: "Corte de cabello"
   - **Precio:** (requerido) Ej: 15.00
   - **Descripción:** (opcional) Ej: "Corte clásico con-machine"
   - **Stock:** (para retail) Cantidad disponible
   - **Duración:** (para servicios) Tiempo en minutos
   - **Imagen:** Sube una foto del producto
4. Guarda el producto

**Editar producto:**
1. Ve al catálogo
2. Haz clic en el botón de editar (lápiz)
3. Modifica los campos necesarios
4. Guarda los cambios

**Eliminar producto:**
1. Ve al catálogo
2. Haz clic en el botón de eliminar (basura)
3. Confirma la eliminación

### Para Clientes:

**Ver productos:**
1. Ve a la página pública: `https://nexora-app.online/book/[empresa]`
2. Los productos se muestran automáticamente
3. Verás: nombre, imagen, precio, disponibilidad

---

## 📊 ESTADÍSTICAS Y REPORTES

### Para Admins:

**Panel de Control muestra:**
- Ventas del día
- Pedidos del día
- Citas del día
- Productos más vendidos
- Ingresos recientes
- Uso de IA

**Puedes filtrar por:**
- Período de tiempo
- Empresa (si eres superadmin)

---

## ⚙️ CONFIGURACIÓN

### Para Admins:

**Información de la empresa:**
- Nombre de la empresa
- Sector (restaurante, servicio, retail)
- Descripción
- Logo
- Colores

**Opciones de sector:**

| Sector | Características |
|--------|----------------|
| **Restaurante** | Mesas, reservas, comandas |
| **Servicio** | Citas, profesionales, agenda |
| **Retail** | Productos, inventario, pedidos |

---

## 🔗 ENLACES ÚTILES

| Recurso | URL |
|---------|-----|
| Login | https://nexora-app.online |
| Página de prueba | https://nexora-app.online/book/mi-empresa-test |
| Dashboard | https://nexora-app.online/dashboard |

---

## ❓ PREGUNTAS FRECUENTES

**¿Necesito cuenta para comprar?**
No, los clientes pueden comprar sin cuenta. Solo necesitan proporcionar datos de contacto.

**¿Cómo creo una empresa?**
Contacta al superadmin para que cree tu empresa en la plataforma.

**¿Puedo tener múltiples empleados?**
Sí, como admin puedes invitar tantos empleados como necesites.

**¿El sistema envía notificaciones?**
Sí, los clientes reciben confirmación por email (configurable).

**¿Funciona en móvil?**
Sí, la aplicación es completamente responsive y funciona en cualquier dispositivo.

---

## 📝 Notas para Pruebas

### Cuentas de Prueba Disponibles:

**Superadmin:**
- Email: `superadmin@nexora.com`
- Contraseña: (consultar con el administrador)

**Admin de empresa:**
- Cada empresa tiene sus propias credenciales
- Consulta con el superadmin para crear una empresa de prueba

### Qué probar:

1. ✅ Crear y gestionar productos
2. ✅ Realizar pedidos desde la página pública
3. ✅ Reservar citas
4. ✅ Probar el chat como cliente
5. ✅ Responder chat como admin
6. ✅ Invitar empleados
7. ✅ Ver estadísticas
8. ✅ Configurar la empresa

---

*Documento creado para usuarios de prueba - Nexora App v2026.02*
