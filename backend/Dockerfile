# --- build
ARG NODE_IMAGE=node:20-slim
FROM ${NODE_IMAGE} AS build
# Prisma uchun libssl kerak. Allaqachon bor bo'lsa (masalan node:20-bookworm) apt ishlatilmaydi — offline serverda ham build bo'ladi
RUN ls /usr/lib/*/libssl.so* >/dev/null 2>&1 || (apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*)
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# --- runtime (seed uchun ts-node kerak, shuning uchun node_modules to'liq)
FROM ${NODE_IMAGE}
# Prisma uchun libssl kerak. Allaqachon bor bo'lsa (masalan node:20-bookworm) apt ishlatilmaydi — offline serverda ham build bo'ladi
RUN ls /usr/lib/*/libssl.so* >/dev/null 2>&1 || (apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*)
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json tsconfig.json ./
COPY prisma ./prisma
RUN mkdir -p /app/uploads && chown -R node:node /app
USER node
EXPOSE 3000
# Jadvallarni migratsiya qilib, serverni ishga tushiradi
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
