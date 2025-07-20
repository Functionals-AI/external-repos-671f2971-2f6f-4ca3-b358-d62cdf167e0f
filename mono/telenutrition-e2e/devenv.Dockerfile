FROM mcr.microsoft.com/playwright:v1.50.1-noble

RUN npx -y playwright@1.50.1 install --with-deps

ARG NODE_ENV=devenv

RUN mkdir -p /app
WORKDIR /app

ENV HOME=/app

RUN npm install -g pnpm@10.4.1

COPY . .

RUN pnpm install --filter=@mono/telenutrition-e2e... --frozen-lockfile --loglevel notice
RUN pnpm turbo run tsc:build --filter=@mono/telenutrition-e2e... --concurrency=50%

RUN addgroup --system app
RUN adduser --system --ingroup app --home /app app 
RUN chown -R app /app

USER app

WORKDIR /app/telenutrition-e2e
