---
name: nexora-session-manager
description: Skill para gestionar la sesion de trabajo con Kimi, optimizando uso de tokens y contexto. Detecta cuando una sesion esta llegando a su limite por saturacion de mensajes, cambio de tema, repeticion de preguntas o perdida de contexto. Sugiere guardar progreso, resumir conversacion, o cerrar sesion de manera optima. Usar cuando la conversacion tenga >15 mensajes, cambios bruscos de topico, o cuando el usuario indique confusion o agotamiento.
---

# Gestión de Sesión - Optimización de Contexto

Skill para detectar cuándo una sesión con Kimi debe finalizar o consolidarse para optimizar tokens y mantener efectividad.

## 🎯 Propósito

Evitar:
- **Saturación de contexto:** Demasiados mensajes = Kimi pierde foco
- **Pérdida de tokens:** Sesiones largas son costosas
- **Confusión:** Cambios de tema bruscos sin consolidar
- **Agotamiento:** Seguir cuando ya no es productivo

## Cuándo Activar Esta Skill

### Automáticamente (Kimi detecta):
- **>15 mensajes** en la conversación
- **Cambio brusco de tema** (ej: de CORS a "creemos una skill nueva")
- **Repetición de preguntas** (indica olvido de contexto)
- **Tiempo prolongado** (>2 horas de conversación)

### Manualmente (Usuario pide):
- "Creo que ya es mucho"
- "Estoy confundido"
- "Resumamos"
- "Guardemos y continúemos mañana"

## Señales de Alerta

### 🟡 Amarillo (Sugerir pausa)
- 10-15 mensajes
- Usuario pregunta algo ya respondido
- Múltiples temas mezclados

### 🟠 Naranja (Recomendar cierre)
- 15-25 mensajes
- Cambio de tema sin conexión
- Repetición de errores o preguntas

### 🔴 Rojo (Cerrar sesión obligatorio)
- >25 mensajes
- Contexto claramente saturado
- Usuario expresa confusión o frustración

## Acciones Recomendadas

### Según Estado de la Sesión

| Mensajes | Estado | Acción |
|----------|--------|--------|
| 10-15 | 🟡 Cuidado | Sugerir resumen parcial |
| 15-20 | 🟠 Saturado | Recomendar guardar en SESIONES.md |
| 20-25 | 🔴 Crítico | Consolidar y cerrar sesión |
| >25 | 🔴 Límite | Cerrar y crear nueva sesión limpia |

## Flujo de Cierre Óptimo

### Paso 1: Detectar Saturación

Kimi evalúa:
```
¿Mensajes > 15? ✅
¿Cambio de tema reciente? ✅
¿Repetición de preguntas? ❌
→ Estado: 🟠 Saturado - Recomendar cierre
```

### Paso 2: Proponer Acción

```
"He notado que llevamos 18 mensajes y hemos cubierto:
1. Problema de CORS (resuelto parcialmente)
2. Creación de 3 nuevas skills
3. Mejoras a skills existentes

¿Te parece si:
A) Guardamos progreso en SESIONES.md y cerramos
B) Resumimos lo hecho antes de continuar
C) Continuamos (advertencia: contexto saturado)"
```

### Paso 3: Ejecutar Cierre (si elige A)

1. **Resumir avances:**
   ```markdown
   - [x] Skill X creada
   - [x] Problema Y documentado
   - [x] Mejora Z implementada
   ```

2. **Documentar en SESIONES.md:**
   ```powershell
   .agents/skills/nexora-session-tracker/scripts/new-session-entry.ps1 -Interactivo
   ```

3. **Guardar archivos modificados:**
   ```bash
   git add .
   git commit -m "[SESSION] avances de sesión - $(date)"
   git push origin main
   ```

4. **Despedirse:**
   ```
   "✅ Sesión guardada en SESIONES.md
   📝 Commits subidos a GitHub
   🎯 Próxima sesión: [tareas pendientes]
   
   Hasta la próxima!"
   ```

## Checklist de Cierre de Sesión

Antes de terminar, asegurar:

- [ ] **Avances documentados** en SESIONES.md
- [ ] **Archivos importantes commiteados**
- [ ] **Tareas pendientes claras** para próxima sesión
- [ ] **Contexto resumido** (qué se hizo, qué falta)
- [ ] **Usuario confirmado** que todo está guardado

## Optimización de Tokens

### Sin esta skill (sesión larga):
```
Mensajes: 30
Tokens usados: ~8,000
Costo: Alto
Eficiencia: Baja (contexto saturado)
```

### Con esta skill (sesiones cortas):
```
Sesión 1: 12 mensajes, 3,000 tokens
Pausa + documentación
Sesión 2: 10 mensajes, 2,500 tokens
Total: 5,500 tokens (31% ahorro)
Eficiencia: Alta (contexto fresco)
```

## Señales de Cambio de Tema

Cuando el usuario salta de:
- "Arreglemos CORS" → "Creemos una skill nueva"
- "Validemos código" → "Documentemos sesión"
- "Debuggeemos error" → "Mejoremos arquitectura"

**Acción:** Sugerir consolidar primer tema antes de seguir.

## Ejemplo de Uso

### Escenario 1: Sesión Saturada

**Conversación:** 20 mensajes sobre múltiples temas

**Kimi (activa esta skill):**
```
He notado que llevamos 20 mensajes y hemos tratado:
- Problema CORS (aún no resuelto)
- Creación de 2 skills nuevas
- Revisión de código legacy

El contexto está saturado. Recomiendo:

1. Guardar avances en SESIONES.md
2. Commit de cambios
3. Cerrar sesión
4. Nueva sesión enfocada solo en CORS

¿Procedemos con el cierre?
```

### Escenario 2: Cambio de Tema

**Usuario:** "Ya arreglamos CORS, ahora creemos una base de datos nueva"

**Kimi (activa esta skill):**
```
Entiendo que quieres crear una base de datos nueva.

Nota: Esto es un cambio de tema significativo (de CORS a BD).
Antes de continuar:

✅ ¿El CORS quedó resuelto/documentado?
✅ ¿Hay commits pendientes?

Sugerencia: Guardemos estado actual, luego empezamos tema nuevo con contexto limpio.
```

## Comando Rápido

```powershell
# Ver estado de la sesión actual
.agents/skills/nexora-session-manager/scripts/estado-sesion.ps1
```

Muestra:
- Número de mensajes
- Temas tratados
- Sugerencia de acción

## Integración con Otras Skills

Cuando se activa esta skill, coordinar con:
- `nexora-session-tracker`: Guardar entrada en SESIONES.md
- `nexora-validation`: Verificar commits pendientes
- `skill-advisor`: Evaluar si nueva skill es necesaria

## Referencias

- [Guía de Sesiones Efectivas](references/sesiones-efectivas.md)
- [Optimización de Tokens](references/token-optimization.md)

---

**Recuerda:** Una sesión corta y enfocada es más productiva que una larga y saturada.
