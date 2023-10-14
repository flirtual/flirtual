[![Flirtual](apps/frontend/public/images/brand/gradient.svg)](https://flirtu.al)

[![AGPL-3.0](https://img.shields.io/github/license/flirtual/flirtual?color=663366&label=%C2%A9%202018-2023%20Flirtual&logo=gnu)](LICENSE)
[![Discord](https://img.shields.io/discord/455219574036496404?color=5865f2&label=Discord&logo=discord&logoColor=5865f2&style=flat)](https://discord.gg/flirtual)
[![Twitter](https://img.shields.io/static/v1?color=1da1f2&label=Twitter&message=%40getflirtual&logo=twitter&style=flat)](https://twitter.com/getflirtual)

The first VR dating app.

## Architecture
Flirtual is a monorepo, with the following applications:

* [**Frontend**](/apps/frontend/) - The main service which users interact with, written in TypeScript, served using [Next.js](https://nextjs.org/).

* [**API**](/apps/api/) - The backend service, written in Elixir, served using [Phoenix](https://phoenixframework.org/); Responsible for handling all user data, authentication, and communication between the frontend and other services.

* [**Image Classification**](/apps/image-classification/) - The image classification service, written in TypeScript; AI classification using [TensorFlow](https://www.tensorflow.org).

## Contributing
See the [contribution guide](/.github/CONTRIBUTING.md) for more information.

## License
Copyright (C) 2018-2023 Flirtual

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
[GNU Affero General Public License](/LICENSE) for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
