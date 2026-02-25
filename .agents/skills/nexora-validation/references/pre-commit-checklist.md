# Checklist Pre-Commit - Nexora App

Lista de verificación rápida antes de hacer `git commit`.

## ✅ Código Funcional

- [ ] **Backend compila sin errores**
  ```bash
  cd backend && npm run build
  ```
  
- [ ] **Frontend compila sin errores**
  ```bash
  cd frontend && npm run build
  ```

- [ ] **No hay errores de TypeScript** (tipos correctos)

## ✅ Tests

- [ ] **Tests unitarios pasan** (si existen)
  ```bash
  cd backend && npm test
  ```

- [ ] **Nuevos tests agregados** (si corresponde)

## ✅ Limpieza de Código

- [ ] **No hay `console.log` en código de producción**
  ```bash
  grep -r "console\." backend/src --include="*.ts" | grep -v ".spec.ts"
  ```

- [ ] **No hay `debugger;` statements**

- [ ] **Código formateado** (Prettier/ESLint)
  ```bash
  cd backend && npm run lint
  cd frontend && npm run lint
  ```

## ✅ Seguridad Básica

- [ ] **No hay credenciales hardcodeadas**
  - Contraseñas
  - API Keys
  - Tokens
  
- [ ] **Variables sensibles usan `process.env`**

## ✅ Git

- [ ] **Mensaje de commit descriptivo**
  - Formato: `[TIPO] descripción`
  - Tipos: feat, fix, refactor, test, docs, security
  
- [ ] **Archivos correctos staged**
  ```bash
  git status
  ```

- [ ] **No se commitea `node_modules` ni `dist/`**
  (Verificar .gitignore)

## ⚡ Script Automático

Ejecuta todas estas validaciones:

```powershell
.agents/skills/nexora-validation/scripts/pre-commit-check.ps1
```

## Si Algo Falla...

1. Corrige el error
2. Vuelve a ejecutar el checklist
3. Una vez todo verde: `git commit`
