#!/bin/sh

set -e

if [ -d "$HOME/Library/Application Support/com.apple.container" ]; then
  container system start

  for svc in postgres manticore; do
    state=$(container ls --all 2>/dev/null | awk -v s="$svc" '$1 == s { print $5 }')
    if [ "$state" = "running" ]; then
      continue
    elif [ -n "$state" ]; then
      container rm "$svc"
    fi

    case "$svc" in
      postgres)
        container run --detach --name postgres \
          --publish 5432:5432 \
          -e POSTGRES_PASSWORD=postgres \
          -e PGDATA=/var/lib/postgresql/data/pgdata \
          -v pgdata:/var/lib/postgresql/data \
          postgres:17-alpine \
          postgres -N 500
        ;;
      manticore)
        container run --detach --name manticore \
          --publish 9306:9306 \
          --publish 9308:9308 \
          --memory 2g \
          -v manticoredata:/var/lib/manticore \
          manticoresearch/manticore:latest
        ;;
    esac
  done
else
  docker compose down
  docker compose up -d --remove-orphans
fi

# . .env.local
mix ecto.migrate
iex -S mix phx.server
