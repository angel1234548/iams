# Stage 1: Build React/Vite app
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy .env first so it's available during build
COPY .env .env

# Copy the rest of the source
COPY . .

# Build with env vars available
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
