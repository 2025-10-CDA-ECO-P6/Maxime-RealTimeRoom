FROM node:20-alpine AS builder

WORKDIR /app

COPY . .

RUN npm install -g pnpm && pnpm install

RUN pnpm build

RUN addgroup --system --gid 1001 webgroup 
RUN adduser --system --uid 1001 web
RUN chown -R web:webgroup /app

USER web



FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder app/dist /usr/share/nginx/html
COPY --from=builder app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]