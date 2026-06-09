FROM node:22-alpine
RUN apk add --no-cache python3 make g++ openssl
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --shamefully-hoist
COPY . .
RUN pnpm build
EXPOSE 8080
CMD ["sh", "-c", "npx prisma migrate deploy && pnpm start"]