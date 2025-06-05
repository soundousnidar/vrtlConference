# Dockerfile for frontend (React with Vite)
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080
RUN npm install axios

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
