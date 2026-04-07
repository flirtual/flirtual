# Flirtual API

## Get started
* Install build dependencies:

  ```sh
  # Debian/Ubuntu
  sudo apt install build-essential cmake

  # Fedora
  sudo dnf install gcc gcc-c++ make cmake

  # Arch
  sudo pacman -S base-devel cmake

  # macOS
  xcode-select --install
  brew install cmake
  ```

* Install [Docker](https://docs.docker.com/get-docker/) or [Apple Container](https://github.com/apple/container) (macOS 26+), and the [asdf version manager](https://asdf-vm.com/guide/getting-started.html).

  * `asdf plugin add elixir https://github.com/asdf-vm/asdf-elixir.git`

  * `asdf plugin add erlang https://github.com/asdf-vm/asdf-erlang.git`

  * Run `asdf install` to install Elixir and Erlang.

* Configure the required environment variables.

  * Copy the example environment: `cp .env.example .env.local`

  * Fill in the values in .env.local.

* Set up the project.

  * Source the environment: `source .env.local`.

  * Start postgres:

    * Docker: `docker compose up -d postgres`
    * Apple Container: `container run --detach --name postgres --publish 5432:5432 -e POSTGRES_PASSWORD=postgres -e PGDATA=/var/lib/postgresql/data/pgdata -v pgdata:/var/lib/postgresql/data postgres:17-alpine postgres -N 500`

  * Run `mix setup` to install dependencies, create the database, and run migrations.

  * Run `mix phx.gen.cert` to generate a self-signed TLS certificate.

* Start the server with `./dev.sh`.

* The API is now listening on port 4000 (http) and 4001 (https).

### mkcert

As an alternative to `mix phx.gen.cert`, you can use [mkcert](https://github.com/FiloSottile/mkcert) to generate a certificate with a trusted local CA.

```sh
mkcert -install
mkcert -cert-file priv/cert/selfsigned.pem \
       -key-file priv/cert/selfsigned_key.pem \
       $(hostname) localhost 127.0.0.1 ::1
```
