# 🚀 Guía de Flujo de Trabajo - Desarrollo Nexora App

Esta guía explica cómo usar el flujo automatizado de **Tests → Commit → Push** para el proyecto Nexora App.

---

## 📋 Requisitos Previos

- PowerShell 5.1 o superior
- Git instalado y configurado
- Node.js y npm instalados
- Acceso al repositorio de GitHub

---

## 🔄 Flujo de Trabajo Automatizado

### Script Principal

Ubicación: `scripts/dev-workflow.ps1`

### Uso Básico

```powershell
# Ejecutar desde la raíz del proyecto
.\scripts\dev-workflow.ps1 -Message "feat: descripción del cambio"
```

### Ejemplos de Uso

```powershell
# Flujo completo (tests + commit + push)
.\scripts\dev-workflow.ps1 -Message "fix: corregir bug en login"

# Saltar tests (solo commit + push)
.\scripts\dev-workflow.ps1 -Message "docs: actualizar README" -SkipTests

# Forzar commit incluso si fallan tests
.\scripts\dev-workflow.ps1 -Message "feat: nueva funcionalidad" -Force
```

---

## 📝 Convenciones de Commits

Usamos el formato **Conventional Commits**:

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat: agregar chat en tiempo real` |
| `fix` | Corrección de bug | `fix: corregir error en pagos` |
| `docs` | Documentación | `docs: actualizar API docs` |
| `style` | Cambios de estilo | `style: mejorar colores del tema` |
| `refactor` | Refactorización | `refactor: optimizar queries` |
| `test` | Tests | `test: agregar tests de auth` |
| `chore` | Tareas de mantenimiento | `chore: actualizar dependencias` |

---

## ⚡ Flujo Rápido para Usuarios del CLI de Kimi

Cuando modifiques código, sigue estos pasos:

### 1. Verificar cambios
```powershell
git status
```

### 2. Ejecutar flujo completo
```powershell
.\scripts\dev-workflow.ps1 -Message "tipo: descripción"
```

Este comando ejecutará:
1. ✅ Tests del backend
2. ✅ `git add -A`
3. ✅ `git commit -m "mensaje"`
4. ✅ `git push origin main`

---

## 🧪 Tests Disponibles

### Backend (NestJS)
```powershell
cd backend
npm test              # Todos los tests
npm run test:watch    # Modo watch
npm run test:cov      # Con cobertura
npm run test:e2e      # Tests E2E
```

### Estado Actual de Tests
- **Total:** 42 tests
- **Pasando:** 39 tests (93%)
- **Fallando:** 3 tests (requieren mocking avanzado)

Los tests fallan en `OrdersService` por problemas de mocking con TypeORM.

---

## 🆘 Solución de Problemas

### Error: "No se puede ejecutar scripts"
```powershell
# Ejecutar como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: "Tests fallidos"
```powershell
# Ver detalles de los tests fallidos
cd backend
npm test

# Forzar commit si los tests fallan por mocking
.\scripts\dev-workflow.ps1 -Message "fix: descripción" -Force
```

### Error: "No hay cambios para commitear"
```powershell
# Verificar estado
git status

# Agregar archivos manualmente si es necesario
git add <archivo>
```

---

## 📊 Comandos Útiles

```powershell
# Ver últimos commits
git log --oneline -10

# Ver diff de cambios
git diff

# Ver diff staged
git diff --staged

# Deshacer cambios locales
git checkout -- <archivo>

# Deshacer commit (mantener cambios)
git reset --soft HEAD~1

# Ver branches
git branch -a

# Cambiar de branch
git checkout <branch-name>
```

---

## 🔗 URLs Importantes

| Servicio | URL |
|----------|-----|
| Frontend | https://nexora-app.online |
| Backend API | https://nexora-app-production-3199.up.railway.app |
| API Docs | https://nexora-app-production-3199.up.railway.app/api/docs |
| GitHub Repo | https://github.com/lynx0106/nexora-app |

---

## 📁 Reportes Generados

- `DIAGNOSTICO_CTO_NEXORA_APP.md` - Análisis técnico completo
- `REPORTE_USUARIOS_PRUEBA.md` - Lista de usuarios de prueba
- `PLAN_MEJORAS_100.md` - Plan de mejoras

---

**Última actualización:** 16 de febrero de 2026
