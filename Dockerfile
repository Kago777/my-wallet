FROM node:22-alpine
RUN npm install -g pnpm
RUN apk add --no-cache python3 make g++
WORKDIR /app
EXPOSE 3000
CMD ["sh", "-c", "pnpm install && pnpm dev"]