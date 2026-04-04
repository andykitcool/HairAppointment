# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/admin/package.json ./packages/admin/

RUN pnpm install --frozen-lockfile

# Force rebuild - cache buster v2
RUN echo "Cache bust v2: $(date)"

COPY packages/shared/ ./packages/shared/
COPY packages/admin/ ./packages/admin/

# Build shared package
RUN ./node_modules/.bin/tsc -p packages/shared/tsconfig.json

# Build admin: use node to invoke vue-tsc and vite directly from root node_modules
RUN cd packages/admin && \
    node /app/node_modules/vue-tsc/bin/vue-tsc.js -b && \
    node /app/node_modules/vite/bin/vite.js build

# Production stage - Nginx
FROM nginx:alpine

COPY --from=builder /app/packages/admin/dist /usr/share/nginx/html
COPY packages/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
