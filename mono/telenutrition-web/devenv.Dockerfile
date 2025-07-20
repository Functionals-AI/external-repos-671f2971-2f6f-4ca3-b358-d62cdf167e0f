FROM node:22-alpine as dependencies
ENV NEXT_TELEMETRY_DISABLED 1
WORKDIR /app
RUN npm install -g pnpm@10.4.1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ./telenutrition-web/package.json ./telenutrition-web/package.json
RUN pnpm install --filter=@mono/telenutrition-web --frozen-lockfile --loglevel notice

FROM node:22-alpine as runner
ENV NEXT_TELEMETRY_DISABLED 1
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/telenutrition-web/node_modules ./telenutrition-web/node_modules
COPY ./telenutrition-web ./telenutrition-web
WORKDIR /app/telenutrition-web
RUN chown -R node:node /app
USER node
EXPOSE 3000