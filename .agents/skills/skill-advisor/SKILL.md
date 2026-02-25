---
name: skill-advisor
description: Skill meta-analitica que evalua las skills existentes del proyecto Nexora App y recomienda crear nuevas skills o mejorar las actuales. Usar cuando se identifiquen tareas repetitivas no cubiertas, problemas recurrentes sin solucion documentada, o cuando el usuario pregunte si necesita una nueva skill o como mejorar las existentes. Analiza gaps de cobertura y sugiere mejoras basadas en patrones de uso.
---

# Skill Advisor - Análisis y Recomendación de Skills

Skill meta-analítica que evalúa las skills existentes y recomienda crear nuevas o mejorar las actuales.

## Propósito

Detectar:
- **Gaps de cobertura**: Tareas que se repiten pero no tienen skill
- **Problemas recurrentes**: Errores que suceden frecuentemente sin prevención
- **Mejoras potenciales**: Skills existentes que pueden enriquecerse
- **Duplicación**: Skills que se solapan o pueden unificarse

## Cuándo Usar Esta Skill

### ✅ Al inicio de un nuevo ciclo de trabajo
- "¿Qué skills debería tener este proyecto?"
- "¿Falta alguna skill para lo que vamos a hacer?"

### ✅ Cuando identificas un problema recurrente
- "Esto me ha pasado varias veces..."
- "Siempre olvido este paso..."
- "Esta tarea la hago manual cada vez..."

### ✅ Cuando una skill existente no cubre todo
- "Esta skill funciona pero le falta X..."
- "Podría agregarse Y a la skill de Z..."

### ✅ Al finalizar una sesión compleja
- Documentar si la sesión reveló necesidad de nueva skill
- Identificar si problemas podrían prevenirse con skill

## Skills Actuales del Proyecto

| Skill | Propósito | Estado |
|-------|-----------|--------|
| `nexora-app` | Desarrollo del proyecto (NestJS, Next.js, Expo) | ✅ Activa |
| `nexora-validation` | Validaciones pre-commit y pre-deploy | ✅ Activa |
| `nexora-session-tracker` | Seguimiento de sesiones y contexto | ✅ Activa |

## Proceso de Análisis

### Paso 1: Evaluar Cobertura

```
¿Qué tipo de tareas hacemos en este proyecto?
├── Desarrollo de código → cubierto por: nexora-app
├── Validación antes de commit → cubierto por: nexora-validation  
├── Documentación de sesiones → cubierto por: nexora-session-tracker
├── ??? → NO CUBIERTO (potencial nueva skill)
└── ??? → NO CUBIERTO (potencial nueva skill)
```

### Paso 2: Identificar Problemas Recurrentes

Revisar `SESIONES.md` y buscar patrones:
- Problemas que aparecen en múltiples sesiones
- Errores que se repiten
- Tareas manuales que consumen tiempo

### Paso 3: Recomendar

**Si hay gap de cobertura:**
→ Sugerir crear nueva skill

**Si hay problemas recurrentes:**
→ Sugerir agregar script/checklist a skill existente

**Si skill existente es incompleta:**
→ Sugerir mejoras específicas

## Criterios para Nueva Skill

### ✅ Crear Skill SI:

1. **Tarea se repite >3 veces**
   - Ejemplo: "Siempre reviso las variables de entorno antes de deploy"

2. **Proceso complejo de múltiples pasos**
   - Ejemplo: "Setup de nuevo tenant requiere 10 pasos manuales"

3. **Conocimiento específico del proyecto**
   - Ejemplo: "La arquitectura de permisos es compleja y específica"

4. **Riesgo de error humano**
   - Ejemplo: "Es fácil olvidar actualizar CORS al cambiar URL"

5. **Documentación extensa necesaria**
   - Ejemplo: "Necesito referencia rápida de todos los endpoints"

### ❌ NO Crear Skill SI:

1. **Tarea única o rara**
   - "Esto solo lo haré una vez"

2. **Ya cubierto por skill existente**
   - Duplicar funcionalidad de `nexora-app` o `nexora-validation`

3. **Demasiado específico de una sesión**
   - "Problema puntual que no se repetirá"

4. **Puede resolverse con un script simple**
   - No requiere documentación extensa ni guía de uso

## Tipos de Skills Recomendadas

### Skills de Automatización
Para tareas manuales repetitivas:
- `nexora-setup`: Setup de nuevos developers/tenants
- `nexora-backup`: Scripts de backup de base de datos
- `nexora-migrations`: Gestión de migraciones TypeORM

### Skills de Documentación
Para conocimiento específico:
- `nexora-architecture`: Decisiones arquitectónicas y ADRs
- `nexora-api-guide`: Guía completa de endpoints con ejemplos
- `nexora-security`: Checklist y guías de seguridad

### Skills de Troubleshooting
Para problemas comunes:
- `nexora-debug`: Guías de debugging por tipo de error
- `nexora-performance`: Optimización y profiling

## Evaluación de Skills Existentes

### Análisis de `nexora-app`
**Cobertura:** Desarrollo general del proyecto
**Fortalezas:** ✅ Referencias de arquitectura, API, DB, deploy
**Posibles mejoras:**
- ¿Agregar troubleshooting guide?
- ¿Agregar guía de contribución?
- ¿Documentar decisiones arquitectónicas?

### Análisis de `nexora-validation`
**Cobertura:** Validaciones pre-commit/pre-deploy
**Fortalezas:** ✅ Scripts de validación, checklists
**Posibles mejoras:**
- ¿Agregar validación de seguridad (secrets scanning)?
- ¿Agregar validación de performance (lighthouse)?
- ¿Validar changelog actualizado?

### Análisis de `nexora-session-tracker`
**Cobertura:** Seguimiento de sesiones
**Fortalezas:** ✅ Documentación de contexto, templates
**Posibles mejoras:**
- ¿Agregar análisis de sesiones (tiempos, bloqueos)?
- ¿Sugerir skills basado en problemas recurrentes?

## Ejemplos de Recomendaciones

### Ejemplo 1: Nueva Skill Detectada

**Contexto:** Usuario ha configurado 5 tenants manualmente siguiendo mismos pasos.

**Análisis:**
- Tarea repetitiva: ✅ (>3 veces)
- Múltiples pasos: ✅ (10+ pasos)
- Riesgo de error: ✅ (fácil olvidar paso)

**Recomendación:**
```
🎯 RECOMENDACIÓN: Crear skill 'nexora-setup'

Justificación:
- Setup de tenant se ha hecho 5 veces con mismos pasos
- Proceso manual de 10+ pasos
- Riesgo de olvidar configurar variables

Contenido sugerido:
- scripts/setup-tenant.ps1
- references/tenant-setup-checklist.md
- SKILL.md con guía paso a paso

Prioridad: ALTA
```

### Ejemplo 2: Mejora a Skill Existente

**Contexto:** Usuario olvidó actualizar CORS por 3ra vez al cambiar URL.

**Análisis:**
- Problema recurrente: ✅ (3 veces)
- Skill existente: `nexora-validation` cubre validaciones
- Gap: No valida CORS específicamente

**Recomendación:**
```
🔧 RECOMENDACIÓN: Mejorar 'nexora-validation'

Justificación:
- Problema recurrente de CORS no detectado
- Skill de validación ya existe, solo falta este check

Mejora sugerida:
- Agregar a validate-deployment-config.ps1:
  * Verificar CORS incluye todas las URLs del frontend
  * Validar que no haya URLs hardcodeadas

Prioridad: MEDIA
```

### Ejemplo 3: No Crear Skill

**Contexto:** Usuario tuvo problema único con SSL en Supabase.

**Análisis:**
- Problema puntual: ✅ (1 vez)
- Resuelto y documentado en SESIONES.md
- No es patrón recurrente

**Recomendación:**
```
⚠️  NO RECOMENDADO: Crear skill dedicada

Justificación:
- Problema fue puntual y ya resuelto
- No se ha repetido ni se espera que se repita
- Documentación en SESIONES.md es suficiente

Alternativa:
- Si el problema vuelve a ocurrir 2+ veces, reconsiderar
- Por ahora, mantener en troubleshooting general
```

## Checklist de Auto-Evaluación

Antes de sugerir nueva skill:

- [ ] ¿La tarea se repite frecuentemente?
- [ ] ¿Es compleja (múltiples pasos)?
- [ ] ¿Hay riesgo de error humano?
- [ ] ¿NO está cubierta por skill existente?
- [ ] ¿El beneficio justifica el costo de crearla?

## Comando de Análisis

```powershell
# Analizar skills actuales y sugerir mejoras
.agents/skills/skill-advisor/scripts/analizar-skills.ps1

# Detectar problemas recurrentes en SESIONES.md
.agents/skills/skill-advisor/scripts/detectar-patrones.ps1
```

## Referencias

- **Guía de creación de skills:** [references/skill-creation-guide.md](references/skill-creation-guide.md)
- **Plantillas de skills:** [references/skill-templates/](references/skill-templates/)
- **Ejemplos de skills efectivas:** [references/ejemplos/](references/ejemplos/)

---

**Nota:** Esta skill se activa automáticamente cuando el contexto sugiere necesidad de análisis de cobertura o el usuario pregunta explícitamente sobre skills.
