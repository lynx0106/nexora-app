# Instrucciones para Migración de Supabase

## Migración Pendiente: Sistema de Inventario

### Pasos para ejecutar la migración:

1. **Ir a Supabase Dashboard**
   - Accede a: https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abrir SQL Editor**
   - En el menú lateral, ve a: **SQL Editor**
   - Clic en **New Query**

3. **Ejecutar la migración**
   - Copia el contenido del archivo `SUPABASE_MIGRATION_INVENTORY.sql`
   - Pégalo en el editor SQL
   - Clic en **Run** (o presiona Ctrl+Enter)

4. **Verificar la migración**
   - La última consulta mostrará las columnas agregadas
   - Deberías ver:
     ```
     column_name | data_type | column_default
     ------------+-----------+---------------
     cost        | numeric   | 0
     minStock    | integer   | 0
     ```

## ¿Qué agrega esta migración?

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `cost` | DECIMAL(10,2) | Precio de costo del producto para cálculo de márgenes |
| `minStock` | INTEGER | Nivel mínimo de stock para alertas de reposición |

## Índices creados

- `idx_products_min_stock` - Para consultas de productos con stock bajo
- `idx_products_stock_min_stock` - Para consultas combinadas de stock

## Verificación posterior

Después de ejecutar la migración, verifica en Table Editor:
1. Ve a **Table Editor** > **products**
2. Las columnas `cost` y `minStock` deben aparecer
3. Los productos existentes tendrán valor 0 en ambas columnas

## Nota importante

Esta migración es **idempotente** (puede ejecutarse múltiples veces sin causar errores) gracias al uso de `IF NOT EXISTS`.
