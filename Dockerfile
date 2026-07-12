FROM node:24-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json package-lock.json ./

RUN npm i

COPY . ./

RUN npm run build

FROM node:24-alpine

ARG VERSION=dev
ARG BUILD_DATE=1970-01-01

WORKDIR /app

COPY --from=build /app/.output ./

ENV PORT=80
ENV HOST=0.0.0.0
ENV NUXT_PUBLIC_VERSION=${VERSION}
ENV NUXT_PUBLIC_BUILD_DATE=${BUILD_DATE}

EXPOSE 80

CMD ["node", "/app/server/index.mjs"]
