FROM node:22-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]