[![Flirtual](https://flirtu.al/img/logo-new.svg?v=0)](https://flirtu.al)

[![AGPL-3.0](https://img.shields.io/github/license/flirtual/flirtual?color=663366&label=%C2%A9%202018-2022%20Studio%20Paprika&logo=gnu)](LICENSE)
[![Discord](https://img.shields.io/discord/455219574036496404?color=5865f2&label=Discord&logo=discord&logoColor=5865f2&style=flat)](https://flirtu.al/discord)
[![Twitter](https://img.shields.io/twitter/follow/getflirtual?color=1da1f2&label=Twitter&logo=twitter&logoColor=1da1f2&style=flat)](https://twitter.com/getflirtual)

That VR dating app.

Get started
-----------

* Install [Docker](https://docs.docker.com/get-docker/), and the [asdf version manager](https://asdf-vm.com/guide/getting-started.html).
  * Use ``asdf install`` to install Elixir and Erlang.
* Setup the project with `mix setup`.
* Configure local development secrets.
  * Copy `.env.local.example` into `.env.local`.
  * Fill in all the required secrets. 
* Start development server with `./dev.sh`.
* Now you can visit [`127.0.0.1:4000`](http://127.0.0.1:4000) from your browser.
