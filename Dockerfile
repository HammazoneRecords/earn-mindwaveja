# Earn MindWave JA — Next.js
# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: production
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3003
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.ts ./
RUN npm install --omit=dev
EXPOSE 3003
CMD ["npm", "start"]
