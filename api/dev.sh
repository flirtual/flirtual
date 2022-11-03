set -e
docker compose down
docker compose up -d --remove-orphans
iex -S mix phx.server