# Debian rather than Alpine, to avoid DNS resolution issues in production.
#
# The release bundles ERTS compiled against the builder's glibc, so the runner
# must be the same Debian release or newer. `stable-slim` tracks the current
# stable, which the official Elixir images match or lag behind.
#
#   - https://hub.docker.com/_/elixir?tab=tags - for the build image
#   - https://hub.docker.com/_/debian?tab=tags - for the release image
#   - https://pkgs.org/ - resource for finding needed packages

FROM elixir:1.18.3-otp-27-slim AS builder

# install build dependencies
RUN apt-get update -y && apt-get install -y build-essential cmake git \
    && apt-get clean && rm -f /var/lib/apt/lists/*_*

# prepare build dir
WORKDIR /app

# install hex + rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# set build ENV
ENV MIX_ENV="prod"

# install mix dependencies
COPY mix.exs mix.lock ./
RUN mix deps.get --only $MIX_ENV
RUN mkdir config

# copy compile-time config files before we compile dependencies
# to ensure any relevant config change will trigger the dependencies
# to be re-compiled.
COPY config/config.exs config/${MIX_ENV}.exs config/
RUN mix deps.compile

COPY priv priv

COPY lib lib

# Compile the release
RUN mix compile
RUN mix sentry.package_source_code

# Changes to config/runtime.exs don't require recompiling the code
COPY config/runtime.exs config/

COPY rel rel
RUN mix release

# start a new build stage so that the final image will only contain
# the compiled release and other runtime necessities
FROM debian:stable-slim

RUN apt-get update -y && apt-get install -y libstdc++6 openssl libncurses6 locales ca-certificates \
    && apt-get clean && rm -f /var/lib/apt/lists/*_*

# Set the locale
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

WORKDIR "/app"
RUN chown nobody /app

# set runner ENV
ENV MIX_ENV="prod"

# Only copy the final release from the build stage
COPY --from=builder --chown=nobody:root /app/_build/${MIX_ENV}/rel/flirtual ./

USER nobody

CMD ["/app/bin/server"]
# Appended by flyctl
ENV ECTO_IPV6 true
ENV ERL_AFLAGS "-proto_dist inet6_tcp"
