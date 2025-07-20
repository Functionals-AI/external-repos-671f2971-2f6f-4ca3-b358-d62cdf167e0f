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

RUN pnpm install --filter=@mono/marketing-flows... --frozen-lockfile --loglevel notice
RUN pnpm turbo run tsc:build --filter=@mono/marketing-flows... --concurrency=50%

RUN chown -R app /app
USER app

WORKDIR /app/marketing-flows