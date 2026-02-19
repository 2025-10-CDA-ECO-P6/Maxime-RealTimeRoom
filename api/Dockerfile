FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install -g pnpm && pnpm install 

COPY . ./

RUN addgroup --system --gid 1001 apigroup
RUN adduser --system --uid 1001 api
RUN chown -R api:apigroup /app

USER api

EXPOSE 3000

CMD ["pnpm", "dev"]