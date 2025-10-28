# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install

# Expose port (optional for testing locally)
EXPOSE 3000

# Start the MCP server
CMD ["npm", "start"]
