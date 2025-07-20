#
# Pin to version NodeJS 22.15.0 so we do not encounter breaking changes due to secuirty fixes
# that go out in minor  version. See, for example:
#
# https://github.com/openpgpjs/openpgpjs/issues/1727 
# 
#

FROM node:22.15.0-bookworm

#
# Default to production build. Override in non-production envs.
#
ARG NODE_ENV=production

RUN mkdir -p /app
WORKDIR /app

ENV HOME=/app

RUN npm install -g pnpm@10.4.1

COPY . .

RUN pnpm install --filter=@mono/ops-flows... --frozen-lockfile --loglevel notice
RUN pnpm turbo run tsc:build --filter=@mono/ops-flows... --concurrency=50%
RUN pnpm --filter="@mono/common" playwright-install

RUN addgroup --system app
RUN adduser --system --ingroup app --home /app app 
RUN chown -R app /app

USER app

WORKDIR /app/ops-flows