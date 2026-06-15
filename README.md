# GitOps-Based E-Commerce Platform

This repository contains a small e-commerce application built as a set of services and deployed with Kubernetes-friendly manifests.

## Overview

- `frontend`: React shopping UI.
- `product-service`: Node.js API for products.
- `order-service`: Node.js API for order placement and storage.
- `user-service`: Node.js API for signup and login.
- `api-gateway`: Nginx gateway that routes requests to the backend services inside the cluster.
- `mysql`: Optional persistence layer. When MySQL is not available, the services fall back to in-memory data so the app still runs.

The project is structured for GitOps-style deployment with Kubernetes manifests in `k8s/` and an Argo CD application manifest in `deploy/argocd/application.yaml`.

## Architecture

The intended request flow is:

1. Browser opens the React frontend.
2. Frontend calls the API gateway instead of talking directly to services.
3. Nginx routes requests to `product-service`, `order-service`, or `user-service` by Kubernetes DNS name.
4. Services read/write to MySQL when available, otherwise they use memory-backed fallbacks.

Important routes:

- Frontend API base path: `http://api-gateway:8080` in Kubernetes.
- User auth routes: `/users/register` and `/users/login` through the gateway.
- Product routes: `/products` and `/search` through the gateway.
- Order routes: `/orders` through the gateway.

## Services

### frontend

- React app in `frontend/src/App.js`.
- Uses the gateway proxy defined in `frontend/package.json`.
- Loads products, manages a cart, supports signup/login, and can submit an order.

### product-service

- Runs on port `4000`.
- Endpoints:
  - `GET /products`
  - `GET /search?q=...`
  - `POST /products`
  - `GET /health`
- Uses MySQL when reachable, otherwise falls back to sample in-memory products.

### order-service

- Runs on port `4020`.
- Endpoints:
  - `GET /orders`
  - `GET /orders/:id`
  - `POST /orders`
  - `GET /health`
- Uses MySQL when reachable, otherwise falls back to JSON-backed order storage.

### user-service

- Runs on port `4010`.
- Endpoints:
  - `POST /register`
  - `POST /login`
  - `GET /health`
- Hashes passwords with bcrypt and returns a JWT token on login.
- Uses MySQL when available, otherwise falls back to in-memory users.

### api-gateway

- Nginx gateway defined in `k8s/apps/api-gateway.yaml`.
- Routes `/products` and `/search` to `product-service`.
- Routes `/orders` to `order-service`.
- Routes `/users/register` and `/users/login` to `user-service`.
- Also keeps direct `/register` and `/login` routes for compatibility.

## Local Development

Install Node.js 18+ first. Docker is optional unless you want to run MySQL locally.

### Start product-service

```powershell
cd services\product-service
npm ci
$env:PORT=4000; npm start
```

### Start user-service

```powershell
cd services\user-service
npm ci
$env:PORT=4010; npm start
```

### Start order-service

```powershell
cd services\order-service
npm ci
$env:PORT=4020; npm start
```

### Start frontend

```powershell
cd frontend
npm ci
npm start
```

Open `http://localhost:3000` in your browser.

## Environment Variables

The backend services support these variables:

- `DB_HOST`: MySQL host name.
- `DB_USER`: MySQL user name.
- `DB_PASS`: MySQL password.
- `DB_NAME`: MySQL database name.
- `PORT`: Service port.
- `JWT_SECRET`: Secret used by `user-service` to sign login tokens.

## Docker and Kubernetes

Each service has a `Dockerfile` for container builds.

Kubernetes manifests are organized as follows:

- `k8s/apps/product-service.yaml`
- `k8s/apps/order-service.yaml`
- `k8s/apps/user-service.yaml`
- `k8s/apps/frontend-deployment.yaml`
- `k8s/apps/api-gateway.yaml`
- `k8s/apps/mysql-deployment.yaml`

The frontend deployment uses a Kubernetes `NodePort` service, while the backend services use `ClusterIP` services behind the gateway.

## Argo CD

Argo CD application configuration is in `deploy/argocd/application.yaml`.

Before using it, replace the placeholder `repoURL` with your actual Git repository URL.

## Repository Structure

- `frontend/` - React client.
- `services/product-service/` - Product API.
- `services/order-service/` - Order API.
- `services/user-service/` - Authentication API.
- `k8s/` - Kubernetes manifests.
- `deploy/argocd/` - Argo CD application manifest.

## Notes

- The services can run without MySQL, but persistence is limited in fallback mode.
- The frontend should talk to the API gateway, not to individual services directly.
- If you change service routes, update the gateway manifest and frontend calls together.

## Next Improvements

- Add automated tests for frontend and services.
- Add image publishing and rollout automation.
- Add better production-ready health checks, resource limits, and scaling rules.
