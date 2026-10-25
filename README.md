# Intelligent Freight Forecasting Platform

Completely isolated full-stack platform containing both Frontend and Backend, configured for local development and multi-platform cloud production deployments.

---

## 📁 Project Structure

```text
FIGMA FRONTEND/
├── backend/
│   ├── app/                  # Application packages and modular components
│   ├── Dockerfile            # Standalone backend container definition
│   ├── Procfile              # PaaS process file (Railway, Heroku, Render)
│   ├── main.py               # FastAPI server with all freight forecasting & analytics endpoints
│   ├── requirements.txt      # Python dependencies (FastAPI, Uvicorn, Gunicorn)
│   ├── .dockerignore         # Docker ignore rules for backend
│   └── .env.example          # Backend environment variables template
├── frontend/
│   ├── src/                  # React 19 + TypeScript + Vite components
│   ├── Dockerfile            # Multi-stage production container (Node + Nginx)
│   ├── nginx.conf            # Production Nginx reverse-proxy & SPA config
│   ├── vercel.json           # Vercel deployment configuration
│   ├── netlify.toml          # Netlify deployment configuration
│   ├── package.json          # Node dependencies & build scripts
│   ├── vite.config.ts        # Vite build configuration
│   ├── .dockerignore         # Docker ignore rules for frontend
│   └── .env.example          # Frontend environment variables template
├── .vscode/
│   ├── settings.json         # Auto-configures Python interpreter for backend
│   └── tasks.json            # VS Code Run tasks
├── .dockerignore             # Root docker ignore rules
├── .gitignore                # Root git ignore rules
├── Dockerfile                # Unified single-container deployment (Fullstack)
├── docker-compose.yml        # Multi-container orchestration (Frontend + Backend)
├── render.yaml               # Render Blueprint deployment definition
├── DEPLOYMENT.md             # Complete deployment instructions & cloud guides
├── start_backend.bat         # Double-click to start FastAPI backend locally
└── start_frontend.bat        # Double-click to start Vite frontend locally
```

---

## 🏃‍♂️ How to Run Locally

### Option 1: Double Click (Windows)
- Double-click `start_backend.bat` to launch the API server (`http://127.0.0.1:8000/docs`).
- Double-click `start_frontend.bat` to launch the React app (`http://localhost:5173`).

### Option 2: Run via Terminal

**Terminal 1 (Backend):**
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
- API Docs & Swagger UI: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```
- App UI: `http://localhost:5173`

---

## 🐳 Docker Deployment

To launch the complete application with Docker:

```bash
docker compose up --build -d
```
- Frontend UI: `http://localhost` (or `http://localhost:3000`)
- Backend API: `http://localhost:8000`

---

## ☁️ Cloud Deployment

Detailed step-by-step instructions for **Render**, **Railway**, **Vercel**, **Netlify**, and **AWS/GCP** can be found in [DEPLOYMENT.md](file:///DEPLOYMENT.md).

- **Unified Single-Container:** Deploy with the root `Dockerfile` to Render, Railway, Cloud Run, or Fly.io.
- **Decoupled Architecture:** Deploy `frontend` to Vercel/Netlify and `backend` to Render/Railway.
