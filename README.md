[![Flirtual](apps/frontend/public/images/brand/gradient.png)](https://flirtu.al)

[![AGPL-3.0](https://img.shields.io/github/license/flirtual/flirtual?color=663366&label=%C2%A9%202018-2023%20Studio%20Paprika&logo=gnu)](LICENSE)
[![Discord](https://img.shields.io/discord/455219574036496404?color=5865f2&label=Discord&logo=discord&logoColor=5865f2&style=flat)](https://discord.gg/flirtual)
[![Twitter](https://img.shields.io/static/v1?color=1da1f2&label=Twitter&message=%40getflirtual&logo=twitter&style=flat)](https://twitter.com/getflirtual)

The first VR dating app.

## Get started

### API

In `apps/api/`:
* Install [Docker](https://docs.docker.com/get-docker/) and the [asdf version manager](https://asdf-vm.com/guide/getting-started.html).
  * ``asdf plugin-add elixir https://github.com/asdf-vm/asdf-elixir.git``
  * ``asdf plugin add erlang https://github.com/asdf-vm/asdf-erlang.git``
  * Use ``asdf install`` to install Elixir and Erlang.
* Configure the required environment variables.
  * Copy `.env.example` to `.env.local`.
  * Fill in all the required values.
* Set up the project.
  * `. .env.local`
  * `mix setup`.
* Start the server with `./dev.sh`.
* Now you can visit [`127.0.0.1:4000`](http://127.0.0.1:4000) from your browser.

### Frontend

In `apps/frontend/`:
* Install [Node.js](https://github.com/nvm-sh/nvm) and [pnpm](https://pnpm.io/installation).
* Fetch all project dependencies with  `pnpm install`.
* Configure the required environment variables.
  * Copy ``.env.example`` to ``.env.local``.
  * Fill in all the required values.
* Start the server with `pnpm dev`.
* Now you can visit [`127.0.0.1:3000`](http://127.0.0.1:3000) from your browser.

### Stripe/subscription testing

* Install the [Stripe CLI](https://stripe.com/docs/stripe-cli#install) and login using ``stripe login``.
* ``stripe listen --forward-to localhost:4000/v1/stripe``

## Contributing

Contributions are welcome! See [CONTRIBUTING](https://github.com/flirtual/flirtual/blob/main/.github/CONTRIBUTING.md) for more information.

## License

Copyright (C) 2018-2023 Studio Paprika

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
