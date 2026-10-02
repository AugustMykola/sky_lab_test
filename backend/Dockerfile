# Build context is the repository root (npm workspaces share one lockfile and the domain package).

# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/log-domain/package.json packages/log-domain/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
# Optional CA for TLS-intercepting proxies/antivirus (local builds only, see docker-compose.override.example.yml).
# better-sqlite3 ships prebuilt binaries in prebuilds/, so the node-gyp install step is not needed.
RUN --mount=type=secret,id=extra_ca,required=false NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca \
  npm ci --ignore-scripts -w @log-analyzer/domain -w log-analyzer-backend
COPY packages/log-domain packages/log-domain
COPY backend backend
RUN npm run build -w log-analyzer-backend

# ---- runtime ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DB_PATH=/data/log-analyzer.db
COPY package.json package-lock.json ./
COPY packages/log-domain/package.json packages/log-domain/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN --mount=type=secret,id=extra_ca,required=false NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca \
  npm ci --omit=dev --ignore-scripts -w @log-analyzer/domain -w log-analyzer-backend
COPY --from=build /app/packages/log-domain/dist packages/log-domain/dist
COPY --from=build /app/backend/dist backend/dist
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "backend/dist/index.js"]
