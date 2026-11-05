FROM node:26.13.0-bookworm-slim AS build
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY libs/schemas/package.json libs/schemas/package.json
COPY patches ./patches
RUN npm install --global corepack@0.36.0 && corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @repovio/web build

FROM node:26.13.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /workspace/apps/web/.output ./.output
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=6 --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:3000').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", ".output/server/index.mjs"]
