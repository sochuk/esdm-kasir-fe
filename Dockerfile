# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Set production API URL (proxied through Nginx on the same domain)
ARG VITE_API_URL=https://103-150-227-194.nip.io
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production Stage: Serve with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config for SPA (React Router support)
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
