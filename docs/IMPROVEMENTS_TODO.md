# Improvements and hardening checklist

This list is prioritized for long term stability, security, and maintainability.

## P0 - Security and data integrity
1) Disable TypeORM auto-sync in production.
   - Use TYPEORM_SYNCHRONIZE=false in prod.
   - Add migrations workflow.
2) Protect seed endpoints.
   - Require AuthGuard + superadmin role.
   - Or remove in production build.
3) Validate order pricing on server.
   - Recalculate price from Product table.
   - Ignore client-provided price and total.
4) Enforce JWT secret in prod.
   - Fail fast if JWT_SECRET missing.
5) Lock down WebSocket CORS.
   - Allow only known frontend origins.

## P1 - Stability and data quality
6) Add input validation in controllers (DTO + class-validator).
7) Add explicit role enums and consistent role checks.
8) Remove auto tenant creation in getOrCreateTenant or restrict it.
9) Add rate limiting for auth and public endpoints.
10) Add transactional safety for stock updates and refunds.

## P1 - Observability
11) Add structured logging (request id, tenant id).
12) Add error tracking (Sentry or similar).
13) Expose health check endpoint.

## P2 - Public flow hardening
14) Add email verification or password reset for public users.
15) Add order verification token for public order status.
16) Add captcha or anti-bot for public booking and orders.

## P2 - Payments
17) Store MercadoPago metadata safely (no logging of secrets).
18) Add webhook signature verification.
19) Add retry queue for webhook processing failures.

## P2 - Data and schema
20) Add migrations and migration history tracking.
21) Add indexes on frequent queries (tenantId, createdAt, status).
22) Add constraints for tenantId FK and role values.

## P2 - Frontend UX
23) Add central API error boundary and toast handling.
24) Improve empty states for chat, orders, agenda.
25) Add better loading states and skeletons.

## P2 - Security headers
26) Add strict CORS and security headers in backend.
27) Configure helmet with CSP.

## P3 - Product improvements
28) Unified admin invitation flow with magic link tokens.
29) Export reports (orders, appointments, users).
30) Add advanced RBAC (fine-grained permissions).

## P3 - Infra and ops
31) Add backup policy and restore drills.
32) Add staging environment and deployment checks.
33) Add automated tests for critical flows.

## Theme and UI redesign scope
- Update design tokens (colors, typography, spacing).
- Create a unified component system (buttons, cards, forms).
- Redesign dashboard and public booking flow.
- Add consistent iconography and data visualization styles.

