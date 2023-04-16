[![Flirtual](https://flirtu.al/img/logo-new.svg?v=0)](https://flirtu.al)

[![AGPL-3.0](https://img.shields.io/github/license/flirtual/flirtual?color=663366&label=%C2%A9%202018-2023%20Studio%20Paprika&logo=gnu)](LICENSE)
[![Discord](https://img.shields.io/discord/455219574036496404?color=5865f2&label=Discord&logo=discord&logoColor=5865f2&style=flat)](https://flirtu.al/discord)
[![Twitter](https://img.shields.io/static/v1?color=1da1f2&label=Twitter&message=%40getflirtual&logo=twitter&style=flat)](https://twitter.com/getflirtual)

The first VR dating app.

Get started
-----------

* Install [Docker](https://docs.docker.com/get-docker/), and the [asdf version manager](https://asdf-vm.com/guide/getting-started.html).
  * ``asdf plugin-add elixir https://github.com/asdf-vm/asdf-elixir.git``
  * ``asdf plugin add erlang https://github.com/asdf-vm/asdf-erlang.git``
  * Use ``asdf install`` to install Elixir and Erlang.
* Configure local development secrets.
  * Copy `.env.local.example` into `.env.local`.
  * Fill in all the required secrets. 
* Setup the project 
  * `. ./env.local`
  * `mix setup`.
* Start development server with `./dev.sh`.
* Now you can visit [`127.0.0.1:4000`](http://127.0.0.1:4000) from your browser.
