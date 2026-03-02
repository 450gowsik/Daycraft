# Base image
FROM node:18

# Create working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy remaining backend files
COPY backend/ .

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "src/server.js"]
