FROM alpine:latest AS build
RUN apk add --update --no-cache nodejs npm && mkdir /usr/local/share/backend
COPY data-types /usr/local/share/backend/data-types
COPY db-client /usr/local/share/backend/db-client
COPY graphql /usr/local/share/backend/graphql
COPY utils /usr/local/share/backend/utils
COPY main.ts /usr/local/share/backend/main.ts
COPY *.json /usr/local/share/backend/
RUN cd /usr/local/share/backend && npm install && npm run build

FROM node:alpine
COPY --from=build /usr/local/share/backend/build /usr/local/share/backend
COPY --from=build /usr/local/share/backend/*.json /usr/local/share/backend/
COPY --from=build /usr/local/share/backend/graphql/schema.graphql /usr/local/share/backend/graphql/
COPY ecosystem.config.js /usr/local/share/backend/
WORKDIR /usr/local/share/backend
RUN npm install && npm install -g pm2

