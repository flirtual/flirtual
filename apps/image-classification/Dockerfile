# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=18.16.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="NodeJS"

# NodeJS app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential unzip curl git

# Install node modules
COPY --link package.json .
RUN npm install

# Install Deep Danbooru.
RUN git clone https://github.com/flirtual/deep-danbooru
WORKDIR /app/deep-danbooru

RUN pip install -r requirements.txt

# Copy application code
COPY --link . .

RUN curl -L https://github.com/KichangKim/DeepDanbooru/releases/download/v3-20211112-sgd-e28/deepdanbooru-v3-20211112-sgd-e28.zip -o deep-danbooru/model.zip
RUN unzip deep-danbooru/model.zip -d deep-danbooru
RUN rm deep-danbooru/model.zip

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
CMD [ "npm", "run", "start" ]
