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
Windows Subsystem for Linux (WSL) doesn't work nicely with Android Studio, so you'll **have to run all device commands in a Windows terminal**.

* Install [Android Studio](https://developer.android.com/studio).

* Move into the Android project directory with ``cd android``.

* Build the project with ``./gradlew build``.

* Remove existing app, if installed: ``adb uninstall zone.homie.flirtual.pwa``

* Install the development build onto your device: ``adb install app/build/outputs/apk/debug/app-debug.apk``

* Proxy the required services to your device using ``adb reverse tcp:3000 tcp:3000 && adb reverse tcp:4000 tcp:4000``.

* In PowerShell, run `` adb logcat --pid=$(adb shell pidof -s zone.homie.flirtual.pwa)`` to view the client logs.

* Now you can open the app on your device.
