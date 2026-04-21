FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS deps

RUN npm install

FROM deps AS frontend-builder

COPY . .
RUN npm run build

FROM deps AS api

ENV NODE_ENV=production

COPY server ./server
COPY scripts/data ./scripts/data
COPY package*.json ./

EXPOSE 3001

CMD ["node", "server/index.js"]

FROM nginx:1.27-alpine AS web

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
