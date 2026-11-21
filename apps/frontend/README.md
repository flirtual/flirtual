# Flirtual Frontend

## Get started
* Install [Node.js](https://github.com/nvm-sh/nvm) and [pnpm](https://pnpm.io/installation).

* Fetch all project dependencies with  `pnpm install`.

* Configure the required environment variables.

  * Copy the example environment: `cp .env.example .env.local`

  * Fill in the values in .env.local.

* Start the server with `pnpm dev`.

* The frontend is now being served on port 3000.

### portless

[portless](https://portless.sh) serves the frontend at `https://<checkout>.localhost` and the API
at `https://api.<checkout>.localhost`, with no ports and no certificates to make.
`shims/portless` names them after the repository's directory, so a fork's checkout gets
its own names, and in a git worktree adds the branch as a label, as in
`https://fix-ui.flirtual.localhost`, so several worktrees run side by side.

* Start the frontend with `pnpm dev:portless`.

* Start the API from `apps/api` with `./dev.sh --portless`.

* Leave `VITE_ORIGIN` and `VITE_API_URL` unset: the frontend reads its own URL from portless and
  puts the API one `api.` label below it.

The proxy binds port 443, and its first start adds portless's certificate authority to the
system trust store (under WSL, Windows's too), so starting it asks for `sudo`.

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

### iOS app

* Install [Xcode](https://developer.apple.com/xcode/) with iOS platform support.

* Source the environment: `source .env.local`.

* Sync Capacitor: `pnpm cap sync`.

* Build and run the app: `pnpm cap run ios`.

* You can view the client logs with `xcrun simctl spawn booted log stream --predicate 'process == "Flirtual"'` (simulator) or `idevicesyslog --process Flirtual` (physical device).

### Android app
Tip: Windows Subsystem for Linux (WSL) doesn't work nicely with Android Studio, so you'll have to run all device commands in a Windows terminal.

* Install [Android Studio](https://developer.android.com/studio).

* Set `JAVA_HOME` (e.g. to `/opt/android-studio/jbr`, `$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr`, `/Applications/Android Studio.app/Contents/jbr/Contents/Home`, or your JDK of choice).

* Source the environment: `source .env.local`.

* Sync Capacitor: `pnpm cap sync`.

* Build and run the app: `pnpm cap run android`.

* You can view the client logs with `adb logcat --pid=$(adb shell pidof -s $VITE_APP_BUNDLE_ID)`.
