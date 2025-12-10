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

### mkcert

You can use [mkcert](https://github.com/FiloSottile/mkcert) to generate a certificate with a trusted local CA.

```sh
mkcert -install
mkdir certificates
mkcert -cert-file certificates/localhost.pem \
       -key-file certificates/localhost-key.pem \
       $(hostname) localhost 127.0.0.1 ::1
```

To trust the CA on iOS/iPadOS/visionOS:

1. `open "$(mkcert -CAROOT)"`
2. AirDrop or otherwise transfer rootCA.pem to your device.
3. In the Settings app on your device, navigate to Profile Downloaded > Install.
4. Navigate to General > About > Certificate Trust Settings, and select the mkcert certificate under Enable Full Trust for Root certificates.

To trust the CA on Android:

1. `open "$(mkcert -CAROOT)"`
2. Transfer rootCA.pem to your device.
3. In the Settings app on your device, navigate to Security & Privacy > More security & privacy > Encryption & credentials > Install a certificate > CA certificate, and select the file.
