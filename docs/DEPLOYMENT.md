# Deployment Guide for JobSearchAI

This guide provides instructions for deploying JobSearchAI in a production-ready environment.

## 1. Prerequisites
- Docker and Docker Compose installed on the target server.
- Domain name (optional but recommended for SSL).
- API Keys:
  - `JSEARCH_API_KEY` (RapidAPI)
  - `GEMINI_API_KEY` (Google AI)
  - `APIFY_API_TOKEN` (Optional, for LinkedIn contact search)

## 2. Environment Configuration
Create a `.env` file in the root directory (based on `backend/.env.example`):

```env
DATABASE_URL=postgresql://jobsearchuser:jobsearchpassword@db:5432/jobsearchdb
SECRET_KEY=your-super-secret-key-here
JSEARCH_API_KEY=your-jsearch-key
GEMINI_API_KEY=your-gemini-key
APIFY_API_TOKEN=your-apify-token
```

## 3. Docker Deployment (Standard)
The project includes a `docker-compose.yml` that sets up:
- **PostgreSQL**: Persistent database.
- **Backend (FastAPI)**: Python API server.
- **Frontend (Next.js)**: React web application.

To deploy:

```bash
docker-compose up -d --build
```

The application will be available at `http://localhost:3000` (frontend) and `http://localhost:8000` (backend).

## 4. Production Architecture (Recommended)
For a real production environment, it's recommended to use a reverse proxy like **Nginx** or **Caddy** to handle:
- SSL/TLS (HTTPS)
- Port 80/443 mapping
- Routing `/api` to the backend and other requests to the frontend.

### Nginx Example Configuration:
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000; # Frontend
    }

    location /api {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:8000; # Backend
    }
}
```

## 5. Cloud Deployment Options

### Vercel (Frontend Only)
You can deploy the frontend to Vercel by pushing the `frontend/` directory. Ensure you set `NEXT_PUBLIC_API_BASE_URL` to your hosted backend URL.

### AWS / DigitalOcean / Linode (Full Stack)
1. Provision a VPS (Ubuntu recommended).
2. Install Docker & Docker Compose.
3. Clone the repo and follow the Docker Deployment steps.
4. Set up Nginx with Certbot for SSL.

## 6. Database Migrations
The project uses SQLAlchemy. On first run, the database will be initialized. For future schema changes, use Alembic:

```bash
docker-compose exec backend alembic revision --autogenerate -m "description"
docker-compose exec backend alembic upgrade head
```
