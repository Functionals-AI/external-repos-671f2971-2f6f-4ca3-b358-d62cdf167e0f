FROM amacneil/dbmate:2.19

RUN apk update && apk add curl

RUN mkdir -p /app
WORKDIR  /app
RUN adduser -S app

COPY . .

RUN mkdir /app/ssl
RUN curl -o /app/ssl/global-bundle.pem 'https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem'

RUN chown -R app /app
USER app

WORKDIR /app
