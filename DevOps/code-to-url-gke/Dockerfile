# syntax=docker/dockerfile:1

# ---- base: shared Node runtime ----
FROM node:24-bookworm-slim AS base
WORKDIR /app

# ---- deps: all dependencies, needed to compile TypeScript ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- build: compile TypeScript to dist/ ----
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- prod-deps: runtime dependencies only ----
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# ---- runtime: final image ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY migrations ./migrations
# Official Node images ship a non-root "node" user (uid 1000).
USER node
EXPOSE 8080 9464
CMD ["node", "dist/server.js"]
