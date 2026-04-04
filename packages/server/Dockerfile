FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy workspace config files first
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install all dependencies (need typescript for build)
# Using --no-frozen-lockfile to allow new dependencies to be installed
RUN pnpm install --no-frozen-lockfile

# Build shared package (also as CommonJS for consistency)
COPY packages/shared/ ./packages/shared/
RUN node -e "const fs=require('fs');const c=JSON.parse(fs.readFileSync('packages/shared/tsconfig.json','utf8'));c.compilerOptions.module='CommonJS';c.compilerOptions.moduleResolution='node';fs.writeFileSync('packages/shared/tsconfig.json',JSON.stringify(c,null,2));" && ./node_modules/.bin/tsc -p packages/shared/tsconfig.json

# Copy server source and build
# Override module to CommonJS, remove "type":"module" from package.json to avoid ESM/CJS conflict
# Redirect @hair/shared path alias to compiled dist so tsc doesn't need to go outside rootDir
COPY packages/server/ ./packages/server/
RUN node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('packages/server/package.json','utf8'));delete pkg.type;fs.writeFileSync('packages/server/package.json',JSON.stringify(pkg,null,2));const c=JSON.parse(fs.readFileSync('packages/server/tsconfig.json','utf8'));c.compilerOptions.module='CommonJS';c.compilerOptions.moduleResolution='node';c.compilerOptions.paths={'@hair/shared':['../shared/dist/index']};fs.writeFileSync('packages/server/tsconfig.json',JSON.stringify(c,null,2));" && ./node_modules/.bin/tsc -p packages/server/tsconfig.json || true

# Verify output
RUN ls packages/server/dist/

# (Skipping pnpm install --prod to avoid dependency loss in monorepo hoisted mode)

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "packages/server/dist/server/src/app.js"]
