# GitOps-Based E-Commerce Platform (Minimal Scaffold)

Overview
- Microservices shopping platform: `product-service`, `user-service`, and a React `frontend`.
- Datastore: MySQL (optional — services fall back to in-memory data when DB is unavailable).
- Deploys to Kubernetes; Argo CD is included to manage application manifests.

Quickstart — local development
1. Install Node.js (18+) and optionally Docker if you want to run MySQL in a container.
2. Start services locally (each in its folder):

PowerShell examples:

```powershell
cd services\product-service
npm ci
$env:PORT=4000; npm start

cd ..\user-service
npm ci
$env:PORT=4010; npm start

cd ..\..\frontend
npm ci
npm start
```

Visit http://localhost:3000 — the frontend uses a CRA proxy to `http://localhost:4000` for the product API.

Environment variables
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` — set these if you want services to persist to MySQL.

Building Docker images (recommended for Kubernetes / Argo CD)
- Each service and the frontend have a `Dockerfile` at their root. Build and push images to your registry, then update the `image:` in `k8s/*.yaml` (or use an automated image updater).

CI (GitHub Actions)
- A CI workflow is provided at `.github/workflows/ci.yml` and runs on pushes and PRs to `main`/`master`.
- The workflow currently:
	- Lints YAML (manifests and compose)
	- Builds the frontend (`npm ci` + `npm run build`)
	- Runs smoke checks for `services/product-service` and `services/user-service` — installs deps, checks syntax, starts each service and verifies `/health`.

Argo CD deployment
- Example Argo CD Application manifest: `deploy/argocd/application.yaml`. Replace `spec.source.repoURL` (and image refs in your manifests) with your repository/registry details.
- Typical flow:
	1. Push image tags to your container registry.
 2. Update `k8s` manifests with the new image tag (or use an image updater tool).
 3. Argo CD will detect changes and sync the cluster.

Secrets and safety
- Do NOT commit `.env` files or secrets. A `.gitignore` is included to prevent `node_modules/` and `.env` from being committed.
- Use GitHub Secrets or a Kubernetes Secret provider for DB passwords and JWT secrets.

Repository layout
- `services/` — backend microservices (Express)
- `frontend/` — React app
- `k8s/` — cluster manifests (MySQL example)
- `deploy/argocd/` — Argo CD Application manifest

Useful files
- `services/product-service/index.js`
- `services/user-service/index.js`
- `frontend/src/App.js`
- `deploy/argocd/application.yaml`

Next steps (optional)
- Add a workflow to build and push images (GHCR/GCR/ECR) and update Kubernetes manifests automatically.
- Add unit/integration tests and extend CI to run them.

If you want, I can add a GitHub Actions workflow to build/publish images and automatically update the manifests for Argo CD.
