# Unified Multi-Stage Dockerfile for Fullstack Single-Container Deployment
# (FastAPI backend serves both REST API endpoints and built React frontend static assets)

# ─── Stage 1: Build React Vite Frontend ───
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* frontend/pnpm-lock.yaml* ./
RUN npm ci || npm install

COPY frontend/ ./
# Use relative paths in production so API calls route directly to the same host
ENV VITE_API_BASE_URL=""
RUN npm run build

# ─── Stage 2: Run Python FastAPI Server ───
FROM python:3.11-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=0.0.0.0 \
    FRONTEND_DIST=/app/frontend/dist

WORKDIR /app

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend assets from Stage 1 into the container
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

WORKDIR /app/backend

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
