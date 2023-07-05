# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY docker/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY docker/config.js /usr/share/nginx/html/config.js
COPY docker/config.json /usr/share/nginx/html/config.json

# Dynamic labels are defined from the goreleaser configuration ".goreleaser.yaml"
LABEL org.opencontainers.image.authors="Olivier Vernin<me@olblak.com>"
LABEL org.opencontainers.image.title="Udash-front"
LABEL org.opencontainers.image.description="The Udash Frontend"
LABEL org.opencontainers.image.source https://github.com/updatecli/udash-front


EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
