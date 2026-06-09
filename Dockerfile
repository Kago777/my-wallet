FROM node:22-alpine
RUN apk add --no-cache openssl
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec prisma generate
RUN pnpm build
EXPOSE 8080
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm db:seed && pnpm start"]
