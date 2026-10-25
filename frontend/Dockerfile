# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN npm ci || npm install

# Copy application source
COPY . .

# Build argument for API Base URL (if building with custom URL; defaults to empty for relative / same-domain proxy)
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build for production
RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
