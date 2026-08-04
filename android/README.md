# TailorNow Android app

A [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity)
(TWA) wrapper around https://tailornow.shop. The APK is a thin native shell: it
renders the existing Next.js PWA fullscreen, with no browser UI, using the
device's Chrome engine. There is no second copy of the app to maintain — ship the
website and the Android app updates with it.

The only reasons to rebuild the APK are a change to the icon, name, launch URL,
or version number.

## Getting an APK

The APK is built by the **Android APK** GitHub Actions workflow, not locally.
Google's Maven repository (which serves `androidx` and the TWA helper library) is
unreachable from the Claude Code sandbox, so the build runs on a GitHub runner
where the Android SDK and those artifacts are available.

1. Actions → **Android APK** → **Run workflow**.
2. When it finishes, download the **tailornow-apk** artifact from the run.
3. Unzip it — `app-debug.apk` is installable on any device with developer
   "install unknown apps" enabled.

To build locally instead, you need the Android SDK and unrestricted network
access, then:

```bash
cd android
./gradlew assembleDebug     # -> app/build/outputs/apk/debug/app-debug.apk
```

## Removing the URL bar (required)

A TWA only runs fullscreen if the website vouches for the APK. Until that link is
established, the app works but shows a thin address bar across the top.

The proof lives in `public/.well-known/assetlinks.json`, which currently holds a
placeholder fingerprint. To complete it:

1. Run the workflow and open the run summary — it prints the SHA-256 fingerprint
   of the certificate that signed each APK.
2. Paste that value into `sha256_cert_fingerprints` in
   `public/.well-known/assetlinks.json`, replacing the placeholder.
3. Deploy the site so the file is live at
   https://tailornow.shop/.well-known/assetlinks.json
4. Reinstall the APK. The bar is gone.

Verify with Google's checker:

```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://tailornow.shop&relation=delegate_permission/common.handle_all_urls
```

Use the **release** fingerprint here. Debug and release builds are signed by
different keys, and the debug key is not stable: Gradle generates a fresh random
`~/.android/debug.keystore` on each CI runner, so a debug APK's fingerprint
changes on every run. Pasting a debug fingerprint pins the URL bar removal to one
throwaway build and silently stops working on the next one.

That means a CI-built debug APK always shows the URL bar. It is still perfectly
usable for testing — the app works, it just is not fullscreen. To get a
fullscreen build, set up release signing below; that key is stable, so its
fingerprint stays valid.

(`sha256_cert_fingerprints` is an array, so several keys can be listed at once —
useful when rotating an upload key, or to add a *locally held* debug keystore
that you reuse rather than regenerate.)

## Play Store release

The workflow builds a signed release APK only when signing secrets exist.
Generate an upload key once and keep it safe — losing it means you cannot ship
updates to an existing listing.

```bash
keytool -genkeypair -v \
  -keystore tailornow-upload.keystore \
  -alias tailornow \
  -keyalg RSA -keysize 2048 -validity 10000
```

Then add these repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 tailornow-upload.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | the store password you chose |
| `ANDROID_KEY_ALIAS` | `tailornow` |
| `ANDROID_KEY_PASSWORD` | the key password you chose |

Never commit the keystore itself; `.gitignore` blocks `*.keystore` and `*.jks`.

Each Play Store upload needs a `versionCode` higher than the last. Pass it as a
workflow input rather than editing `build.gradle`.

## Configuration

| What | Where |
|---|---|
| App name | `app/src/main/res/values/strings.xml` → `app_name` |
| Launch URL / host | same file → `launch_url`, `host_name` |
| Package name | `app/build.gradle` → `applicationId` and `namespace` |
| Theme / splash colours | `app/src/main/res/values/colors.xml` |
| Launcher icon | regenerated from `public/icon-512.png` |

Changing `applicationId` after publishing creates a *different* app in the Play
Store, and requires updating `package_name` in `assetlinks.json`.

The launcher icons and splash image are derived from the PWA icon. To regenerate
after changing `public/icon-512.png`, see the icon sizes in
`app/src/main/res/mipmap-*/` — legacy densities are straight resizes, and
`drawable/ic_launcher_foreground.png` is a 432px adaptive-icon foreground with
the artwork inset to 72% so the system mask does not clip it.
