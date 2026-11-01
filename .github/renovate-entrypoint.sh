#!/bin/bash

set -e

# renovate: datasource=github-releases depName=containerbase/erlang-prebuild
install-tool erlang 29.1.2.0
# renovate: datasource=github-releases depName=elixir-lang/elixir extractVersion=^v(?<version>.*)$
install-tool elixir 1.20.4
# renovate: datasource=node-version depName=node
install-tool node 26.13.0
# renovate: datasource=npm depName=pnpm
install-tool pnpm 12.6.0

runuser -u ubuntu renovate
