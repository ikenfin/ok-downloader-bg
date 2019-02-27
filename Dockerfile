FROM node:8-alpine
WORKDIR /ok-downloader-bg/
# create local user
COPY . .

RUN chown -R node:node /ok-downloader-bg
RUN mkdir /ok-downloader-data/ && chown -R node:node /ok-downloader-data

USER node
RUN npm install