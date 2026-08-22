# 🚀 Deploy & DevOps - GlassHub Professional Resume

This document describes the **DevOps, Infrastructure, and Deployment** practices for **GlassHub Professional Resume**, covering container orchestration via **Docker Compose**, the **Nginx** security gateway, **Puppeteer Linux calibration for A4 PDFs**, and **Datadog APM** telemetry.

---

## 🐳 Container Orchestration via Docker Compose

The GlassHub ecosystem is 100% containerized. All services are declared and networked using [`docker-compose.yml`](../docker-compose.yml).

### Application Container Topology

| Container Name | Base Image | Internal Port | Exposed Port | Role |
| :--- | :--- | :--- | :--- | :--- |
| `glasshub-nginx` | `nginx:alpine` | `80` | `80` | Reverse proxy, SSL termination, routing, and security gateway. |
| `glasshub-frontend` | `node:20-alpine` | `5173` | - | Vite React static/dev server. |
| `glasshub-backend` | `node:20-alpine` | `3001` | - | Express Backend API (Controllers, Auth, Prisma, ATS). |
| `glasshub-worker-pdf` | `ghcr.io/puppeteer/puppeteer` | - | - | PDF export worker running Puppeteer and headless Chromium on Linux. |
| `glasshub-worker-trans` | `node:20-alpine` | - | - | Async resume translation worker connecting to Ollama/LLM. |
| `glasshub-worker-notif` | `node:20-alpine` | - | - | Notification worker for transactional email dispatch. |
| `glasshub-postgres` | `postgres:16-alpine` | `5432` | `5432` | Relational database with persistent volume `pg_data`. |
| `glasshub-redis` | `redis:7-alpine` | `6379` | `6379` | In-memory store managing BullMQ message queues. |
| `glasshub-datadog` | `datadog/agent:latest` | `8125/udp` | - | Datadog Agent collecting APM traces and DogStatsD metrics. |

---

## 🌐 Nginx Security Gateway Configuration (`../nginx`)

Nginx acts as the single public entry point (`:80`). It intercepts incoming traffic and applies routing and security rules:

```nginx
server {
    listen 80;
    server_name localhost;

    # Global Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    # Backend API Route Proxy
    location /api/ {
        proxy_pass http://glasshub-backend:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend React Route Proxy
    location / {
        proxy_pass http://glasshub-frontend:5173/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

---

## 🖨️ Puppeteer Linux Calibration for Flawless A4 PDFs

Server-side PDF generation often suffers from missing fonts, page shifts, or cropped elements. GlassHub addresses this with **3 calibration layers**:

### 1. Linux Font Package Installation (`worker-pdf`)
The `worker-pdf` Dockerfile explicitly installs system fonts to guarantee pristine rendering of glyphs and emojis:
```dockerfile
RUN apt-get update && apt-get install -y \
    fonts-inter \
    fonts-roboto \
    fonts-noto-color-emoji \
    fonts-liberation \
    --no-install-recommends
```

### 2. Headless Chromium Launch Flags
Prevents shared memory buffer overflows inside Docker containers:
```javascript
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium-browser',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', // Prevents /dev/shm crash in Docker
    '--font-render-hinting=medium',
    '--force-color-profile=srgb'
  ]
});
```

### 3. A4 Page Dimension Setup
```javascript
const pdfBuffer = await page.pdf({
  format: 'A4',
  printBackground: true, // Ensures frosted glass background colors and blurs render
  margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
  preferCSSPageSize: true
});
```

---

## 🐶 Datadog APM & DogStatsD Configuration

The backend emits custom execution metrics to the Datadog Agent container over UDP.

### Required Environment Variables (`../.env`):
```env
DD_API_KEY=your_datadog_api_key_here
DD_SITE=datadoghq.com
DD_AGENT_HOST=glasshub-datadog
DD_DOGSTATSD_PORT=8125
DD_TRACE_ENABLED=true
```

---

## 🔑 Environment Variables Checklist (`../.env.example`)

When setting up the project, run the helper script to initialize `.env`:
```bash
node scripts/init-env.js
```

Key environment variables:
- `DATABASE_URL="postgresql://postgres:postgres@glasshub-postgres:5432/glasshub_db?schema=public"`
- `REDIS_URL="redis://glasshub-redis:6379"`
- `JWT_SECRET="glasshub_super_secret_jwt_key_2026"`
- `PORT=3001`
