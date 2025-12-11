# Этап 1: Сборка приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json и yarn.lock
COPY package.json yarn.lock ./

# Устанавливаем зависимости
RUN yarn install --frozen-lockfile

# Копируем все файлы проекта
COPY . .

# Генерируем Prisma Client
RUN yarn prisma generate

# Собираем приложение
RUN yarn build

# Этап 2: Production образ
FROM node:20-alpine

WORKDIR /app

# Устанавливаем только production зависимости
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated

# Копируем Prisma схему
COPY prisma ./prisma
COPY prisma.config.ts ./

# Копируем документацию из корня
COPY *.md ./
COPY docs ./docs
COPY dumps ./dumps

# Создаем директорию для экспорта Excel
RUN mkdir -p /app/exports

# Устанавливаем права
RUN chown -R node:node /app

# Переключаемся на пользователя node
USER node

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "dist/main"]
