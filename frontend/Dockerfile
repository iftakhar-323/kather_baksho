# Step 1: Build stage
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install dependencies first for efficient caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy full source code and build production bundle
COPY . .
ENV VITE_API_BASE_URL=/api
RUN npm run build

# Step 2: Nginx production web server
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
