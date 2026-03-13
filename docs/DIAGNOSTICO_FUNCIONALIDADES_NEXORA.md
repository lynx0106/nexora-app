# Diagnóstico de Funcionalidades — Nexora App

**Fecha:** 12 de marzo de 2026  
**Base:** Core de la plataforma SaaS multi-tenant  
**URL:** https://nexora-app.online

---

## 1. Visión del Core

Nexora es una **plataforma SaaS multi-tenant** para gestión empresarial multisector (restaurantes, consultorios, tiendas, servicios). El core incluye:

- **Autenticación y roles** (superadmin, admin, doctor/support, user)
- **Multi-tenant** con aislamiento por `tenant_id`
- **Productos/Catálogo** + **Pedidos** (retail/ecommerce)
- **Agenda/Citas** (servicios/restaurantes)
- **Chat en tiempo real** (WebSocket)
- **Mensajería y notificaciones**
- **IA conversacional** (OpenAI)
- **Pagos** (MercadoPago, efectivo)
- **Automatizaciones** y **auditoría**

---

## 2. Estado por Funcionalidad

### 2.1 Autenticación y Usuarios

| Funcionalidad           | Estado  | Notas                                                                 |
|-------------------------|---------|-----------------------------------------------------------------------|
| Login (email/password)  | ✅ OK   | JWT, cookies httpOnly                                                 |
| Registro de tenant      | ✅ OK   | Creación de empresa + admin inicial                                  |
| Gestión de usuarios     | ✅ OK   | CRUD por tenant, roles, contraseña temporal en servidor               |
| Invitaciones            | ✅ OK   | Módulo invitations, tokens con expiración                             |
| Recuperación de contraseña | ⚠️ Parcial | MailService con reset; flujo frontend no verificado                   |
| Logout                  | ✅ OK   | Borrado de cookies y localStorage                                     |

---

### 2.2 Multi-tenant y Empresas

| Funcionalidad        | Estado  | Notas                                                              |
|----------------------|---------|--------------------------------------------------------------------|
| Crear tenant         | ✅ OK   | Registro con datos de negocio                                      |
| Configurar tenant    | ✅ OK   | Logo, sector, horarios, moneda, tablas (restaurante)                |
| Selector de tenant   | ✅ OK   | Superadmin puede cambiar entre empresas                            |
| RLS por tenant       | ✅ OK   | Políticas en Supabase para datos sensibles                         |
| TenantsSection       | ✅ OK   | Lista de empresas para superadmin                                  |

---

### 2.3 Productos y Catálogo

| Funcionalidad       | Estado  | Notas                                                              |
|---------------------|---------|--------------------------------------------------------------------|
| CRUD productos      | ✅ OK   | ProductsSection con imagen, precio, stock, duración                 |
| Importar CSV        | ✅ OK   | Endpoint `/products/upload`                                         |
| Imagen de producto  | ✅ OK   | Storage + URL, soporte file/URL                                     |
| Productos por tenant| ✅ OK   | Aislamiento correcto                                               |
| Servicios (agenda)  | ✅ OK   | Entidad Service para restaurantes/servicios                         |

---

### 2.4 Pedidos

| Funcionalidad           | Estado  | Notas                                                              |
|-------------------------|---------|--------------------------------------------------------------------|
| Crear pedido (dashboard)| ✅ OK   | CreateOrderModal con cliente, items, método de pago                 |
| Crear pedido (público)  | ✅ OK   | book/[tenantId] con carrito y checkout                             |
| Listar pedidos          | ✅ OK   | OrdersSection con filtros por tenant                               |
| Cambiar estado          | ✅ OK   | pending → completed → cancelled                                    |
| Detalle de pedido       | ✅ OK   | Modal con items, cliente, dirección                                |
| Estado de pago          | ✅ OK   | pending/paid, actualización manual y por webhook                    |
| Top productos vendidos  | ✅ OK   | Métrica en OrdersSection                                           |
| Vista pública estado   | ✅ OK   | `/orders/status/[id]` Server Component con token                  |

---

### 2.5 Agenda y Citas

| Funcionalidad        | Estado  | Notas                                                              |
|----------------------|---------|--------------------------------------------------------------------|
| CRUD citas           | ✅ OK   | AgendaSection con formulario                                       |
| Asignar doctor       | ✅ OK   | Campo doctor en cita                                               |
| Estados (pending, confirmed, completed, cancelled) | ✅ OK |                                       |
| Crear cliente inline | ✅ OK   | Modal nuevo cliente desde agenda                                   |
| Slots disponibles    | ✅ OK   | book/[tenantId] consulta disponibilidad                            |
| Recordatorios        | ✅ OK   | TasksService scheduler envía emails                                |
| Pax / ocasión (restaurante) | ✅ OK | Campos específicos por sector                              |

---

### 2.6 Chat en Tiempo Real

| Funcionalidad        | Estado  | Notas                                                              |
|----------------------|---------|--------------------------------------------------------------------|
| WebSocket (Socket.io)| ✅ OK   | Chat con namespaces por tenant                                    |
| Tabs (Interno, Cliente, Soporte) | ✅ OK | ChatSection y ChatWidget                                |
| Mensajes texto       | ✅ OK   | Envío y recepción en tiempo real                                   |
| Imágenes/archivos    | ✅ OK   | Subida y visualización                                             |
| IA automática        | ✅ OK   | OpenAI con handoff a humano                                        |
| Historial            | ✅ OK   | Carga de mensajes previos                                          |
| Superadmin multi-tenant | ✅ OK | Selector de empresa para chatear como cualquiera               |

---

### 2.7 Pagos (MercadoPago)

| Funcionalidad        | Estado  | Notas                                                              |
|----------------------|---------|--------------------------------------------------------------------|
| Crear preferencia MP | ✅ OK   | payments.service con circuit breaker                               |
| Link de pago         | ✅ OK   | Se genera al crear pedido con paymentMethod=card                   |
| Webhook MP           | ✅ OK   | Procesamiento de notificaciones, actualiza paymentStatus           |
| Efectivo             | ✅ OK   | paymentMethod=cash                                                 |
| **Redirect post-pago** | ❌ Gap | Backend redirige a `/orders/thank-you` pero **no existe** esa ruta. Existe `/orders/status/[id]`. Cliente puede recibir 404 tras pagar. |

---

### 2.8 Notificaciones y Correo

| Funcionalidad           | Estado  | Notas                                                              |
|-------------------------|---------|--------------------------------------------------------------------|
| Notificaciones in-app   | ✅ OK   | NotificationsDropdown, WebSocket                                   |
| Email ( MailService)    | ✅ OK   | Confirmación pedido, recordatorio cita, invitación, reset password |
| Marcar como leído       | ✅ OK   | Endpoint `/notifications/:id/read`                                 |
| Push (navegador)        | ⚠️ Parcial | Módulo push; requiere configuración y permisos de usuario       |

---

### 2.9 IA (OpenAI)

| Funcionalidad        | Estado  | Notas                                                              |
|----------------------|---------|--------------------------------------------------------------------|
| Respuestas automáticas| ✅ OK   | AiService con prompts por scope (CUSTOMER, SUPPORT, INTERNAL)      |
| Handoff a humano     | ✅ OK   | Detecta "quiero hablar con humano", "persona", "asesor"            |
| Uso de @ai en interno | ✅ OK   | Mensajes con @ai o "bot" activan respuesta                        |
| Config por tenant    | ✅ OK   | openaiApiKey, aiModel, prompts de ventas/soporte en tenant         |
| Circuit breaker      | ✅ OK   | Protección ante fallos de OpenAI                                   |
| Tracking de uso      | ✅ OK   | ai_usage, endpoint /ai/usage/stats                                 |

---

### 2.10 Automatizaciones

| Funcionalidad        | Estado  | Notas                                                              |
|----------------------|---------|--------------------------------------------------------------------|
| CRUD automatizaciones| ✅ OK   | UI en configuracion/automatizaciones                               |
| Tipos: reminder, bulk_message, individual_message, cleanup | ✅ OK |                            |
| Scheduler (cron)     | ✅ OK   | automations.scheduler ejecuta tareas                              |
| Recordatorios citas  | ✅ OK   | tasks.service envía emails                                         |
| Limpieza tokens      | ✅ OK   | cleanup de invitaciones expiradas                                  |

---

### 2.11 Dashboard y Reportes

| Funcionalidad        | Estado  | Notas                                                              |
|----------------------|---------|--------------------------------------------------------------------|
| StatsSection         | ✅ OK   | Citas hoy, pedidos, ventas, actividad reciente                     |
| Gráfico de ventas    | ✅ OK   | Barras por día                                                     |
| Top products         | ✅ OK   | En StatsSection y OrdersSection                                   |
| ReportsModule        | ✅ OK   | Endpoints de reportes; UI no explorada en detalle                  |
| Tenant summary       | ✅ OK   | Superadmin: tenants, usuarios totales/activos                     |

---

### 2.12 Auditoría y Configuración

| Funcionalidad        | Estado  | Notas                                                              |
|----------------------|---------|--------------------------------------------------------------------|
| Audit logs           | ✅ OK   | AuditInterceptor global, AuditSection en dashboard                 |
| SettingsSection      | ✅ OK   | Perfil usuario, tenant, MercadoPago, OpenAI, bots                  |
| Idioma (i18n)        | ✅ OK   | Español/Inglés, LanguageSwitcher                                   |
| Layout dark mode     | ✅ OK   | Unificado en dashboard (marzo 2026)                                |

---

### 2.13 Página Pública (book/[tenantId])

| Funcionalidad        | Estado  | Notas                                                              |
|----------------------|---------|--------------------------------------------------------------------|
| Ver tenant           | ✅ OK   | Logo, portada, datos públicos                                      |
| Reservar cita        | ✅ OK   | Servicios, slots, datos cliente, validación                        |
| Comprar productos    | ✅ OK   | Carrito, checkout, dirección envío                                 |
| Sin login            | ✅ OK   | Creación de usuario automática si no existe                       |
| Toast en lugar de alert | ✅ OK | Usabilidad mejorada                                            |

---

### 2.14 App Móvil (Expo)

| Funcionalidad        | Estado  | Notas                                                              |
|----------------------|---------|--------------------------------------------------------------------|
| Proyecto             | ✅ OK   | nexora-mobile, Expo 52                                             |
| Auth, catálogo, pedidos | ✅ OK | Según PLAN_APP_MOVIL                                       |
| Chat y citas         | ✅ OK   | Fase 5 completada                                                   |
| Deploy               | ⚠️ Parcial | EAS Build para Android; estado de producción no verificado     |

---

## 3. Gaps y Riesgos Identificados

| Prioridad | Gap | Impacto |
|-----------|-----|---------|
| **Alta**  | Ruta `/orders/thank-you` no existe; MercadoPago redirige ahí tras pago | Cliente recibe 404 después de pagar |
| Media    | Recuperación de contraseña: flujo frontend puede estar incompleto     | Usuario no puede restablecer contraseña |
| Media    | Push notifications: depende de permisos y configuración               | Notificaciones push pueden no llegar    |
| Baja     | Documentación con URLs obsoletas (3199 vs 3104)                        | Confusión al seguir guías               |
| Baja     | Algunos tests backend fallan (histórico en ANALISIS)                   | Regresiones posibles                    |

---

## 4. Resumen Ejecutivo

| Dimensión        | Estado  | Puntuación estimada |
|------------------|---------|---------------------|
| Core funcional   | ✅ Sólido | 90%                |
| Autenticación    | ✅ OK   | 95%                 |
| Productos/Pedidos| ✅ OK   | 95%                 |
| Agenda/Citas     | ✅ OK   | 95%                 |
| Chat + IA        | ✅ OK   | 90%                 |
| Pagos            | ⚠️ 1 gap | 85% (thank-you)    |
| Automatizaciones | ✅ OK   | 90%                 |
| Notificaciones   | ⚠️ Parcial | 80%              |
| UI/UX            | ✅ OK   | 90% (dark mode unificado) |
| App móvil        | ⚠️ Parcial | 75%              |

### Conclusión

El **core de Nexora está operativo** y cubre los flujos principales: auth, multi-tenant, productos, pedidos, agenda, chat, IA y pagos. La única **brecha crítica** es la ruta de post-pago de MercadoPago (`/orders/thank-you` inexistente). El resto son mejoras incrementales.

**Acción prioritaria:** Crear la página `/orders/thank-you` o actualizar `back_urls` en payments.service para redirigir a `/orders/status/[orderId]` con el token correspondiente.
