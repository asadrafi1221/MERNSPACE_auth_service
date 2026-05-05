# Use Node.js 20 as the base image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# Production Build
FROM node:20-alpine AS production

ENV NODE_ENV=prod

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts 

COPY --from=builder /app/dist ./

EXPOSE 4500

CMD ["node","server.js"] 















