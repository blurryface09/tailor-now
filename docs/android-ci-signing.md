# Getting a signed, Play Store–ready build out of CI

`.github/workflows/android-build.yml` always builds a **debug APK** on every
push to `main` (and on manual "Run workflow") — no setup needed, download it
from the run's Artifacts tab and install it on a device to test.

It only builds a **signed release `.aab`** (the file Play Console actually
accepts) once these four repo secrets exist. Without them, that step and its
artifact are silently skipped — nothing breaks.

## One-time: generate a keystore

Do this once, anywhere with a JDK installed (does not need to be the
machine you build from):

```bash
keytool -genkey -v -keystore release.keystore -alias tailornow \
  -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for a keystore password and a key password — remember
both. **Back up `release.keystore` somewhere safe** (password manager,
private cloud storage). If you lose it, you can never publish an update to
the same Play Store listing again — you'd have to create a new app.

## Add the secrets

Repo → Settings → Secrets and variables → Actions → New repository secret.
Add all four:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -i release.keystore \| pbcopy` (or equivalent) — the whole base64 string |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password you chose above |
| `ANDROID_KEY_ALIAS` | `tailornow` (or whatever `-alias` you used) |
| `ANDROID_KEY_PASSWORD` | the key password you chose above |

## After that

Every push to `main` that touches `android/`, `capacitor.config.ts`, or
`public/` produces a `tailornow-release-aab` artifact — download it and
upload straight to Google Play Console. No Android Studio required.
