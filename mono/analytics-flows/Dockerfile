FROM node:22-alpine

#
# Default to production build. Override in non-production envs.
#
ARG NODE_ENV=production

RUN mkdir -p /app
WORKDIR /app
RUN adduser -S app

RUN npm install -g pnpm@10.4.1

COPY . .

#
# Top level install installs turbo which needs optional deps.
#
RUN pnpm install  --filter=. --frozen-lockfile --loglevel notice
#
# CI avoids interactive confirmation that you want to proceed.
#
RUN CI=true pnpm install --no-optional --filter=@mono/analytics-flows... --frozen-lockfile --loglevel notice
RUN pnpm turbo run tsc:build --filter=@mono/analytics-flows... --concurrency=50%

RUN chown -R app /app
USER app

WORKDIR /app/analytics-flows