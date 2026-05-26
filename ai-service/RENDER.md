# Deploy ai-service on Render

## If deploy logs show `npm install && npx prisma generate && npm run build`

That is the **backend** build command. This repo includes `package.json` + `prisma/schema.prisma` so that command still installs Python deps, but you should fix Render settings:

| Setting | Correct value |
|---------|----------------|
| **Root Directory** | `ai-service` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **PYTHON_VERSION** | `3.11.9` |
| **SHARED_SECRET** | same as backend `AI_SHARED_SECRET` |

Or connect the repo **Blueprint** (`render.yaml` at repo root) and sync the `cuzicam-ai-service` service.

## Verify

`GET https://<your-service>.onrender.com/health` → `{"status":"ok"}`
