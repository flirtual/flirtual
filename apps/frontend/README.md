# Flirtual Frontend

## Get started
* Install [Node.js](https://github.com/nvm-sh/nvm) and [pnpm](https://pnpm.io/installation).

* Fetch all project dependencies with  `pnpm install`.

* Configure the required environment variables.

  * Copy the example environment: `cp .env.example .env.local`

  * Fill in the values in .env.local.

* Start the server with `pnpm dev`.

* The frontend is now being served on port 3000.

### mkcert

You can use [mkcert](https://github.com/FiloSottile/mkcert) to generate a certificate with a trusted local CA.

```sh
mkcert -install
mkcert -cert-file certificates/localhost.pem \
       -key-file certificates/localhost-key.pem \
       $(hostname) localhost 127.0.0.1 ::1
```

To trust the CA on iOS/iPadOS/visionOS:

1. `open "$(mkcert -CAROOT)"`
2. Transfer rootCA.pem to your device (e.g. Share > AirDrop or Simulator).
3. In the Settings app on your device, navigate to Profile Downloaded > Install.
4. Navigate to General > About > Certificate Trust Settings, and select the mkcert certificate under Enable Full Trust for Root certificates.

To trust the CA on Android:

1. `open "$(mkcert -CAROOT)"`
2. Transfer rootCA.pem to your device.
3. In the Settings app on your device, navigate to Security & Privacy > More security & privacy > Encryption & credentials > Install a certificate > CA certificate, and select the file.

### Android app
Tip: Windows Subsystem for Linux (WSL) doesn't work nicely with Android Studio, so you'll have to run all device commands in a Windows terminal.

* Install [Android Studio](https://developer.android.com/studio).

* Set `JAVA_HOME` (e.g. to `/opt/android-studio/jbr`, `$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr`, `/Applications/Android Studio.app/Contents/jbr/Contents/Home`, or your JDK of choice).

* Source the environment: `source .env.local`.

* Sync Capacitor: `pnpm cap sync`.

* Build and run the app: `pnpm cap run android`.

* You can view the client logs with `adb logcat --pid=$(adb shell pidof -s zone.homie.flirtual.pwa)`.

### iOS app

* Install [Xcode](https://developer.apple.com/xcode/) with iOS platform support, and `brew install cocoapods`.

* Source the environment: `source .env.local`.

* Sync Capacitor: `pnpm cap sync`.

* Build and run the app: `pnpm cap run ios`.

* You can view the client logs with `xcrun simctl spawn booted log stream --predicate 'process == "Flirtual"'` (simulator) or `idevicesyslog --process Flirtual` (physical device).
