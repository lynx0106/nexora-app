# Configuración de Backups Automáticos en Supabase

**Fecha:** 18 de febrero de 2026
**Objetivo:** Configurar backups automáticos para producción

---

## 1. Backups Automáticos (Plan Pro)

Supabase ofrece backups automáticos en el plan Pro ($25/mes). Para habilitarlos:

### Pasos para activar:

1. **Acceder al Dashboard de Supabase**
   - Ir a: https://supabase.com/dashboard
   - Seleccionar el proyecto

2. **Verificar Plan Actual**
   - Settings → Billing → Subscription
   - Si está en Free, actualizar a Pro

3. **Configurar Backups**
   - Settings → Database → Backups
   - Habilitar "Daily Backups"
   - Configurar retención (recomendado: 30 días)

---

## 2. Point-in-Time Recovery (PITR)

PITR permite restaurar la base de datos a cualquier punto en el tiempo.

### Requisitos:
- Plan Pro o superior
- Habilitado por defecto en proyectos nuevos

### Configuración:

```sql
-- Verificar si PITR está habilitado
SELECT * FROM pg_extension WHERE extname = 'pg_wal';

-- Verificar configuración de WAL
SHOW wal_level;
```

### Restauración PITR:

```bash
# Usando CLI de Supabase
supabase db restore --timestamp "2026-02-18 12:00:00"
```

---

## 3. Backups Manuales (Alternativa Gratuita)

Si no se tiene plan Pro, se pueden hacer backups manuales:

### Script de Backup Automático

```bash
#!/bin/bash
# backup-supabase.sh

# Variables
DB_HOST="db.xxxxx.supabase.co"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="tu_password"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/nexora_${DATE}.sql"

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Ejecutar backup
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  -F c \
  -f $BACKUP_FILE

# Comprimir
gzip $BACKUP_FILE

# Eliminar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completado: ${BACKUP_FILE}.gz"
```

### Cron Job (ejecutar diario a las 2 AM)

```cron
0 2 * * * /path/to/backup-supabase.sh >> /var/log/backup.log 2>&1
```

---

## 4. Procedimiento de Restauración

### Desde Backup Automático (Supabase Dashboard)

1. Ir a Settings → Database → Backups
2. Seleccionar el backup a restaurar
3. Click en "Restore"
4. Confirmar la acción

### Desde Backup Manual

```bash
# Descomprimir
gunzip nexora_20260218_020000.sql.gz

# Restaurar
PGPASSWORD=$DB_PASSWORD pg_restore \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  -F c \
  nexora_20260218_020000.sql
```

---

## 5. Verificación de Backups

### Checklist Semanal

- [ ] Verificar que los backups se están generando
- [ ] Confirmar tamaño de backups (no debe ser 0)
- [ ] Probar restauración en ambiente de staging
- [ ] Verificar logs de backup

### Comandos de Verificación

```bash
# Listar backups
ls -la /backups/

# Verificar integridad
pg_verifybackup /backups/nexora_latest/

# Ver tamaño de base de datos
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT pg_size_pretty(pg_database_size('postgres'));
"
```

---

## 6. Plan de Recuperación ante Desastres

### Escenario 1: Corrupción de Datos

1. Detener aplicación inmediatamente
2. Evaluar alcance de la corrupción
3. Restaurar desde backup más reciente
4. Verificar integridad de datos
5. Reanudar aplicación

### Escenario 2: Eliminación Accidental de Tabla

```sql
-- Restaurar tabla específica desde backup
pg_restore -t nombre_tabla backup_file.sql
```

### Escenario 3: Fallo de Región

1. Supabase tiene failover automático
2. Verificar status en https://status.supabase.com
3. Si es necesario, restaurar en nueva región

---

## 7. Contactos de Emergencia

| Rol | Contacto |
|-----|----------|
| DBA Principal | [Agregar] |
| DevOps | [Agregar] |
| Soporte Supabase | support@supabase.com |

---

## 8. Costos Estimados

| Concepto | Costo Mensual |
|----------|---------------|
| Plan Pro Supabase | $25 |
| Almacenamiento adicional | $0.125/GB |
| Transferencia de datos | $0.09/GB |

---

**Documento generado:** 18 de febrero de 2026
