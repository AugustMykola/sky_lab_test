# Build context is the repository root (npm workspaces share one lockfile and the domain package).

# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/log-domain/package.json packages/log-domain/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
# Optional CA for TLS-intercepting proxies/antivirus (local builds only, see docker-compose.override.example.yml).
RUN --mount=type=secret,id=extra_ca,required=false NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca \
  npm ci -w @log-analyzer/domain -w log-analyzer-frontend
COPY packages/log-domain packages/log-domain
COPY frontend frontend
RUN npm run build -w log-analyzer-frontend

# ---- runtime ----
FROM nginx:1.29-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
