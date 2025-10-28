# Use Node.js 20 LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]