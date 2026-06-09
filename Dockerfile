FROM node:22-alpine
RUN apk add --no-cache openssl
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

# Build-time placeholders (overridden at runtime via docker-compose / Railway)
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build \
    AUTH_SECRET=build-placeholder-secret \
    AUTH_GOOGLE_ID=build-placeholder \
    AUTH_GOOGLE_SECRET=build-placeholder

RUN pnpm exec prisma generate
RUN pnpm build

EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm db:seed && pnpm start"]
