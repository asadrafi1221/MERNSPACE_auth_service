FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies including devDependencies
RUN npm install

COPY . .

EXPOSE 4500

CMD ["npm", "run", "dev"]