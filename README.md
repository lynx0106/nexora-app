# Nexora-App

Este repositorio contiene la aplicación Nexora (backend y frontend) preparada para desarrollo.

Estructura principal:
- `backend/` — API y servicios (Nest.js)
- `frontend/` — Aplicación Next.js

Instrucciones rápidas (desarrollo local):

1. Instalar dependencias en carpetas `backend` y `frontend`:

```powershell
cd backend
npm install
cd ..\frontend
npm install
```

2. Ejecutar backend y frontend (puede variar según scripts):

```powershell
cd backend
npm run start:dev
cd ..\frontend
npm run dev
```

3. Añadir archivo `.env` a `backend` con las variables necesarias (ver `backend/.env.example`).

Notas:
- He añadido un `.gitignore` básico; revisa y amplíalo si hace falta.
- Se realizaron respaldos de repositorios anidados en `backend/.git.backup` y `frontend/.git.backup`.

Si quieres que añada una licencia o documentación adicional, dímelo.
