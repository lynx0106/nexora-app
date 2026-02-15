# Exportar reportes (pedidos, citas, usuarios)

Este documento describe los endpoints de exportacion de reportes en CSV o JSON.

## Autenticacion
- Requiere JWT.
- Solo Admin/Superadmin pueden exportar usuarios.
- Usuarios finales solo pueden exportar sus propios pedidos/citas.

## Endpoints

### Pedidos
`GET /reports/tenant/:tenantId/orders?from=YYYY-MM-DD&to=YYYY-MM-DD&format=csv`

### Citas
`GET /reports/tenant/:tenantId/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD&format=csv`

### Usuarios
`GET /reports/tenant/:tenantId/users?from=YYYY-MM-DD&to=YYYY-MM-DD&format=csv`

## Parametros
- `from`: fecha inicio (opcional). Si no se envia, usa los ultimos 30 dias.
- `to`: fecha fin (opcional). Si no se envia, usa la fecha actual.
- `format`: `csv` (default) o `json`.

## Ejemplo CSV
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "https://api.nexora-app.online/reports/tenant/<TENANT_ID>/orders?format=csv"
```

## Notas
- El CSV se descarga como archivo adjunto.
- Los reportes respetan el tenant del usuario.
