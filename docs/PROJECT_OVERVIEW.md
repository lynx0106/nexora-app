# Project overview (backend + frontend)

## Scope
This document summarizes the current functionality, main modules, and data flows based on the codebase as of 2026-02-15.

## Core functionality

### Auth and users
- Login and registration with JWT.
- Roles: superadmin, admin, user, staff, doctor, support (role handling varies by module).
- Profile management with role-based field restrictions.
- User creation by admins and superadmins.
- Seed endpoints for demo users and superadmin.

Backend:
- Auth endpoints: /auth/login, /auth/register.
- User endpoints: /users (CRUD, tenant summaries, global users, profile updates).

Frontend:
- Login/registration UI and role selection.
- Dashboard uses token payload to route to sections.

### Multi-tenant (tenants)
- Tenant creation with admin user creation (transactional).
- Tenant profile update (branding, hours, currency, AI prompts, MercadoPago keys).
- Tenant summary metrics for superadmin.

Backend:
- /tenants/register (public admin creation)
- /tenants (superadmin creates tenant)
- /tenants/me (tenant profile)

Frontend:
- Tenants management for superadmin.
- Tenant profile in Settings.

### Products and services
- Products are used for both physical items and services.
- Services are products with duration.
- CSV import for products.
- CRUD for products with role checks.

Backend:
- /products (CRUD, by tenant, CSV upload)

Frontend:
- Products section with import, create, update, stock edits.

### Orders and payments
- Orders with items, payment status, payment method.
- Stock is decremented at order creation.
- MercadoPago preference creation and webhook handling.
- Email notifications for paid orders.
- Notification broadcast on new orders.

Backend:
- /orders (CRUD, stats, top products)
- /payments/webhook (MercadoPago)

Frontend:
- Orders list, status changes, payment status updates.
- Order detail and print view.
- Public order status page.

### Appointments and reservations
- Appointments for services with overlap checks.
- Admins manage schedule; users can view their own.
- Notifications and email confirmations.

Backend:
- /appointments (CRUD, stats, status updates)

Frontend:
- Agenda section with creation, status management, filters.

### Chat and AI
- WebSocket chat with scopes: INTERNAL, SUPPORT, CUSTOMER.
- AI auto-replies for customer scope using OpenAI or mock.
- AI can be paused per user.

Backend:
- /chat (history, conversations, unread, mark read)
- WebSocket: chat gateway

Frontend:
- Chat section for admin/superadmin.
- Chat widget for user chat.

### Notifications
- WebSocket notifications with separate namespace.
- In-app dropdown with unread count.

Backend:
- /notifications (unread, mark read, mark all)
- WebSocket: notifications gateway

Frontend:
- Notifications dropdown.

### Public flows
- Public tenant info.
- Public booking and store purchase flow.
- Public order tracking.

Backend:
- /public/tenant/:id, /public/services/:id, /public/products/:id
- /public/book/:id, /public/order/:id, /public/orders/:id

Frontend:
- Public booking/store page.
- Public order status page.

### Dashboard and analytics
- Recent activity, sales chart, and stats per tenant.
- AI usage stats per tenant.

Backend:
- /dashboard/activity/:tenantId
- /dashboard/charts/sales/:tenantId
- /ai/usage/stats

Frontend:
- Dashboard stats section.

## Data model overview
Main tables:
- tenants
- users
- products
- orders
- order_items
- appointments
- messages
- notifications
- audit_logs
- ai_usage

## Key integrations
- Supabase (Postgres)
- MercadoPago (payments)
- OpenAI (AI chat)
- Mailer service

## Notable behavior and constraints
- Products are used for both services and inventory items.
- Public endpoints create users with temporary passwords.
- Tenant profile includes prompts and keys for AI and payments.

## Known risks (summary)
- Schema auto-sync forced on in production.
- Seed endpoints are publicly reachable.
- Order pricing trusts client payload.
- WebSocket CORS is open for all origins.
- JWT secret fallback exists.

