FROM node:alpine
WORKDIR /app
COPY package.json* .
COPY server.js .
RUN npm ci
EXPOSE 3020
CMD [ "node start" ]