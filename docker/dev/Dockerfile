
# Use Node.js 20 as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies including devDependencies
RUN npm install

# Copy the app code into container 
COPY . . 

# Port binding 
EXPOSE 4500 

# Command to run the application
CMD ["npm", "run", "dev"]