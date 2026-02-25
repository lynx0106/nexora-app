# Guía de Sesiones Efectivas con Kimi

Mejores prácticas para maximizar productividad y minimizar desperdicio de tokens.

## La Regla de Oro

> **Sesión corta y enfocada > Sesión larga y dispersa**

## Duración Ideal

| Tipo de Tarea | Mensajes | Tiempo | Ejemplo |
|--------------|----------|--------|---------|
| Bug fix simple | 5-10 | 15-30 min | Arreglar typo, variable mal configurada |
| Feature pequeña | 10-15 | 30-60 min | Agregar validación, crear script |
| Feature mediana | 15-20 | 1-2 horas | Crear skill completa, refactorizar módulo |
| Arquitectura compleja | 20-25 | 2-3 horas | Diseñar sistema, múltiples integraciones |

**Máximo recomendado:** 25 mensajes o 3 horas

## Estructura de Sesión Ideal

### Inicio (Mensajes 1-3)
```
1. Contexto: "Continuamos con X" / "Quiero hacer Y"
2. Kimi lee SESIONES.md (sesión previa)
3. Ambos confirman entendimiento
```

### Desarrollo (Mensajes 4-15)
```
4-8: Análisis y planificación
9-12: Ejecución (código, config, etc.)
13-15: Validación y ajustes
```

### Cierre (Mensajes 16-18)
```
16: Resumen de avances
17: Documentar en SESIONES.md
18: Confirmar commits y despedida
```

## Anti-Patrones a Evitar

### ❌ Sesión "Todo en Uno"
```
Usuario: "Arreglemos CORS, luego creemos 3 skills, 
          revisemos código legacy, y planeemos arquitectura 2026"

Resultado: 40 mensajes, nada terminado, contexto saturado
```

### ✅ Alternativa: Sesiones Enfocadas
```
Sesión 1 (15 msg): Arreglar CORS → Completado ✅
Sesión 2 (12 msg): Crear skill 1 → Completado ✅
Sesión 3 (10 msg): Crear skill 2 → Completado ✅
...
```

### ❌ Sesión "Ping Pong"
```
Usuario: "No funciona"
Kimi: "¿Qué error ves?"
Usuario: "Dice error"
Kimi: "¿Puedes copiar el mensaje?"
Usuario: "Es un error rojo"
...
(10 mensajes para obtener información básica)
```

### ✅ Alternativa: Información Completa
```
Usuario: "Error CORS al hacer login. Mensaje: 'Access blocked 
          by CORS policy'. URL backend: 3104, URL frontend: 
          nexora-app.online"

Kimi: "Detectado problema X. Solución: Y"
(2 mensajes, problema resuelto)
```

## Tips para Usuario

### 1. Empieza con Contexto

❌ **Malo:**
```
"Hola"
"¿Qué hacemos?"
```

✅ **Bueno:**
```
"Hola, continuamos con el problema de CORS que teníamos ayer. 
 Según SESIONES.md, quedó pendiente verificar si Railway tiene 
 el último commit."
```

### 2. Sé Específico

❌ **Malo:**
```
"No funciona"
"Hay un error"
```

✅ **Bueno:**
```
"Login devuelve 405 Method Not Allowed. 
 Consola muestra: 'Failed to load resource: 405'
 Backend: nexora-app-production-3104.up.railway.app"
```

### 3. Acepta Sugerencias de Cierre

Cuando Kimi sugiere:
```
"Llevamos 20 mensajes, ¿guardamos y continuamos mañana?"
```

Considera:
- ¿El contexto está claro para ti?
- ¿Hay commits pendientes importantes?
- ¿Estás empezando a confundirte?

Si sí → Acepta el cierre

### 4. Usa los Scripts

```powershell
# Antes de sesión: Ver última sesión
.agents/skills/nexora-session-tracker/scripts/ver-ultima-sesion.ps1

# Durante sesión: Ver estado
.agents/skills/nexora-session-manager/scripts/estado-sesion.ps1

# Al final: Documentar
.agents/skills/nexora-session-tracker/scripts/new-session-entry.ps1
```

## Señales de que Debes Cerrar

### Tuyas (como usuario)
- [ ] Estás confundido sobre qué estamos haciendo
- [ ] No recuerdas por qué empezamos esto
- [ ] Sientes que damos vueltas sin avanzar
- [ ] Ya llevas >2 horas en la misma conversación

### De Kimi (que detecta)
- [ ] >15 mensajes sin resolución clara
- [ ] Has preguntado lo mismo 2+ veces
- [ ] Cambiamos de tema 3+ veces
- [ ] La conversación se volvió circular

## Comparativa: Sesión Larga vs Cortas

### Sesión Larga (40 mensajes)

**Temas mezclados:**
- CORS (parcial)
- 2 skills (una completa, otra a medias)
- Refactor (empezado, no terminado)
- Planificación 2026 (ideas sueltas)

**Resultado:**
- Tokens: 12,000
- Commits: 1 (grande, confuso)
- SESIONES.md: Desactualizado
- Tu comprensión: 60%

### Sesiones Cortas (4 sesiones de 10 mensajes)

**Sesión 1:** CORS → Completado ✅
**Sesión 2:** Skill 1 → Completada ✅
**Sesión 3:** Skill 2 → Completada ✅
**Sesión 4:** Refactor → Completado ✅

**Resultado:**
- Tokens totales: 8,000 (33% ahorro)
- Commits: 4 (claros, específicos)
- SESIONES.md: Siempre actualizado
- Tu comprensión: 95%

## Conclusión

La efectividad no se mide por cuánto tiempo trabajas, sino por:
1. **Claridad** del contexto
2. **Conclusión** de tareas
3. **Documentación** para futuro

**Cuando dudes, cierra la sesión y empieza una nueva.**
