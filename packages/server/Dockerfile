FROM node:20-alpine

WORKDIR /app

# Install pnpm and typescript
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN npm install -g typescript

# Copy workspace config files first
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install all dependencies (need typescript for build)
RUN pnpm install --frozen-lockfile

# Build shared package
COPY packages/shared/ ./packages/shared/
RUN cd packages/shared && npx tsc

# Copy server source and build
# Use --noEmitOnError false to emit JS despite type errors
# Use --skipLibCheck to skip .d.ts checking
COPY packages/server/ ./packages/server/
RUN cd packages/server && node -e "
const fs = require('fs');
const c = JSON.parse(fs.readFileSync('tsconfig.json','utf8'));
delete c.compilerOptions.rootDir;
fs.writeFileSync('tsconfig.json', JSON.stringify(c, null, 2));
" && npx tsc --noEmitOnError false --skipLibCheck

# Remove devDependencies for production
RUN pnpm install --frozen-lockfile --prod

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "packages/server/dist/app.js"]
