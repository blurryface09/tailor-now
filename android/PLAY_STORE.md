# Play Store submission

Everything Google Play asks for beyond the binary. The `.aab` itself comes from the
**Android APK** workflow (`tailornow-playstore-aab` artifact) once signing secrets
exist — see `README.md`.

## Prerequisites

- A Google Play Console account (one-off registration fee, paid to Google).
- Identity verification, which Google now requires before a first release. This can
  take a few days, so start it early — it is usually the longest wait.
- The release AAB, built and signed.

## Draft listing copy

Reuse the site's own wording so the store and the site agree. Source of truth is
`src/app/layout.tsx` metadata.

**App name** (30 char limit)

```
TailorNow
```

**Short description** (80 char limit)

```
Book Nigerian fashion creatives for custom outfits, alterations and bridal wear.
```

**Full description** (4000 char limit)

```
TailorNow connects you with skilled Nigerian fashion creatives for custom outfits,
alterations, bridal wear, asoebi and more.

Browse verified creatives
See portfolios, ratings and prices before you commit. Filter by state, city and the
kind of work you need — from everyday tailoring to bridal and owambe pieces.

Order with confidence
Agree the price up front, pay securely through Paystack, and track your order from
accepted through to delivery. Contact details unlock once payment is confirmed, which
protects both you and the creative.

Chat directly
Message your creative in the app to share measurements, style references and updates.

Discover styles
A fashion feed of Ankara, alte, street wear, bridal inspiration and trending looks
from creatives across Nigeria.

For fashion creatives
Get discovered by customers near you, show your portfolio, set your own prices, and
receive payouts straight to your bank account.
```

## Assets required

| Asset | Spec | Source |
|---|---|---|
| App icon | 512×512 PNG, 32-bit | `public/icon-512.png` |
| Feature graphic | 1024×500 PNG/JPG, no transparency | **Needs creating** |
| Phone screenshots | 2–8 images, min 320px, 16:9 or 9:16 | **Needs capturing** |

Suggested screenshots, in order — lead with the value, not the sign-up form:
browse listing, a creative's profile with portfolio, the order flow, order tracking,
the fashion feed.

## Forms to complete

- **Privacy policy URL** — use `https://tailornow.shop/privacy`, which already exists.
- **Data safety** — declare what the app collects. The site collects account details
  (name, email, phone), order data including delivery addresses, in-app messages, and
  photos uploaded for orders and portfolios. Payments go to Paystack and card details
  are never stored — say so, since it is a common rejection point when left vague.
- **Content rating** questionnaire.
- **Target audience** — adults; this is a commerce app, not a kids app.
- **App category** — Shopping (Lifestyle is the alternative; Shopping matches the
  ordering and payment flow better).
- **App access** — most content requires an account, so provide Google's reviewers a
  working test login, or the review will be rejected for inaccessible content. This is
  the single most common cause of a failed first submission for apps like this one.

## Policy note

Play's Spam and Minimum Functionality policy rejects thin webview wrappers. A Trusted
Web Activity over a real PWA is the pattern Google documents for exactly this case, so
it is the accepted form — but keep the listing focused on the tailoring service rather
than describing the app as a browser or a website shortcut.

## Before you submit

Confirm the URL bar is gone. If `assetlinks.json` does not list the release signing
fingerprint, the app shows an address bar across the top, which reviewers see too and
which reads as an unfinished webview wrapper. See `README.md`.

## Release checklist

1. Bump `versionCode` (workflow input) — Play rejects a duplicate.
2. Run the workflow, download `tailornow-playstore-aab`.
3. Play Console → Production → Create new release → upload the `.aab`.
4. Roll out. A staged rollout (e.g. 20%) is worth using for a first release.
