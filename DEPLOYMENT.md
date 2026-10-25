# Deployment Guide

This project supports two modern deployment architectures:
1. **Unified Fullstack Container** (Recommended for single-service platforms like Render, Railway, AWS Cloud Run, Fly.io, DigitalOcean).
2. **Decoupled Architecture** (Frontend on Vercel/Netlify/S3 + Backend on Render/Railway/AWS/Fly.io).
3. **Local / Self-Hosted Production via Docker Compose**.

---

## 🚀 Option 1: Docker Compose (Quickest for Local & Server Deployment)

Runs both the React frontend (with Nginx reverse-proxy) and the FastAPI backend in isolated containers.

```bash
docker compose up --build -d
```

- **Frontend App:** [http://localhost](http://localhost) (or `http://localhost:3000`)
- **Backend API & Swagger:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health check:** [http://localhost:8000/health](http://localhost:8000/health)

To stop services:
```bash
docker compose down
```

---

## 🐳 Option 2: Unified Fullstack Container (Render / Railway / Cloud Run / Fly.io)

Using the root [Dockerfile](file:///Dockerfile), the build:
1. Compiles the Vite React application into optimized static assets.
2. Copies the static bundle into a lightweight Python 3.11 container.
3. FastAPI serves both the REST endpoints and the client-side SPA on a single port (`$PORT`).

### Deploy to Render
1. Push your repository to GitHub / GitLab.
2. In Render, select **New** > **Blueprint** and connect your repository (uses [render.yaml](file:///render.yaml)).
   - Alternatively, choose **New Web Service** > **Docker Runtime** pointing to the root `Dockerfile`.
3. Set Environment Variables:
   - `PORT`: `8000` (or leave default assigned by Render)
   - `CORS_ORIGINS`: `*`
4. The service will be available at `https://<your-subdomain>.onrender.com`.

### Deploy to Railway
1. Click **New Project** > **Deploy from GitHub repo**.
2. Railway detects the root `Dockerfile` or `backend/Procfile`.
3. Set environment variable `PORT` if needed (Railway injects `$PORT` automatically).

### Deploy to Google Cloud Run / AWS App Runner
```bash
# Build & tag image
docker build -t freight-forecasting:latest .

# Run container locally or push to registry
docker run -p 8000:8000 freight-forecasting:latest
```

---

## ⚡ Option 3: Decoupled Cloud Deployment

Host the frontend and backend on separate specialized services.

### 1. Backend on Render / Railway / Heroku
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT` (or uses `Procfile`)
- **Environment Variables:**
  - `CORS_ORIGINS`: `https://<your-frontend-domain>.vercel.app` (or `*`)
- **Health Check Endpoint:** `/health`

### 2. Frontend on Vercel
1. In Vercel, import your repository.
2. Configure project settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Environment Variable:
   - `VITE_API_BASE_URL`: `https://<your-backend-domain>.onrender.com`
4. Deploy. Vercel uses [frontend/vercel.json](file:///frontend/vercel.json) to handle SPA client-side routing.

### 3. Frontend on Netlify
1. Connect repository in Netlify.
2. Set **Base directory** to `frontend`.
3. Set **Build command** to `npm run build` and **Publish directory** to `frontend/dist`.
4. Set `VITE_API_BASE_URL` to your live backend URL.
5. SPA redirect rule is automatically configured via [frontend/netlify.toml](file:///frontend/netlify.toml).

---

## ⚙️ Environment Variables Reference

### Frontend (`frontend/.env` / Cloud Provider Settings)
| Variable | Description | Default (Dev) | Production |
|---|---|---|---|
| `VITE_API_BASE_URL` | Base URL pointing to the FastAPI backend | `http://127.0.0.1:8000` | Leave empty `""` for unified/proxied setups, or backend URL |

### Backend (`backend/.env` / Cloud Provider Settings)
| Variable | Description | Default |
|---|---|---|
| `PORT` | Listening port for the Uvicorn server | `8000` |
| `HOST` | Interface IP binding | `0.0.0.0` |
| `CORS_ORIGINS` | Allowed origins (comma-separated or `*`) | `*` |
| `FRONTEND_DIST` | Path to static frontend dist directory | Auto-detected |
| `RELOAD` | Enable auto-reload for local dev | `false` |

---

## 🔍 Health Checks & Monitoring

- **Health check URL:** `GET /health` (returns `{"status": "HEALTHY", "server_time": ...}`)
- **Swagger Documentation:** `GET /docs`
- **OpenAPI Schema:** `GET /openapi.json`
