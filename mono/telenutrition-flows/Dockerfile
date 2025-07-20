FROM node:22-alpine
#
# Default to production build. Override in non-production envs.
#
ARG NODE_ENV=production

#
# Default to production build. Override in non-production envs.
#
ARG NODE_ENV=production

WORKDIR /app

RUN npm install -g pnpm@10.4.1

COPY . .

#
# Top level install installs turbo which needs optional deps.
#
RUN pnpm install  --filter=. --frozen-lockfile --loglevel notice
#
# CI avoids interactive confirmation that you want to proceed.
#
RUN CI=true pnpm install --no-optional --filter=@mono/telenutrition-flows... --frozen-lockfile --loglevel notice
RUN pnpm turbo run tsc:build --filter=@mono/telenutrition-flows... --concurrency=50%
WORKDIR /app/telenutrition-flows

USER node