# Corpoturismo · Panel de Logs (logs-admin)

App web aislada (React + Vite + TS) de **solo lectura** para consultar los logs
operativos del sistema. Pensada para `SUPER_ADMIN` y `SUPERVISOR`.

## Flujo seguro

```
Logs Admin App  ──JWT──▶  API principal (Render)  ──x-api-key──▶  LogService (Vercel)  ──▶  MongoDB Atlas
```

El panel **nunca** maneja `READ_API_KEY` ni `INGEST_API_KEY`. Solo envía el JWT
del usuario a la API principal (`/api/v1/admin/logs`), que valida sesión, rol y
permisos y consulta el LogService internamente con su propia clave de lectura.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | Base de la API principal, p. ej. `https://<api>/api/v1` |
| `VITE_APP_NAME` | Nombre visible del panel |
| `VITE_DEFAULT_TZ` | Zona horaria para fechas (`America/Bogota`) |

> No agregar claves del LogService ni secretos. Viven solo en el servidor.

## Scripts

```bash
npm install
npm run dev        # http://localhost:3002
npm run build
npm run typecheck
```

## Stack

React 18 · Vite 7 · TypeScript · Tailwind v4 · React Router 6 · React Query 5 ·
Zustand 4 · Axios · Zod · React Hook Form · Lucide.
