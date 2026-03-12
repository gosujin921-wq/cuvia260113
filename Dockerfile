# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:1.25-alpine

# nginx 메인 설정 (proxy_cache_path 포함)
COPY nginx-main.conf /etc/nginx/nginx.conf
# 서버 블록 설정
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# 캐시 디렉토리 생성
RUN mkdir -p /var/cache/nginx/its_cache

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
