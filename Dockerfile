FROM node:22 AS build
WORKDIR /usr/src/app
RUN npm install --global pnpm@11.8.0
COPY package.json pnpm-lock.yaml ./
COPY vendor ./vendor
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:1.26
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
