FROM node:22-alpine AS dependencies

ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p /app
WORKDIR /app
RUN npm install -g pnpm@10.4.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

COPY ./telenutrition-web/ ./telenutrition-web/

COPY ./foodapp ./foodapp
COPY ./marketing ./marketing
COPY ./analytics ./analytics
COPY ./common ./common
COPY ./telenutrition ./telenutrition

RUN pnpm install \
    --filter=@mono/foodapp \
    --filter=@mono/analytics \
    --filter=@mono/common \
    --filter=@mono/telenutrition \
    --filter=@mono/telenutrition-web \
    --frozen-lockfile --loglevel notice \
    && pnpm \
    --filter=@mono/foodapp \
    --filter=@mono/analytics \
    --filter=@mono/common \
    --filter=@mono/telenutrition \
    tsc

RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm --filter=@mono/telenutrition --filter=@mono/telenutrition-web tsc:build && pnpm prune --prod

###

FROM node:22-alpine AS runner

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_VERSION
ARG NEXT_PUBLIC_ASSETS_CDN_URL
ARG NODE_ENV
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG RETOOL_APP_BASE_URL
ARG NEXT_PUBLIC_INTERCOM_APP_ID

ENV NODE_ENV=$NODE_ENV
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules

COPY --from=dependencies /app/telenutrition/lib /app/node_modules/@mono/telenutrition/lib

COPY --from=dependencies /app/telenutrition-web/node_modules ./telenutrition-web/node_modules

COPY ./telenutrition-web ./telenutrition-web

WORKDIR /app/telenutrition-web

RUN echo "NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL" > .env.$NODE_ENV && \
    echo "NEXT_PUBLIC_VERSION=$NEXT_PUBLIC_VERSION" >> .env.$NODE_ENV && \
    echo "NEXT_PUBLIC_ASSETS_CDN_URL=$NEXT_PUBLIC_ASSETS_CDN_URL" >> .env.$NODE_ENV && \
    echo "NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID" >> .env.$NODE_ENV && \
    echo "RETOOL_APP_BASE_URL=$RETOOL_APP_BASE_URL" >> .env.$NODE_ENV && \
    echo "NEXT_PUBLIC_INTERCOM_APP_ID=$NEXT_PUBLIC_INTERCOM_APP_ID" >> .env.$NODE_ENV

RUN npm run build && chown -R node:node /app
USER node
EXPOSE 8081