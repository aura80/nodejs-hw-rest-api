# Dockerfile for a Node.js application
# Use the official Node.js image as a base
FROM node:20
# Set the working directory
WORKDIR /app
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy the rest of the application code
COPY . .
# Expose the application port
EXPOSE 3000
# Start the application
CMD ["npm", "start"]

# Builds the Docker image
# docker build -t my-node-app .

# Runs the container
# docker run -p 3000:3000 my-node-app
