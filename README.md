# GitOps-Based E-Commerce Platform (Minimal Scaffold)

Overview
- Microservices shopping platform: `product-service`, `user-service`, and a React `frontend`.
- Datastore: MySQL (optional — services fall back to in-memory data when DB is unavailable).
- Deploys to Kubernetes; Argo CD is included to manage application manifests.

Quickstart — local development
1. Install Node.js (18+) and optionally Docker if you want to run MySQL in a container.
2. Start services locally (each in its folder):

PowerShell examples:

cd services\product-service
npm ci
$env:PORT=4000; npm start

cd ..\user-service
npm ci
$env:PORT=4010; npm start

cd ..\..\frontend
npm ci
npm start

Visit http://localhost:3000 — frontend uses proxy to backend API.

Environment variables
- DB_HOST, DB_USER, DB_PASS, DB_NAME — for MySQL persistence.

Docker
- Each service has a Dockerfile for Kubernetes deployment.

CI/CD
- GitHub Actions runs linting + build checks for frontend and services.

Argo CD
- Application manifest is in deploy/argocd/application.yaml.

Repository structure
- services/
- frontend/
- k8s/
- deploy/argocd/

Next steps
- Add image automation pipeline (GHCR/ECR)
- Add tests
- Improve Kubernetes scaling policies