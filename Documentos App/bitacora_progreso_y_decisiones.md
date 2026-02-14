# Bitácora de Progreso y Decisiones - SaaS Multisector

Este documento sirve como registro central de los avances, decisiones técnicas y estado actual del proyecto para mantener claridad sobre el desarrollo.

## 📅 Estado al: 21 de Enero de 2026

### 1. Estado General (Roadmap)
Nos encontramos en la fase final del **Sprint 2 (Operación)** y adelantando tareas del **Sprint 4 (Administración)**.
- **Core / Backend:** ✅ Estable y funcional (NestJS + PostgreSQL).
- **Frontend:** ✅ Dashboard operativo con gestión de múltiples empresas.
- **Infraestructura Local:** ✅ Docker corriendo PostgreSQL y pgAdmin.

### 2. Decisiones Técnicas Clave
Estas decisiones se tomaron para optimizar recursos y adaptarse al entorno de desarrollo local:

#### A. Almacenamiento de Imágenes y Archivos (Acordado hoy)
- **Estrategia:** Almacenamiento en Disco Local (Local Filesystem).
- **Razón:** Evitar la complejidad y consumo de recursos de servicios externos (S3) o bases de datos pesadas en el entorno Docker local.
- **Estructura Definida:**
  - `/uploads/avatars/`: Para fotos de perfil de usuarios.
  - `/uploads/products/`: Para fotos de productos y documentos.
- **Estado:** Pendiente de implementar en la próxima sesión.

#### B. Modelo Multi-Tenant (Multi-Empresa)
- **Estrategia:** Aislamiento lógico por `tenantId`.
- **Implementación:**
  - **Superadmin:** Puede "ver" y gestionar todos los tenants mediante un selector global ("Context Switching").
  - **Dueños/Usuarios:** Solo ven los datos de su propio tenant.

### 3. Funcionalidades Recién Implementadas
Lo que se ha logrado en las últimas sesiones de trabajo:

#### 🏢 Dashboard Superadmin Mejorado
- **Renombrado:** Sección "Equipo" ahora es **"Empresas"**.
- **Gestión Global:** El Superadmin ahora tiene selectores de Tenant en todas las vistas (Agenda, Clientes, Catálogo, Usuarios) para ver la data de cualquier cliente.
- **Corrección de Routing:** Se arregló el error donde el Superadmin no veía la data correcta al cambiar de empresa.

#### 🛒 Catálogo Multisector
- Se verificó que el sistema soporta múltiples tipos de negocio.
- **Datos de Prueba:** Se crearon empresas ejemplo:
  - *Clínica Dental Vital* (Salud)
  - *TechSolutions* (Tecnología/Servicios)
  - *GastroBistro* (Restaurante)
  - *LegalCorp* (Servicios Jurídicos)

#### 📅 Agenda Inteligente
- **Creación Rápida:** Ahora se pueden crear pacientes ("Clientes Rápidos") directamente desde el formulario de nueva cita sin ir a otra pantalla.
- **Validación:** Los doctores y servicios se filtran correctamente por empresa.

### 4. Próximos Pasos (To-Do List)
Tareas inmediatas para continuar el desarrollo:

1.  **Implementar Subida de Archivos:**
    - Configurar Backend para recibir `multipart/form-data`.
    - Crear carpetas `/uploads/avatars` y `/uploads/products`.
    - Actualizar Frontend para permitir subir fotos en Productos y Perfil.

2.  **Completar Sprint 2 (Operación):**
    - Evaluar si se requiere un módulo de "Pedidos" separado de la Agenda.

3.  **Iniciar Sprint 3 (Comunicación):**
    - Sistema de Chat interno.

### 3. Subida de Archivos (Implementado)
- **Backend**: Módulo `UploadsModule` configurado con `Multer` para almacenamiento local (`/uploads`). Soporte para `avatars` y `products`.
- **Frontend**: Integración en `ProductsSection` (imágenes de productos) y `SettingsSection` (logo y avatar).
- **Public**: Visualización de imágenes en la página de reservas (`/book/[tenantId]`).

### 4. Sistema de Correos Transaccionales (Implementado)
- **Backend**: Implementado `MailModule` con `Nodemailer` y plantillas HTML (`Handlebars`).
- **Templates**: Plantilla profesional responsive para confirmación de pedidos (`order-confirmation.hbs`).
- **Integración**: Reemplazo del mock `NotificationsService` por envío real vía SMTP en `OrdersService`.

## 📅 Estado al: 23 de Enero de 2026
### 1. Funcionalidades Críticas Implementadas (Multi-Región)
Se ha completado una actualización mayor para soportar operaciones internacionales y el onboarding público.

#### 🌍 Expansión de Métodos de Pago
Se ha reestructurado el selector de pagos en el **Dashboard (CreateOrderModal)** para soportar múltiples regiones:
- **Colombia:** Nequi, Daviplata, PSE.
- **Estados Unidos:** Zelle, Venmo, Cash App.
- **Latam / Europa:** MercadoPago, Bizum (España).
- **Global:** Efectivo, Contra Entrega (COD), Transferencia.

#### 🚀 Onboarding Público y Automático
- **Endpoint Público:** Se habilitó `POST /tenants/register` para permitir que nuevos negocios se registren sin intervención manual de un Superadmin.
- **Flujo Simplificado:** Al registrarse, se crea automáticamente la **Empresa (Tenant)** y el **Usuario Administrador** en una sola transacción.

#### 💱 Detección Inteligente de Moneda
El sistema ahora detecta y configura automáticamente la moneda base del negocio según su ubicación:
- Selección **Colombia** -> Asigna **COP ($)**.
- Selección **Estados Unidos** -> Asigna **USD ($)**.
- Selección **España** -> Asigna **EUR (€)**.
- Selección **México** -> Asigna **MXN ($)**.

Esta configuración se refleja en todo el Dashboard (Pedidos, Catálogo) mostrando el formato de precio correcto para cada región.

### 2. Validaciones Técnicas
- Se ejecutaron scripts de validación (`verify-global-features.js`) confirmando que la creación de tenants para **US** y **Colombia** asigna correctamente sus monedas y métodos de pago.
- Backend verificado para soportar integración nativa HTTP sin dependencias externas pesadas.

---
*Este documento se actualizará periódicamente con nuevos avances.*
