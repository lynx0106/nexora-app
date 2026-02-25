---
name: nexora-session-tracker
description: Skill para gestionar el contexto y memoria entre sesiones de trabajo en el proyecto Nexora App. Usar al INICIO de cada sesión para revisar el estado anterior, y al FINAL para documentar avances, problemas encontrados, decisiones tomadas y tareas pendientes. Crea y mantiene documentos de sesión en SESIONES.md para preservar contexto entre conversaciones.
---

# Session Tracker - Gestión de Contexto Nexora

Skill para mantener la memoria y contexto del proyecto entre sesiones de trabajo con Kimi.

## Propósito

Preservar el conocimiento acumulado del proyecto:
- Qué se hizo en sesiones anteriores
- Problemas encontrados y cómo se resolvieron
- Decisiones técnicas importantes
- Tareas pendientes para próximas sesiones

## Cuándo Usar Esta Skill

### ✅ Al INICIO de cada sesión
- Leer el documento `SESIONES.md` más reciente
- Entender el estado actual del proyecto
- Identificar tareas pendientes de la sesión anterior

### ✅ Al FINAL de cada sesión
- Crear entrada en `SESIONES.md` con:
  - Fecha y duración de la sesión
  - Avances realizados
  - Problemas encontrados y soluciones
  - Decisiones importantes
  - Tareas pendientes para la próxima sesión

### ✅ Cuando el usuario pregunte
- "¿Qué estábamos haciendo?"
- "¿Dónde nos quedamos?"
- "¿Cuál es el estado actual?"

## Flujo de Trabajo

### Inicio de Sesión

```
1. Leer SESIONES.md (última entrada)
2. Identificar tareas pendientes
3. Resumir contexto al usuario
4. Preguntar: "¿Continuamos con X o hay algo prioritario?"
```

### Durante la Sesión

```
1. Trabajar normalmente
2. Documentar decisiones importantes
3. Notar problemas encontrados
```

### Fin de Sesión

```
1. Crear entrada en SESIONES.md
2. Listar avances concretos
3. Documentar problemas y soluciones
4. Definir tareas para próxima sesión
```

## Estructura del Documento SESIONES.md

```markdown
# Historial de Sesiones - Nexora App

## 2026-02-25 - Configuración CORS y Deploy
**Duración:** 2 horas  
**Estado:** En progreso - CORS no resuelto

### ✅ Avances
- [x] Identificada URL correcta de Railway (3104)
- [x] Actualizado frontend con nueva URL
- [x] Creada skill de validación pre-commit

### 🔴 Problemas Encontrados
- **Railway no sincroniza commits con GitHub**
  - Código actualizado en GitHub no llega a Railway
  - Variable CORS_ORIGINS=* aplicada pero no funciona
  - Error 405 persiste en preflight OPTIONS

### 🎯 Decisiones
- Usar variables de entorno como workaround temporal
- Crear skill de validación para evitar errores futuros

### 📋 Tareas Pendientes (Próxima Sesión)
- [ ] Investigar por qué Railway no detecta commits
- [ ] Verificar si hay múltiples proyectos en Railway
- [ ] Probar crear nuevo proyecto Railway desde cero
- [ ] Validar que el login funcione con CORS wildcard

### 🔗 Recursos
- Railway Dashboard: https://railway.app/dashboard
- Backend: https://nexora-app-production-3104.up.railway.app
- Frontend: https://nexora-app.online
```

## Scripts Disponibles

### Crear Nueva Entrada de Sesión

```powershell
.agents/skills/nexora-session-tracker/scripts/new-session-entry.ps1 -Resumen "Descripción corta"
```

### Generar Resumen de Estado

```powershell
.agents/skills/nexora-session-tracker/scripts/generar-resumen.ps1
```

## Checklist al Finalizar Sesión

Antes de despedirte, asegúrate de documentar:

- [ ] Fecha y duración aproximada
- [ ] Lista de avances concretos (checks)
- [ ] Problemas encontrados con detalle
- [ ] Decisiones técnicas importantes
- [ ] Tareas claras para la próxima sesión
- [ ] URLs relevantes (deploys, dashboards)
- [ ] Estado actual (✅ Listo / 🔄 En progreso / 🔴 Bloqueado)

## Ubicación del Archivo

El archivo maestro debe estar en:
```
SESIONES.md (en la raíz del proyecto)
```

## Ejemplo de Uso

### Inicio de Sesión

Usuario: "Hola, continuamos con el deploy"

Kimi (usando esta skill):
"Revisando el estado de la sesión anterior...

**Última sesión (2026-02-25):**
- Intentando resolver CORS entre Railway y Vercel
- Railway no sincroniza commits con GitHub
- Variable CORS_ORIGINS=* aplicada pero no resuelve error 405

**Tareas pendientes:**
1. Investigar sync Railway-GitHub
2. Crear nuevo proyecto Railway si es necesario

¿Continuamos con el problema de CORS o prefieres revisar otra cosa?"

### Fin de Sesión

Kimi (usando esta skill):
"Documentando la sesión de hoy...

He creado la entrada en SESIONES.md con:
- Avance: Skill de validación creada
- Problema: Aún persiste CORS
- Próximas tareas: Investigar Railway, probar deploy limpio

¿Hay algo más que deba incluir en el resumen?"

---

**Nota:** Esta skill complementa a `nexora-app` y `nexora-validation`. Úsala siempre que necesites mantener contexto entre sesiones de trabajo.
