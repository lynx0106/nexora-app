# PRD – Plataforma Modular Multisector (SaaS)

## Versión
Versión 2.0

## 1. Visión del Producto
Plataforma SaaS modular, white-label, orientada inicialmente a odontología y escalable a múltiples industrias (restaurantes, retail, centros comerciales, transporte, etc.). Combina:
- Agendamiento inteligente
- Comunicación tipo mensajería ("WhatsApp con superpoderes")
- Catálogos y pedidos
- CRM operativo
- Inteligencia Artificial configurable

## 2. Tipos de Usuario y Roles
- Superadmin (SaaS Owner)
- Admin del negocio (dueño / gerente)
- Usuario operativo (empleado / médico / staff)
- Usuario final (cliente / paciente)

## 3. Autenticación y Acceso
- Email + contraseña
- Login social (Google)
- Roles y permisos configurables

## 4. Gestión de Perfil de Usuario (OBLIGATORIO)
Todo usuario del sistema debe contar con un perfil persistente.

### 4.1 Datos del Perfil
- Nombre visible
- Apellido
- Correo electrónico
- Teléfono
- Foto de perfil (opcional)

### 4.2 Foto de Perfil y Avatar
- El usuario puede subir una foto de perfil.
- Si no sube foto o decide no hacerlo:
  - El sistema asigna automáticamente un avatar por defecto.
- El nombre y la foto/avatar se muestran obligatoriamente en:
  - Mensajería
  - Feed / red privada
  - Comentarios
  - Reacciones
  - Pedidos
  - Reservas
  - Vistas administrativas y dashboards

## 5. Persistencia de Datos del Usuario (OBLIGATORIO)

### 5.1 Captura Única de Datos
Los datos del usuario se capturan una sola vez:
- Al crear cuenta por primera vez
- O cuando es creado por un administrador

### 5.2 Datos Persistidos
- Nombre
- Apellido
- Correo electrónico
- Teléfono
- Dirección principal (cuando aplique)

### 5.3 Uso en Pedidos y Reservas
- En cualquier pedido o reserva:
  - Los datos se autocompletan automáticamente
  - El usuario no debe volver a ingresarlos
  - El usuario puede editarlos solo si lo desea
- Todos los registros quedan asociados al `user_id`

## 6. Agendamiento
- Calendario por negocio y por profesional
- Prevención de doble reserva
- Sugerencia automática de horarios alternos
- Notificaciones internas:
  - Confirmación inmediata
  - Recordatorio 24 horas antes
  - Recordatorio 2 horas antes

## 7. Mensajería y Red Privada
- Chat interno tipo WhatsApp
- Envío de:
  - Texto
  - Imágenes
  - Documentos
  - Videos
  - Notas de voz
- Transcripción y traducción de voz con IA
- Multilenguaje

## 8. Catálogos y Pedidos
- Catálogos con imagen, descripción y precio
- Pedido interno sin pasarela de pago (MVP)
- Selección de:
  - Domicilio o recogida
  - Forma de pago (efectivo / tarjeta / transferencia)

## 9. Inteligencia Artificial
- Conexión vía API Key
- Opciones:
  - API provista por el SaaS
  - API propia del cliente
- Casos de uso:
  - FAQ
  - Toma de pedidos
  - Reservas
- Métricas de consumo por negocio

## 10. Dashboards
### Admin del Negocio
- Reservas
- Pedidos
- Usuarios
- Actividad

### Superadmin
- Negocios activos
- Uso de módulos
- Consumo de IA (tokens)
- KPIs SaaS

## 11. Seguridad y Datos
- Separación lógica por tenant
- Cifrado en tránsito y en reposo
- Control de accesos por rol
- Auditoría básica de acciones

## 12. Modularidad
- Activación/desactivación de módulos
- Escalabilidad por industria

---
Documento base para desarrollo, negocio y escalabilidad.

