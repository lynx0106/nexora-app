# Resumen de Implementación: Funcionalidades del Sector Restaurante

**Fecha:** 25 de Enero de 2026
**Autor:** Lynx IA (Persona: Experto Senior)
**Contexto:** Adaptación de NEXORA para soportar flujos específicos del sector gastronómico y refinar el Control de Acceso Basado en Roles (RBAC).

---

## 1. Objetivo General
Transformar la plataforma para que se adapte dinámicamente a las necesidades de un **Restaurante** sin perder la capacidad de servir a otros sectores (Retail, Salud, etc.), asegurando que cada rol (Superadmin, Admin, Usuario/Cliente) vea y pueda hacer solo lo que le corresponde.

## 2. Funcionalidades Implementadas

### A. Gestión de Reservas (Agenda Adaptada)
El módulo de citas se transformó en un sistema de reservas completo para restaurantes.
*   **Campos Nuevos:**
    *   `pax`: Número de personas para la mesa.
    *   `occasion`: Motivo de la reserva (Cumpleaños, Aniversario, Reunión, etc.).
    *   `status`: Mantiene el flujo de confirmación.
*   **Flexibilidad de Staff:**
    *   A diferencia de una cita médica, asignar un camarero/staff es **opcional**.
    *   El sistema maneja internamente la asignación nula sin errores.
*   **Notificaciones Inteligentes:**
    *   Alertas visuales en el dashboard para "Ocasiones Especiales" (ej. "¡Ocasión Especial: Aniversario!").
    *   Terminología adaptada: "Nueva Reserva" vs "Nueva Cita".

### B. Menú y Productos
El catálogo de productos se flexibilizó para funcionar como un Menú Digital.
*   **Precio Opcional:** Se permite crear ítems sin precio fijo (útil para "Precio según mercado" o promociones).
*   **Especificaciones:** Nuevo campo para detallar ingredientes, alérgenos o notas del chef.

### C. Configuración del Local
Los administradores del restaurante ahora tienen control sobre su capacidad operativa.
*   **Ajustes de Aforo:** Edición de `capacity` (Capacidad máxima) y `tablesCount` (Número de mesas) desde el panel de ajustes.

### D. Interfaz de Usuario (UI) Adaptativa
La interfaz cambia su lenguaje y estructura según el `sector` del tenant.
*   **Sidebar Dinámico:**
    *   Sector Salud -> Muestra "Agenda" / "Mis Citas".
    *   Sector Restaurante -> Muestra "Reservas" / "Mis Reservas".
    *   Sector Retail -> Muestra "Pedidos" / "Mis Pedidos".
*   **Etiquetas Contextuales:** Los formularios preguntan por "Menú" en vez de "Servicio" si es un restaurante.

### E. Seguridad y RBAC (Role-Based Access Control)
Se reforzó la seguridad para proteger la experiencia del usuario final (`user`).
*   **Visibilidad Restringida:** El rol `user` ya no ve "Resumen del Negocio" ni métricas administrativas.
*   **Redirección Automática:** Si un usuario intenta entrar al dashboard general, es redirigido automáticamente a su sección relevante (Reservas o Pedidos).
*   **Edición Limitada:** Los usuarios solo pueden editar su Avatar y datos de contacto (Teléfono/Dirección), sin acceso a configuraciones críticas del negocio.

---

## 3. Implementación Técnica (Cómo lo logramos)

### Backend (NestJS)
1.  **Entidades Extendidas:**
    *   `Appointment`: Se añadieron columnas `@Column({ nullable: true })` para `pax` y `occasion`.
    *   `Tenant`: Se añadieron `capacity` y `tablesCount`.
    *   `Product`: Se hizo nullable el `price` y se añadió `description` para especificaciones.
2.  **Lógica de Servicio (`AppointmentsService`):**
    *   Se implementó una limpieza de datos (sanitización) para eliminar `doctorId` vacíos antes de guardar, evitando errores de Foreign Key.
    *   Se inyectó lógica condicional en las notificaciones para variar el mensaje según el sector.
3.  **Scripts de Verificación:**
    *   Creación de `scripts/verify-restaurant-features.ts` para probar flujos completos (Crear Tenant Restaurante -> Configurar Mesas -> Crear Plato -> Crear Reserva -> Verificar Notificación) sin depender de la UI.

### Frontend (Next.js + React)
1.  **Renderizado Condicional:**
    *   Uso extensivo de `const isRestaurant = tenantSector === 'restaurante'` para alternar vistas.
    *   Lógica en `DashboardPage` para filtrar ítems del menú lateral según `role` y `isRetail`/`isService`.
2.  **Adaptación de Componentes:**
    *   `AgendaSection`: Formulario dual que muestra campos de "Personas/Ocasión" solo si es restaurante.
    *   `TeamSection` y `SettingsSection`: Reciben `tenantSector` como prop para ajustar textos y permisos.

---

## 4. Estado Actual
El sistema es ahora una plataforma **Multi-Sector real**. Un mismo código base sirve experiencias totalmente distintas a una Clínica Dental (Citas/Doctores) y a un Restaurante (Reservas/Mesas/Menú), manteniendo la base de datos limpia y segura.
