# backend/Dockerfile

# 1) Base image
FROM node:18-alpine

WORKDIR /app

# 2) Copy package files and install only Node dependencies
COPY package.json package-lock.json ./
RUN npm install

# 3) Copy all backend source code
COPY . .

# 4) Expose port 5000
EXPOSE 5000

# 5) Start the Express server
CMD ["node", "index.js"]

