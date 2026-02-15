# Invitaciones con magic link

Este flujo permite invitar usuarios a un tenant con un link de un solo uso.

## Endpoints

### Crear invitacion (admin/superadmin)
`POST /invites/tenant/:tenantId`

Body:
```json
{
  "email": "usuario@correo.com",
  "role": "admin"
}
```

### Aceptar invitacion (publico)
`POST /invites/accept`

Body:
```json
{
  "token": "<token>",
  "firstName": "Ana",
  "lastName": "Perez",
  "password": "Password123"
}
```

## Seguridad
- Token aleatorio de 32 bytes.
- Hash SHA-256 almacenado en BD.
- Expiracion por defecto: 72h (`INVITE_TTL_HOURS`).
- Un solo uso (se marca `acceptedAt`).

## Notas
- El email debe ser unico globalmente.
- Si el usuario ya existe, se rechaza la invitacion.
