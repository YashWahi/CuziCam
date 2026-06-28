# Backend — Render deployment

## Required environment variables

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-frontend.onrender.com` (exact browser origin, no trailing `/`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | 64+ char random string |
| `JWT_REFRESH_SECRET` | different 64+ char random string |

Optional:

| Variable | Purpose |
|----------|---------|
| `CORS_ORIGINS` | Comma-separated extra origins (Vercel previews, www subdomain) |
| `CLIENT_URL` | Legacy alias for `FRONTEND_URL` |
| `AI_SERVICE_URL` | Deployed ai-service URL |
| `AI_SHARED_SECRET` | Matches ai-service `SHARED_SECRET` |

## CORS troubleshooting

On startup, logs must show:

```text
[CORS] Allowed origins: https://your-frontend...
```

If you see `Blocked origin`, the request `Origin` header does not match `FRONTEND_URL`. Copy the origin from browser DevTools → Network → request headers.

## Frontend must set

```env
NEXT_PUBLIC_BACKEND_URL=https://cuzicam-backend-a484.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://cuzicam-backend-a484.onrender.com
```
