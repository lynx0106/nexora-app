# Guía de Documentación de Sesiones

Mejores prácticas para mantener SESIONES.md útil y efectivo.

## Principios

### 1. Concisión sobre Complejidad

❌ **Malo:**
```markdown
Hablamos sobre muchas cosas y vimos varios problemas y luego intentamos solucionarlos...
```

✅ **Bueno:**
```markdown
### 🔴 Problemas
- **Railway no detecta commits**: Código en GitHub (be8d309) vs Railway (3586ced0)
- **CORS 405**: Variable CORS_ORIGINS=* no resuelve error de preflight
```

### 2. Contexto Accionable

Cada entrada debe permitir que alguien (o Kimi) continúe el trabajo.

✅ **Incluye siempre:**
- URLs específicas (deploys, dashboards)
- IDs de commits o versiones
- Nombres exactos de archivos modificados
- Comandos útiles descubiertos

### 3. Estados Claros

Usa la leyenda consistentemente:
- **✅ Completada** - Funcionando, cerrado
- **🔄 En progreso** - Avances pero queda trabajo
- **🔴 Bloqueada** - Bloqueado por problema técnico

### 4. Tareas Verificables

❌ **Vaga:**
```markdown
- [ ] Arreglar CORS
```

✅ **Específica:**
```markdown
- [ ] Investigar por qué Railway commit (be8d309) no aparece en deploy
- [ ] Probar crear nuevo proyecto Railway conectado a GitHub
- [ ] Verificar webhook de GitHub en Settings → Webhooks
```

## Estructura Recomendada

### Avances
Lista de cosas concretas que funcionan:
```markdown
### ✅ Avances
- [x] Backend deployado en https://nexora-app-production-3104.up.railway.app
- [x] Skill de validación creada en .agents/skills/nexora-validation/
- [x] Variables de entorno configuradas en Railway (ver lista en recursos)
```

### Problemas
Contexto suficiente para entender el bloqueo:
```markdown
### 🔴 Problemas Encontrados
- **Error 405 en /auth/login**
  - Backend recibe OPTIONS pero responde 405
  - Variable CORS_ORIGINS=* aplicada en Railway
  - Código actualizado no está en servidor (sync issue)
  - Logs: ver Deploy Logs en Railway Dashboard 21:54:58
```

### Decisiones
Por qué elegimos cierto camino:
```markdown
### 🎯 Decisiones
- **Usar wildcard CORS temporalmente (`*`)** para diagnosticar si el problema es CORS u otra cosa
- **Crear skill de validación** para evitar errores de deploy en el futuro
- **No recrear proyecto Railway todavía**, primero verificar webhooks
```

### Tareas Pendientes
Ordenadas por prioridad:
```markdown
### 📋 Tareas Pendientes (Próxima Sesión)
P0 - Crítico:
- [ ] Investigar sync GitHub-Railway

P1 - Importante:
- [ ] Validar login funciona con CORS wildcard
- [ ] Restringir CORS a orígenes específicos

P2 - Mejora:
- [ ] Agregar tests automáticos
```

### Recursos
Links que usaste y volverás a usar:
```markdown
### 🔗 Recursos
- Railway Dashboard: https://railway.app/dashboard
- Deployment actual: https://railway.com/project/207a9fb8...
- Backend Health: https://nexora-app-production-3104.up.railway.app/health
- GitHub Repo: https://github.com/lynx0106/nexora-app
- Supabase: https://app.supabase.com/project/...
```

## Ejemplos de Buenas Entradas

### Ejemplo 1: Sesión Completa

```markdown
## 2026-02-25 - Configuración Inicial de Deploy
**Duración:** 4 horas  
**Estado:** ✅ Completada

### ✅ Avances
- [x] Backend deployado en Railway (URL: ...3104.up.railway.app)
- [x] Frontend deployado en Vercel (URL: nexora-app.online)
- [x] Conexión Supabase establecida
- [x] Health check respondiendo OK

### 🔴 Problemas
- Ninguno crítico

### 🎯 Decisiones
- Usar Railway PostgreSQL addon (no Supabase directo)
- Configurar JWT_SECRET de 64 caracteres aleatorios

### 📋 Tareas Siguiente Sesión
- [ ] Configurar CORS para permitir frontend
- [ ] Probar login con superadmin
- [ ] Verificar base de datos tiene datos de prueba

### 🔗 Recursos
- Railway Project: https://railway.app/project/207a9fb8...
- Vercel Project: https://vercel.com/lynxia25-hub/nexora-app
```

### Ejemplo 2: Sesión Bloqueada

```markdown
## 2026-02-25 - Debug CORS
**Duración:** 3 horas  
**Estado:** 🔴 Bloqueado

### ✅ Avances
- [x] Identificado que Railway no tiene código actualizado
- [x] Creada variable CORS_ORIGINS=* en Railway
- [x] Verificado que health check funciona

### 🔴 Problemas
- **Railway no sincroniza con GitHub**
  - GitHub commit: be8d309 (tiene fix CORS)
  - Railway deploy: 3586ced0 (código antiguo)
  - Redeploy manual no actualiza código
  - Posible causa: Webhook desconfigurado o múltiples proyectos

### 🎯 Decisiones
- Usar variables como workaround temporal
- Documentar todo para próxima sesión

### 📋 Tareas Siguiente Sesión
- [ ] Verificar en GitHub Settings → Webhooks que Railway está configurado
- [ ] Buscar si hay múltiples proyectos en Railway dashboard
- [ ] Considerar crear nuevo proyecto Railway desde cero
- [ ] Si nada funciona: deploy manual con CLI de Railway

### 🔗 Recursos
- Railway Dashboard: https://railway.app/dashboard
- GitHub Webhooks: https://github.com/lynx0106/nexora-app/settings/hooks
```

## Frecuencia de Actualización

- **Al inicio de sesión:** Lee la última entrada
- **Durante sesión:** Nota decisiones y problemas importantes
- **Al finalizar:** Crea entrada completa antes de despedirte

## Largo de Entradas

- **Mínimo:** Suficiente para entender qué pasó
- **Máximo:** 2-3 páginas de markdown
- **Ideal:** 1 página con links a detalles si es necesario
