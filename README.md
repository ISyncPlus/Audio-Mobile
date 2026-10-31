# AudioBlocks Mobile

A native iOS and Android version of the existing AudioBlocks web app, built with React Native and Expo SDK 55. Uses the same Express API, Privy identity, Circle wallets, USDC pool, and Room tickets. The original web app remains in `Audio-Frontend`.

The iOS app targets iOS 16 or newer. The local simulator Release build was compiled successfully with Xcode 27. TypeScript, 17 focused tests, dependency-version checks and iOS/Android/web bundle exports passed. Public navigation and the phone layout were checked in the browser. Live authentication, payments, streaming against a configured backend, Android native compilation, and physical-device behavior still need verification after filling the environment values.

## Run locally

Use Node 22.18+ (Node 24 recommended).

```sh
cd Audio-Mobile
npm ci
cp .env.example .env
```

Set the three public environment variables in `.env`:

- `EXPO_PUBLIC_API_URL`: backend origin, without `/api`. iOS Simulator can use `http://localhost:4000`; Android Emulator uses `http://10.0.2.2:4000`. On a physical phone, use the computer's LAN IP, with both devices on the same network. Production uses HTTPS.
- `EXPO_PUBLIC_PRIVY_APP_ID`: the same app ID as the web app and backend.
- `EXPO_PUBLIC_PRIVY_CLIENT_ID`: a **mobile app client** from that app's Privy dashboard. Configure `com.audioblocks.mobile` for iOS and Android, the `audioblocks` scheme, and enable email and Google login.

No backend secrets, Circle credentials, or payment-provider keys belong in this app. Privy's SDK persists sessions in SecureStore. Protected requests obtain a fresh access token from the SDK.

HTTP is supported for local development builds. Release builds require an HTTPS API URL before transmitting an account token. Native configuration applies the local HTTP exception automatically when the API URL starts with `http://`; rebuild after changing it. Local paths containing spaces use React Native source builds to avoid its prebuilt CocoaPods URL issue, so the first iOS build is slower.

Start the existing backend using its README. Deploy the new `/api/song/playback/:id` endpoint and `/api/song/stream/:id/master.m3u8` alias with it. The playback endpoint checks the account's Room access and returns a scoped playback link; native players use this link without forwarding account tokens to signed S3 segments. Links for unreleased tracks expire after one hour and are checked against the Room's current access window on every manifest request. Existing web stream URLs and bearer authentication still work. The `.m3u8` extension lets native players recognize HLS. `PUBLIC_API_URL` on the backend must be reachable from the phone.

```sh
npm run ios       # Xcode and CocoaPods required
npm run android   # Android SDK / emulator required
npm start         # Metro for an already installed development build
```

Privy requires an Expo **development build**, rather than Expo Go. Browser preview is available with `npm run web`; it browses public data and shows the native screen layouts, but account sign-in is native only. Browser HLS support varies; use iOS or Android to validate playback.

For cloud development builds, use `eas build --profile development --platform ios` or `--platform android` after configuring your own Expo account and signing credentials. Identifiers above are initial defaults; change them before publishing if your organization uses different IDs. This repository does not create or submit any store release.

## Included

| Web flow                | Native flow                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Landing / Collective    | About screen with original hero artwork and platform explanation                      |
| Explore                 | Search, mood matching, genre filters, tracks, artist profiles                         |
| Persistent music player | Mini player, full player, seeking, queue, background audio and lock-screen metadata   |
| My Playlist             | Released songs liked by the current account, using the existing likes API             |
| Marketplace / Rooms     | Browse, access windows, USDC/card/Naira purchases, verified ticket access and reviews |
| Community               | Voting, pool deposits, current standings, previous round results                      |
| Profile                 | Live wallet balance, copy address, artist promotion, sign-out                         |
| Artist Hub              | Uploads, hidden unreleased tracks, Room creation, insights and AI generation          |
| Collaborations          | Multiple artist invitations, share validation, accept/decline and track attachment    |
| Edit artist profile     | Name, bio, Instagram, profile image and page cover                                    |
| Admin                   | Open rounds; review, close and trigger payouts                                        |

Black/charcoal surfaces, pink/purple accents and artwork come from the web app. Desktop sidebar navigation becomes five bottom tabs. All actions use the backend's existing role checks. Uploads send 1MB chunks and remove temporary chunk files on the device after sending. There is no second backend or on-device transaction signing.

## Checks

```sh
npm test
npm run typecheck
npx expo install --check
npx expo export --platform all
```

Tests cover API authentication, backend error reporting, multipart boundaries, timeouts, song filtering, decimal payment input, queue boundaries and upload chunks.

## Current limits / device validation

- The web app's events, merch, public album collections and metrics navigation contain demo content or empty links. The mobile app does not invent backend support for them. The playlist uses real likes rather than the web page's hardcoded “1000 Songs Added.”
- Email and Google login are provided. External-wallet-only accounts need an additional wallet login integration before they can sign in on mobile.
- Hosted Stripe/Paystack checkout uses the existing web return URLs. Close checkout and tap **Check payment status** in the app; access is granted only after the backend confirms success. Pending checkout IDs are saved per account and Room in SecureStore, so reopening the payment screen restores the checkout. Never retry an uncertain wallet payment before checking your balance and the server transaction record.
- Selected upload files are retained on the screen after failure, but upload sessions do not resume across an app restart. A failed finalize response can be ambiguous; check Artist Hub before resubmitting.
- Before release, test on physical iOS and Android devices: Privy email/Google login and restoration, authenticated HLS and Room streams, phone/ Bluetooth interruptions, background playback, uploads, checkout cancellation/pending/success, and role changes. No live financial transactions are run by the test suite.

Implementation follows [Expo audio documentation](https://docs.expo.dev/versions/v55.0.0/sdk/audio/) and [Privy React Native setup](https://docs.privy.io/basics/react-native/setup).
