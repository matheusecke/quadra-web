FROM node:22-alpine AS build
WORKDIR /home/node/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /home/node/app/dist /usr/share/nginx/html
