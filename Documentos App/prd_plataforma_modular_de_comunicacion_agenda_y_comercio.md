# PRD – Plataforma Modular Multi‑Industria (SaaS)

## 1. Visión del Producto
Desarrollar una **plataforma SaaS modular, multi‑industria y multi‑tenant** que combine:
- Mensajería tipo WhatsApp
- Agenda / reservas
- Red social privada
- Catálogo de productos y pedidos
- CRM ligero
- Dashboards en tiempo real
- Inteligencia Artificial por rubro

El sistema debe ser **escalable, seguro, configurable por módulos y de bajo costo inicial**, permitiendo que cada cliente active solo las funcionalidades que necesita.

---

## 2. Objetivos del Producto
- Centralizar comunicación negocio ↔ clientes
- Facilitar reservas, pedidos y fidelización
- Proveer analítica gerencial en tiempo real
- Adaptarse a múltiples industrias sin reescribir código
- Garantizar **seguridad estricta de datos personales y comerciales**

---

## 3. Alcance Inicial (MVP Vendible)
Incluye:
- Core de usuarios y autenticación
- Mensajería interna
- Agenda / reservas
- Branding por cliente
- Dashboard básico
- Seguridad completa de datos

No incluye en MVP:
- Pagos en línea
- Geolocalización en tiempo real
- Matching tipo Uber

---

## 4. Roles y Permisos

### 4.1 Super Admin (Plataforma)
- Crear y gestionar tenants (clientes)
- Activar/desactivar módulos
- Definir límites de uso
- Configurar idiomas base
- Gestionar políticas de seguridad

### 4.2 Admin del Cliente (Dueño del negocio)
- Gestionar usuarios internos
- Configurar branding
- Acceder a dashboard
- Gestionar agenda, catálogo y contenido

### 4.3 Staff / Empleados
- Comunicación
- Gestión operativa (citas, pedidos)

### 4.4 Usuario Final (Cliente)
- Perfil personal
- Mensajería
- Reservas
- Pedidos
- Interacciones (comentarios, reacciones)

---

## 5. Módulos del Sistema

### 5.1 Core (Obligatorio)
- Autenticación (correo / Gmail)
- Gestión de usuarios y roles
- Multi‑tenant
- Configuración de idioma y tema
- Inbox de notificaciones

### 5.2 Mensajería Avanzada
- Texto, imágenes, videos, documentos
- Notas de voz
- Estados de lectura

### 5.3 Agenda / Reservas
- Calendario
- Validación anti‑cruce
- Confirmaciones automáticas
- Recordatorios (24h / 2h)

### 5.4 Feed / Red Privada
- Publicaciones
- Reacciones
- Comentarios

### 5.5 Catálogo y Pedidos
- Catálogo con imágenes y precios
- Carrito
- Pedido sin pago integrado
- Entrega o recogida
- Estados del pedido

### 5.6 Dashboard Gerencial
- Actividad en tiempo real
- Reservas
- Pedidos
- Engagement
- Reportes exportables
- Métricas de uso de IA y consumo de tokens
- Visualización de costos estimados por IA

### 5.7 IA por Rubro (Opcional Premium)
- Transcripción de voz
- Traducción multilenguaje
- Respuestas contextuales
- Base de conocimiento por cliente
- Integración por API con múltiples proveedores de IA
- Soporte multi‑proveedor y multi‑API Key
- Configuración flexible del modelo y proveedor por tenant

---

## 6. Reglas de Negocio Clave
- Modularidad total (feature flags)
- Datos ingresados una sola vez por usuario
- Sin pagos procesados dentro del sistema (MVP)
- Configuración por industria vía plantillas

---

## 7. Seguridad de la Información (CRÍTICO)

### 7.1 Principios de Seguridad
- **Confidencialidad**: solo usuarios autorizados acceden a datos
- **Integridad**: los datos no pueden ser alterados sin permiso
- **Disponibilidad**: el sistema debe ser accesible y resiliente

---

### 7.2 Seguridad de Autenticación
- Hashing de contraseñas (bcrypt / argon2)
- Autenticación OAuth segura (Gmail)
- Tokens JWT con expiración
- Refresh tokens rotativos
- Protección contra fuerza bruta

---

### 7.3 Control de Acceso (RBAC)
- Acceso basado en roles
- Validación de permisos en backend
- Aislamiento estricto entre tenants
- Ningún cliente puede acceder a datos de otro

---

### 7.4 Seguridad de Datos
- Base de datos PostgreSQL con:
  - Cifrado en reposo
  - Backups automáticos
- Cifrado en tránsito (HTTPS / TLS)
- Separación lógica por tenant

---

### 7.5 Protección de Información Sensible
- No almacenar datos bancarios
- No procesar pagos
- Datos personales mínimos necesarios
- Campos sensibles cifrados (direcciones, teléfonos)

---

### 7.6 Auditoría y Trazabilidad
- Logs de acceso
- Registro de acciones críticas:
  - Creación / eliminación de usuarios
  - Cambios de permisos
  - Activación de módulos
- Monitoreo de actividad sospechosa

---

### 7.7 Cumplimiento y Buenas Prácticas
- Principios alineados con:
  - Ley de Protección de Datos (Colombia – Habeas Data)
  - GDPR (a nivel conceptual)
- Políticas de privacidad por tenant
- Consentimiento explícito del usuario

---

### 7.8 Seguridad en IA
- IA desacoplada del core
- No entrenar modelos con datos sensibles
- Bases de conocimiento aisladas por cliente
- Eliminación de datos bajo solicitud
- Gestión segura de API Keys (encriptadas)
- Rotación y revocación de API Keys
- Control de acceso al uso de IA por rol

---

## 8. Stack Tecnológico Propuesto

### Integración de Inteligencia Artificial
- Arquitectura agnóstica al proveedor de IA
- Integración vía API REST
- Proveedores compatibles:
  - OpenAI / Azure OpenAI
  - Google Vertex AI
  - AWS Bedrock
  - Otros proveedores con API pública
- Modelos configurables por tenant
- Control de costos mediante límites de tokens



### Frontend
- React + Next.js
- PWA (instalable)
- Tailwind CSS

### Backend
- Node.js + NestJS
- Arquitectura modular

### Datos y Tiempo Real
- PostgreSQL
- Redis
- WebSockets

### Infraestructura
- Cloud escalable
- Contenedores
- Backups automáticos

---

## 9. Analítica de IA y Consumo

### 9.1 Vista Super Admin (SaaS)
- Consumo total de IA por período
- Consumo por tenant / negocio
- Consumo por proveedor de IA
- Tokens usados (input / output)
- Coste estimado por proveedor
- Alertas por sobreconsumo

### 9.2 Vista Admin del Cliente
- Consumo de IA del negocio
- Tokens usados por módulo (chat, reservas, pedidos)
- Coste estimado (si usa API propia)
- Recomendaciones de optimización

### 9.3 Modelos de Uso de IA
- IA incluida en la suscripción (límites definidos)
- IA con API Key del cliente (BYO‑AI)
- Modelo híbrido (fallback a IA del SaaS)

---

## 10. Roadmap

### Fase 1 – MVP
- Core
- Mensajería
- Agenda
- Seguridad
- Dashboard básico

### Fase 2 – Expansión
- Feed
- Catálogo
- Pedidos
- IA básica

### Fase 3 – Premium
- IA por rubro
- Ecosistemas (centros comerciales)
- Analítica avanzada

---

## 10. Criterios de Éxito
- Plataforma estable y segura
- Modularidad real
- Bajo costo operativo
- Fácil adopción por clientes
- Escalabilidad multi‑industria

---

**Este PRD define un producto SaaS robusto, seguro y escalable, listo para ejecución técnica y comercial.**

