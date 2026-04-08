FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/server/package.json packages/server/tsconfig.json ./packages/server/

RUN pnpm install --no-frozen-lockfile

COPY packages/shared/src ./packages/shared/src
COPY packages/server/src ./packages/server/src
COPY Hto6LvxMA6.txt ./Hto6LvxMA6.txt
COPY MP_verify_5xtzKK8iya4gAvMp.txt ./MP_verify_5xtzKK8iya4gAvMp.txt

RUN pnpm --filter @hair/shared build && pnpm --filter @hair/server build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml /app/tsconfig.base.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/server/package.json ./packages/server/package.json
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/Hto6LvxMA6.txt ./Hto6LvxMA6.txt
COPY --from=builder /app/MP_verify_5xtzKK8iya4gAvMp.txt ./MP_verify_5xtzKK8iya4gAvMp.txt

EXPOSE 3000

CMD ["node", "packages/server/dist/app.js"]
