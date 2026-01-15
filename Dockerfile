# Use official Node.js runtime as base image
FROM node:16-slim

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy the rest of the application
COPY . .

# Create directory for SQLite database
RUN mkdir -p /tmp/db

# Expose the port Cloud Run will listen on
EXPOSE 8080

# Set environment variable for port
ENV PORT=8080
ENV NODE_ENV=production

# Run the application
CMD ["node", "server.js"]
