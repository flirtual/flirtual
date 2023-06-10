# syntax = docker/dockerfile:1

ARG NODE_VERSION=18.16.0

FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="NodeJS"
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -qq && \
    apt-get install -y python3 python3-pip

# Builder image.
FROM base as build

RUN apt-get install -y python-is-python3 pkg-config build-essential unzip curl git

# Install Deep Danbooru.
ARG DEEP_DANBOORU_VERSION=pretrained-v3-20211112-sgd-e28

RUN git clone https://github.com/flirtual/deep-danbooru.git --depth=1 --branch=${DEEP_DANBOORU_VERSION}
WORKDIR /app/deep-danbooru

RUN curl -L https://github.com/flirtual/deep-danbooru/releases/download/${DEEP_DANBOORU_VERSION}/${DEEP_DANBOORU_VERSION}.zip -o ./model.zip
RUN unzip ./model.zip -d .
RUN rm ./model.zip

WORKDIR /app

# Install node modules
COPY --link package.json .
RUN npm install --legacy-peer-deps --production=false

# Build application.
COPY --link . .
RUN ./node_modules/.bin/tsc

## Clean up source files.
RUN rm src -rf && rm tsconfig.json -rf

## Copy only the necessary files.
RUN cp -r dist/* . && rm dist -rf

#  Final image.
FROM base

COPY --from=build /app /app

# Install Deep Danbooru's dependencies.
WORKDIR /app/deep-danbooru
RUN pip install -r requirements.txt &&\
    pip install .[tensorflow]

WORKDIR /app

CMD [ "node", "index.js" ]
