FROM alpine:latest AS build
RUN apk add --update --no-cache nodejs npm && mkdir /usr/local/share/frontend
COPY public /usr/local/share/frontend/public
COPY src /usr/local/share/frontend/src
COPY *.json /usr/local/share/frontend/
RUN cd /usr/local/share/frontend && npm install && npm run build

FROM nginx:stable-alpine
RUN apk add build-base libressl-dev musl-dev libffi-dev
RUN mkdir -p /var/logs/nginx
COPY --from=build /usr/local/share/frontend/build /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
