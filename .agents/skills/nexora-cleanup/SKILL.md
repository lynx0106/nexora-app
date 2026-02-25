---
name: nexora-cleanup
description: Skill para mantener el repositorio Nexora App limpio y organizado. Revisa archivos obsoletos, duplicados, logs grandes, documentación desactualizada y sugiere eliminar o archivar lo que ya no se necesita. Usar periodicamente (semanal/mensual) o cuando el usuario note que hay muchos archivos desorganizados, documentos antiguos, o antes de releases importantes para reducir tamano del repo y confusion.
---

# Limpieza y Mantenimiento - Nexora App

Skill para mantener el repositorio limpio, organizado y libre de archivos obsoletos.

## 🎯 Propósito

Evitar la acumulación de:
- Documentación obsoleta que confunde
- Logs y archivos temporales grandes
- Archivos duplicados o contradictorios
- Backups que ya no sirven
- Archivos de sesiones pasadas que están resueltas

## Cuándo Usar

### ✅ Periodicamente
- **Semanal:** Revisar logs y temporales
- **Mensual:** Revisar documentación obsoleta
- **Antes de release:** Limpiar para reducir tamaño

### ✅ Cuando detectas desorganización
- "Hay muchos archivos .md que ya no sé cuál usar"
- "Los logs ocupan mucho espacio"
- "Hay documentos duplicados"
- "No sé qué archivos son relevantes"

### ✅ Después de resolver problemas grandes
- El incidente ya pasó, el doc de diagnóstico ya no aplica
- Migración completada, guía vieja obsoleta

## Tipos de Archivos a Revisar

### 1. Documentación Markdown (*.md)

**Candidatos a eliminar/archivar:**

| Patrón | Ejemplo | Acción |
|--------|---------|--------|
| `DIAGNOSTICO_*.md` viejos | `DIAGNOSTICO_RAILWAY.md` (feb 2026, ya resuelto) | Archivar o eliminar |
| `PLAN_*.md` completados | `PLAN_EJECUCION_DETALLADO.md` (si todo hecho) | Actualizar estado |
| `CHECKLIST_*.md` sin uso | Checklists que nadie sigue | Revisar utilidad |
| Archivos `*.md` duplicados | Dos docs sobre mismo tema | Consolidar |

**Criterios:**
- ¿Aplica al estado actual del proyecto?
- ¿Tiene información que no está en otro lado?
- ¿Se actualizó en los últimos 30 días?
- ¿Alguien lo consulta?

### 2. Logs y Archivos Temporales

**Siempre seguros de limpiar:**
```
backend/*.log              # Logs locales
frontend/*.log             # Logs locales
*.log                      # Cualquier log en raíz
npm-debug.log*             # Debug de npm
yarn-debug.log*            # Debug de yarn
```

**Revisar tamaño:**
```
backend/logs/              # Si existen y son grandes
*.log files > 10MB         # Logs muy grandes
```

### 3. Archivos de Backup

**Patrones típicos:**
```
*.backup                   # Backups manuales
*.bak                      # Archivos bak
*.old                      # Versiones viejas
*.original                 # Originales antes de cambios
```

**Criterio:** ¿El backup tiene más de 30 días y el original funciona? → Eliminar

### 4. Archivos de Sesiones/Temporales

```
SESIONES.md viejo          # Si ya está consolidado
TEMP_*.md                  # Documentos temporales
NOTAS_*.md                 # Notas personales antiguas
```

## Scripts Disponibles

### Análisis Completo
```powershell
# Analiza todo el repo y genera reporte
.agents/skills/nexora-cleanup/scripts/analizar-limpieza.ps1
```

### Limpieza de Logs
```powershell
# Elimina logs seguros (no afecta código)
.agents/skills/nexora-cleanup/scripts/limpiar-logs.ps1
```

### Archivar Documentación
```powershell
# Mueve docs obsoletos a docs/archive/
.agents/skills/nexora-cleanup/scripts/archivar-obsoletos.ps1
```

## Flujo de Trabajo

### Paso 1: Análisis (No eliminar aún)

```powershell
.agents/skills/nexora-cleanup/scripts/analizar-limpieza.ps1
```

Genera reporte:
```
📊 Reporte de Limpieza
=====================

Documentos potencialmente obsoletos:
- DIAGNOSTICO_RAILWAY.md (último cambio: 2026-02-24, 0 referencias)
  → Sugerencia: Archivar, problema ya resuelto

Logs para limpiar:
- backend/backend.log (6 KB) → Seguro eliminar
- npm-debug.log (45 KB) → Seguro eliminar

Archivos duplicados:
- CORS_FIX.md y contenido similar en SESIONES.md
  → Sugerencia: Consolidar en SESIONES.md
```

### Paso 2: Revisar Sugerencias

Revisa cada item y decide:
- **Eliminar:** Si está 100% seguro que no sirve
- **Archivar:** Mover a `docs/archive/` por si acaso
- **Mantener:** Si aún tiene valor
- **Consolidar:** Unir con otro documento

### Paso 3: Ejecutar Limpieza

```powershell
# Solo logs (siempre seguro)
.agents/skills/nexora-cleanup/scripts/limpiar-logs.ps1

# Archivar documentación
.agents/skills/nexora-cleanup/scripts/archivar-obsoletos.ps1 -DryRun
# Revisar output, luego sin -DryRun
```

### Paso 4: Commit

```bash
git add .
git commit -m "[CLEANUP] elimina logs y archiva docs obsoletos

- Elimina logs temporales (XX KB)
- Archiva documentación de problemas resueltos
- Consolida información duplicada

Refs: Repository maintenance"
```

## Reglas de Oro

### ✅ SIEMPRE Seguro Eliminar
- `*.log` (logs de desarrollo local)
- `npm-debug.log*`, `yarn-debug.log*`
- Archivos `*.tmp`, `*.temp`
- `node_modules` (se regenera con npm install)

### ⚠️ Revisar Antes de Eliminar
- Documentos Markdown (pueden tener info valiosa)
- Archivos de configuración (.env.example sí, .env no)
- Scripts (pueden ser útiles)

### ❌ NUNCA Eliminar
- `README.md` principal
- `.gitignore`
- Código fuente (src/)
- Tests (**.spec.ts, **.test.ts)
- Configuración de build (package.json, tsconfig.json, etc.)
- Skills en `.agents/skills/` (a menos que se reemplacen)

## Estructura Limpia Recomendada

```
nexora-app/
├── .agents/skills/        # Skills activas
├── backend/               # Código backend
│   ├── src/
│   └── logs/             # ← Limpieza regular
├── frontend/              # Código frontend
├── docs/                  # Documentación vigente
│   └── archive/          # ← Documentación archivada
├── scripts/               # Scripts útiles
├── *.md                   # Solo documentos relevantes
├── .gitignore
└── README.md
```

## Frecuencia Recomendada

| Tipo | Frecuencia | Ejemplo |
|------|------------|---------|
| Logs | Semanal | `backend/*.log` |
| Temporales | Semanal | `*.tmp`, `*.temp` |
| Documentación | Mensual | Revisar docs obsoletos |
| Archivos grandes | Mensual | Buscar >10MB |
| Skills | Trimestral | Revisar si skills siguen usándose |

## Comando Rápido

```powershell
# Ver estado de limpieza rápidamente
.agents/skills/nexora-cleanup/scripts/estado-repo.ps1
```

Muestra:
- Tamaño total del repo
- Espacio ocupado por logs
- Número de archivos .md
- Sugerencias inmediatas

## Referencias

- [Guía de Organización](references/organizacion-repo.md)
- [Criterios de Obsolescencia](references/criterios-obsolescencia.md)

---

**Nota:** Esta skill prioriza mantener el conocimiento útil y eliminar el ruido. Cuando dudes, archiva en lugar de eliminar.
