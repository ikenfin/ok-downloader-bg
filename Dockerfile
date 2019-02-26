FROM node:8-alpine

COPY . /ok-downloader-bg
WORKDIR /ok-downloader-bg/
RUN npm install

# CMD [ "npm", "start" ]