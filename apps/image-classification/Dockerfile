# syntax = docker/dockerfile:1

ARG NODE_VERSION=18.16.0

FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="NodeJS"
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -qq

# Fetch Deep Danbooru
# We want to do this as early as possible so we can
# cache the stage for subsequent builds.
FROM base as fetch-deep-danbooru
RUN apt-get install -y unzip curl git

ARG DEEP_DANBOORU_VERSION=pretrained-v3-20211112-sgd-e28

# Clone repository.
RUN git clone https://github.com/flirtual/deep-danbooru.git --depth=1 --branch=${DEEP_DANBOORU_VERSION}
WORKDIR /app/deep-danbooru

## Download model, extract and remove zip.
RUN curl -L https://github.com/flirtual/deep-danbooru/releases/download/${DEEP_DANBOORU_VERSION}/${DEEP_DANBOORU_VERSION}.zip -o ./model.zip
RUN unzip ./model.zip -d . && rm ./model.zip

# Build Deep Danbooru.
FROM base as build-deep-danbooru

COPY --from=fetch-deep-danbooru /app/deep-danbooru /app/deep-danbooru
WORKDIR /app/deep-danbooru

RUN apt-get install -y python3 python3-pip

## Install Deep Danbooru's dependencies.
RUN pip install --break-system-packages -r requirements.txt &&\
    pip install --break-system-packages .[tensorflow]

# Build application.
# We want to do this as late as possible so we can
# utilize the cache for the previous stages.
FROM base as build
WORKDIR /app

## Install node modules
COPY --link package.json .
RUN npm install --legacy-peer-deps --production=false

## Copy source files and build.
COPY --link . .
RUN ./node_modules/.bin/tsc

## Clean up source files.
RUN rm src -rf && rm tsconfig.json -rf

## Copy only the necessary files.
RUN cp -r dist/* . && rm dist -rf

# Final image.
# Build upon the "build-deep-danbooru" stage because
# we want to include the previously installed Python
# dependencies and the model.
FROM build-deep-danbooru

COPY --from=build /app /app

WORKDIR /app

CMD [ "node", "index.js" ]
