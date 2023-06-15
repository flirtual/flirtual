# flirtu.al

## Contribution
* Install [Node.js](https://github.com/nvm-sh/nvm) and [pnpm](https://pnpm.io/installation).

* Fetch all project dependencies with  `pnpm install`.

* Configure the required environment variables.

  * Copy ``.env.example`` to ``.env.local``.

  * Fill in all the required values.

* Start the server with `pnpm dev`.

* Now you can visit [`127.0.0.1:3000`](http://127.0.0.1:3000) from your browser.

### Building for Android
* Install [Android Studio](https://developer.android.com/studio).

* Move into the Android project directory with ``cd android``.

* Build the project with ``./gradlew build``.

* Remove existing app, if installed: ``adb uninstall zone.homie.flirtual.pwa``

* Install the development build onto your device: ``adb install app/build/outputs/apk/debug/app-debug.apk``