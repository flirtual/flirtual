# api.flirtu.al

## Contribution
### Initial installation and setup.
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

### Stripe/subscription testing.

* Install the [Stripe CLI](https://stripe.com/docs/stripe-cli#install) and login using ``stripe login``.

* Configure the required environment variables.

* Restart the server.

* ``stripe listen --forward-to localhost:4001/v1/stripe``
