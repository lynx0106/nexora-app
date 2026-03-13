# Subir APK a Vercel

## 1. Cuando el build EAS termine

Ver estado:
```bash
cd nexora-mobile
npx eas build:view a7272505-9a2e-48a6-b9af-c05f53df3942
```

Cuando `Status` sea `finished`, copia el **Build Artifacts URL** (URL del .apk).

## 2. Configurar Vercel

1. **Crear Blob store** (si no existe):
   - Vercel Dashboard → tu proyecto (nexora) → Storage → Create Database → Blob
   - Nombre: `nexora-blob`
   - Access: Public
   - Se crea automáticamente `BLOB_READ_WRITE_TOKEN`

2. **Variables de entorno** (Settings → Environment Variables):
   - `APK_UPLOAD_SECRET`: genera un valor aleatorio (ej. `openssl rand -hex 32`)
   - `BLOB_READ_WRITE_TOKEN`: si no se creó al añadir Blob, cópialo del store
   - `NEXT_PUBLIC_APP_APK_URL`: se configurará después del upload

3. **Redeploy** para que las variables estén disponibles

## 3. Subir APK a Blob (opción A: API)

Con el artifact URL de EAS y el secret:

```bash
curl -X POST https://nexora-app.online/api/upload-apk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_APK_UPLOAD_SECRET" \
  -d "{\"artifactUrl\": \"https://expo.dev/artifacts/eas/XXXX.apk\"}"
```

La respuesta incluirá `url` (ej. `https://xxx.public.blob.vercel-storage.com/nexora-mobile.apk`).

## 4. Subir APK (opción B: public folder)

```powershell
# Descargar
.\scripts\download-apk.ps1 -ArtifactUrl "https://expo.dev/artifacts/eas/XXXX.apk"

# Commit y push
git add frontend/public/nexora-mobile.apk
git commit -m "chore: add APK"
git push
```

El APK quedará en `https://nexora-app.online/nexora-mobile.apk`.

## 5. Configurar URL final

En Vercel → Settings → Environment Variables:
- `NEXT_PUBLIC_APP_APK_URL` = la URL del APK (Blob o /nexora-mobile.apk)

Redeploy para que la landing muestre el QR y botón de descarga.
