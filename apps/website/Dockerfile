FROM node:26.13.0-bookworm-slim AS build
WORKDIR /app
RUN npm install --global corepack@0.36.0 && corepack enable && corepack prepare pnpm@11.28.9 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY apps/website/package.json apps/website/package.json
RUN pnpm install --filter @repovio/website --frozen-lockfile --ignore-scripts
COPY CHANGELOG.md ./CHANGELOG.md
COPY apps/website apps/website
RUN pnpm --filter @repovio/website exec nuxt prepare && pnpm --filter @repovio/website docs:check && pnpm --filter @repovio/website build

FROM node:26.13.0-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/apps/website/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
