# api.flirtu.al

## Contribution
### Initial installation and setup
* Install [Docker](https://docs.docker.com/get-docker/) and the [asdf version manager](https://asdf-vm.com/guide/getting-started.html).

  * ``asdf plugin-add elixir https://github.com/asdf-vm/asdf-elixir.git``

  * ``asdf plugin add erlang https://github.com/asdf-vm/asdf-erlang.git``

  * Use ``asdf install`` to install Elixir and Erlang.

* Configure the required environment variables.

	* Copy `.env.example` to `.env.local`.

  * Fill in all the required values.

* Set up the project.

	* Bring the environment variables into scope using: `source .env.local`.

	* Start postgres in a detached state manually with: `docker compose up -d postgres`.

  * Run `mix setup` to install dependencies, create the database, and run migrations.

  * Run `mix phx.gen.cert` to generate a self-signed TLS certificate.

* Start the server with `./dev.sh`, this will start the server and automatically recompile on file changes.

* Now you can visit [`127.0.0.1:4001`](https://127.0.0.1:4001) from your browser.

### Database snapshots

When doing long-running operations, like dumping the database, it is recommended to fork the database on [fly.io, our database provider](https://fly.io), then run the operation on the forked database to avoid downtime.

```sh
fly postgres create --fork-from flirtual-db
```
Then, you can connect using the credentials provided by the command above.
```sh
fly proxy 5433:5432 -a <new-app-name>
```

Using the new connection, you can finally dump the database. When dumping the database, it is recommended to exclude the `likes_and_passes` and `oban` tables to avoid dumping unnecessary data, this often reduces the dump size by a significant amount.
```sh
pg_dump -Fc -h localhost -p 5433 -U postgres \
  --exclude-table-data='*.likes_and_passes' \
  --exclude-table-data='*.oban*' \
  flirtual > dump.$(date +%s%3N).sql
```
The dump file will be saved in the current directory.

#### Restoring a database snapshot to a local database

```sh
pg_restore -Fc -C --no-privileges --no-owner \
  -h localhost -p 5432 -U postgres \
  -d postgres dump-<timestamp>.sql

psql -h localhost -p 5432 -U postgres \
  -d postgres <<EOF
select pg_terminate_backend(pid)
from pg_stat_activity
where pid <> pg_backend_pid()
    and datname = 'flirtual';

alter database "flirtual" rename to "flirtual_dev";
EOF
```

### mkcert

As an alternative to `mix phx.gen.cert`, you can use [mkcert](https://github.com/FiloSottile/mkcert) to generate a certificate with a trusted local CA.

```sh
mkcert -install
mkdir priv/cert
mkcert -cert-file priv/cert/selfsigned.pem \
       -key-file priv/cert/selfsigned_key.pem \
       $(hostname) localhost 127.0.0.1 ::1
```
