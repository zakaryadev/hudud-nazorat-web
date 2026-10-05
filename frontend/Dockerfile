FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Backend boshqa domenda bo'lsa build paytida VITE_API_URL bering; bo'sh = bir domen (/api)
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# nginx sozlamasi docker-compose.prod.yml orqali /etc/nginx/conf.d/default.conf ga ulanadi
