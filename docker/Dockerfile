FROM node:20-alpine AS build

RUN apk add --no-cache python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY nest-cli.json tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine

RUN apk add --no-cache python3 make g++
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force \
  && apk del python3 make g++

COPY --from=build /app/dist ./dist

EXPOSE 3001
USER node
CMD ["node", "dist/main.js"]
