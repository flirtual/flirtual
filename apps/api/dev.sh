#!/bin/sh

set -e

if [ -d "$HOME/Library/Application Support/com.apple.container" ]; then
  container system start

  for svc in postgres elasticsearch; do
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
      elasticsearch)
        container run --detach --name elasticsearch \
          --publish 9200:9200 \
          -e ES_JAVA_OPTS="-Xms512m -Xmx512m" \
          -e xpack.security.enabled=false \
          -e discovery.type=single-node \
          -v esdata:/usr/share/elasticsearch/data \
          elasticsearch:8.6.2
        ;;
    esac
  done
else
  docker compose down
  docker compose up -d --remove-orphans
fi

. .env.local
mix ecto.migrate
iex -S mix phx.server
