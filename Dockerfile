FROM node:8-alpine
WORKDIR /ok-downloader-bg/
# create local user
COPY . .

RUN chown -R node:node /ok-downloader-bg

USER node
RUN npm install