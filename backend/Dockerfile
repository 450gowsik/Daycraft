FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install packages
RUN npm install

# Copy source
COPY . .

# Backend port
EXPOSE 5000

# Start server
CMD ["npm","start"]