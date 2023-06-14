# Image classification
This application is a series of models trained for various detection and classification tasks.

## Architecture
The models we use and their purpose is as follows:

### Deep Danbooru
Originally available via [kichangkim/deepdanbooru](https://github.com/kichangkim/deepdanbooru) but now available as a fork via [flirtual/deep-danbooru](https://github.com/flirtual/deep-danbooru), with some changes required to make it easier to use in automation.

This classifier labels images as various tags from [Danbooru (adult content)](https://danbooru.donmai.us/), an anime/hentai image board.

### NSFW.js
Available via [infinitered/nsfwjs](https://github.com/infinitered/nsfwjs).

This classifier is used for generalistic categorization of images, by marking images as neutral, drawing, ect.

## Starting the application
Running the application locally is relatively straight forward.

* To begin, Ensure you've got Docker installed and have ran ``pnpm install``.

* Copy ``.env.example`` to ``.env.local`` and fill in the required values.

* The [API](/apps/api/) must be running, and have images available for classification.

* Finally, run ``pnpm dev`` to run the classification engine.