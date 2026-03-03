# Use lightweight image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy only package files first
COPY backend/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy rest of the backend code
COPY backend/ .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "src/server.js"]
