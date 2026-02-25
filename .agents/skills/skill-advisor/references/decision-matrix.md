# Matriz de Decisión: ¿Crear Nueva Skill?

Guía para decidir si una necesidad justifica crear una nueva skill.

## Flujo de Decisión

```
¿Tarea se repite >3 veces?
├── NO → Documentar en SESIONES.md es suficiente
└── SÍ → ¿Es compleja (>5 pasos)?
    ├── NO → ¿Riesgo de error alto?
    │   ├── NO → Script simple, no skill
    │   └── SÍ → Crear skill simple
    └── SÍ → ¿Ya existe skill similar?
        ├── SÍ → Mejorar skill existente
        └── NO → CREAR NUEVA SKILL
```

## Matriz de Evaluación

| Factor | Peso | Score |
|--------|------|-------|
| Frecuencia (>3 veces) | Alto | +3 |
| Complejidad (>5 pasos) | Alto | +3 |
| Riesgo de error | Medio | +2 |
| Conocimiento específico | Medio | +2 |
| Beneficio a otros devs | Medio | +2 |
| Tiempo de creación (<2h) | Bajo | +1 |

**Score ≥ 5**: Crear skill  
**Score 3-4**: Considerar  
**Score < 3**: No crear

## Ejemplos Evaluados

### Ejemplo 1: Setup de Tenant

| Factor | Score |
|--------|-------|
| Frecuencia: Hecho 5 veces | +3 |
| Complejidad: 10 pasos | +3 |
| Riesgo: Olvidar variable de entorno | +2 |
| Conocimiento: Específico del proyecto | +2 |
| **TOTAL** | **10** ✅ |

**Veredicto**: Crear skill `nexora-setup`

---

### Ejemplo 2: Validar CORS

| Factor | Score |
|--------|-------|
| Frecuencia: Olvidado 3 veces | +3 |
| Complejidad: 2 pasos (editar archivo, deploy) | +0 |
| Riesgo: Alto (app no funciona) | +2 |
| Conocimiento: General (no específico) | +0 |
| **TOTAL** | **5** ✅ |

**Veredicto**: Agregar a skill `nexora-validation` existente

---

### Ejemplo 3: Problema SSL Único

| Factor | Score |
|--------|-------|
| Frecuencia: 1 vez | +0 |
| Complejidad: Variable | +1 |
| Riesgo: Bajo (resuelto) | +0 |
| Conocimiento: Genérico | +0 |
| **TOTAL** | **1** ❌ |

**Veredicto**: Documentar en SESIONES.md, no skill

---

## Tipos de Skills vs Soluciones Alternativas

| Necesidad | Alternativa | ¿Skill? |
|-----------|-------------|---------|
| Script de un solo uso | Gist o archivo en repo | ❌ No |
| Documentación extensa | README.md | ⚠️ Considerar skill si es específico |
| Checklist de 3 items | Issue template | ❌ No |
| Proceso de 15 pasos | Skill con scripts | ✅ Sí |
| Error que ocurre mensualmente | SESIONES.md | ❌ No |
| Error que ocurre semanalmente | Skill de troubleshooting | ✅ Sí |
| Guía de arquitectura | ADR en docs/ | ⚠️ Considerar skill si cambia frecuentemente |

## Anti-Patrones

### ❌ NO Hacer

1. **Skill para todo**
   - Tener 20 skills para tareas triviales
   - Mejor: Consolidar en skills más amplias

2. **Duplicar funcionalidad**
   - Skill de "testing" cuando ya existe `nexora-validation`
   - Mejor: Extender skill existente

3. **Skills huérfanas**
   - Crear skill y no usarla nunca
   - Mejor: Validar necesidad real antes de crear

4. **Skills demasiado específicas**
   - "Como arreglar el error XYZ del 2024-02-25"
   - Mejor: Generalizar a tipo de problema

## Mejores Prácticas

### ✅ Hacer

1. **Reutilizar patterns**
   - Si `nexora-validation` funciona, usar estructura similar

2. **Nombrar consistentemente**
   - `nexora-[dominio]` para skills del proyecto
   - `skill-[proposito]` para skills meta/herramientas

3. **Empezar simple**
   - SKILL.md + 1 script inicial
   - Expandir según necesidad real

4. **Documentar el porqué**
   - En SKILL.md explicar qué problema resuelve
   - Facilita mantenimiento futuro

## Checklist Pre-Creación

- [ ] ¿La tarea se repite frecuentemente?
- [ ] ¿Es compleja o riesgosa?
- [ ] ¿No está cubierta por skill existente?
- [ ] ¿El beneficio justifica el esfuerzo de crear?
- [ ] ¿Otros developers se beneficiarían?
- [ ] ¿Puedo mantenerla actualizada?

Si respondes **SÍ** a ≥4 preguntas: Crear skill.
