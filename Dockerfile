# Base image: Node.js with Alpine for a lightweight image
FROM node:22.11.0-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the container
COPY package*.json ./

# Install project dependencies
RUN npm install --production

# Copy the rest of the application code into the container
COPY . .

# Expose the application port
EXPOSE 8000

# Define the default command to run your application
CMD ["npm", "start"]
