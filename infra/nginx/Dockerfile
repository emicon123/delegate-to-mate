# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine
COPY site/dist-delegate /usr/share/nginx/html
COPY infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf
