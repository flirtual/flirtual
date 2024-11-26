#! /bin/bash

set -e
docker compose down
docker compose up -d --remove-orphans

source .env.local
mix ecto.migrate
iex -S mix phx.server
