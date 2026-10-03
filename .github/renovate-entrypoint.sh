#!/bin/bash

set -e

# renovate: datasource=github-releases depName=containerbase/erlang-prebuild versioning=semver-coerced
install-tool erlang 27.3.3.0
# renovate: datasource=github-releases depName=elixir-lang/elixir extractVersion=^v(?<version>.*)$
install-tool elixir 1.18.3
# renovate: datasource=node-version depName=node
install-tool node 24.19.0
# renovate: datasource=npm depName=pnpm
install-tool pnpm 12.8.2
# renovate: datasource=github-releases depName=containerbase/ruby-prebuild
install-tool ruby 3.3.12
# renovate: datasource=rubygems depName=cocoapods
install-tool cocoapods 1.16.2

runuser -u ubuntu renovate
