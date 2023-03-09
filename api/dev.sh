set -e
docker compose down
docker compose up -d --remove-orphans

source .env.local
iex -S mix phx.server
