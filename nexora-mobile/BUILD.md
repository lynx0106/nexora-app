# Guía de Build para Nexora Mobile

## Requisitos Previos

- Node.js 18+
- Cuenta de Expo con EAS configurado
- Acceso al proyecto en GitHub

---

## ✅ Checklist Pre-Build (OBLIGATORIO)

Antes de ejecutar cualquier build, verifica:

### 1. Assets en el Repositorio
```bash
git ls-tree HEAD assets/
```
Debe mostrar:
- `assets/adaptive-icon.png`
- `assets/favicon.png`
- `assets/icon.png`
- `assets/splash-icon.png`

**Si falta algún archivo:**
```bash
git add -f assets/
git commit -m "fix: add app assets"
git push origin main
```

### 2. Sin Cambios Pendientes
```bash
git status
```
Debe mostrar: `nothing to commit, working tree clean`

### 3. Validación de Expo
```bash
npx expo doctor
```
Debe mostrar: `All checks passed` o máximo warnings menores.

### 4. Código en GitHub
```bash
git push origin main
```
Asegurar que el último commit esté en el repositorio remoto.

---

## 🚀 Comandos de Build

### Build de Preview (APK para testing)
```bash
npx eas build --platform android --profile preview
```

### Build de Production (AAB para Play Store)
```bash
npx eas build --platform android --profile production
```

### Ver Estado del Build
```bash
npx eas build:list
```

### Descargar APK
```bash
npx eas build:view [BUILD_ID]
```

---

## 🔧 Solución de Problemas

### Error: "cannot access file at './assets/...'"
**Causa:** Los assets no están en el repositorio de GitHub.

**Solución:**
```bash
git add -f assets/
git commit -m "fix: add assets"
git push origin main
```

### Error: "EAS CLI should not be installed in your project"
**Causa:** `eas-cli` está instalado como dependencia local.

**Solución:** Usar `npx eas` en lugar de `eas` directamente.

### Error: "Unknown error in Prebuild phase"
**Causa:** Problemas de configuración o archivos faltantes.

**Solución:**
1. Ejecutar `npx expo doctor`
2. Revisar los logs en el link proporcionado por EAS
3. Verificar que todos los archivos de `app.json` existen

### Error: "Commit not found"
**Causa:** El commit local no está en GitHub.

**Solución:**
```bash
git push origin main
```

---

## 📊 Perfiles de Build

| Perfil | Tipo | Uso |
|--------|------|-----|
| `preview` | APK | Testing interno, compartir con testers |
| `production` | AAB | Play Store, distribución oficial |
| `development` | APK dev | Desarrollo con herramientas de debug |

---

## 📝 Notas Importantes

1. **Siempre ejecutar el checklist pre-build** antes de iniciar un build
2. **Un build toma 5-15 minutos** en completarse
3. **El plan gratuito de EAS** tiene cola de espera (puede demorar más)
4. **Mantener el repositorio sincronizado** para evitar errores

---

## 🔗 Enlaces Útiles

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo Doctor](https://docs.expo.dev/workflow/doctor/)
- [Proyecto en Expo](https://expo.dev/accounts/lynx0106/projects/nexora-mobile)
- [Repositorio GitHub](https://github.com/lynx0106/nexora-app)

---

**Última actualización:** 2026-02-24
