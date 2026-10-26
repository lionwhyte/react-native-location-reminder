# LocationReminder

A location-based reminder app built with React Native and Expo. Drop a pin on a map, set a radius, attach a to-do, and the app notifies you when you physically arrive there. It works in the background, even when the app is closed and the phone is locked.

> Built for personal use. Tested on Android; iOS support is configured but untested.

## Features

- Add reminders by long-pressing anywhere on a Google Map
- Configurable trigger radius per reminder (100 m to 1 km)
- Notifications fire on entering the radius, with the app in the foreground, background, or fully closed
- Reminder list with on/off toggle, delete (with confirmation), and tap-to-jump-to-map
- Inactive reminders are shown greyed out on the map
- Reminders and geofences persist across app restarts and are re-registered on launch
- Built-in geofence debug log for verifying background behaviour on a real device

## Tech stack

| Area | Library |
|---|---|
| Framework | React Native 0.88, React 19, Expo SDK 58 |
| Language | TypeScript |
| Map | `react-native-maps` (Google Maps provider) |
| Geofencing | `expo-location` + `expo-task-manager` |
| Notifications | `expo-notifications` |
| Storage | `@react-native-async-storage/async-storage` |
| Layout | `react-native-safe-area-context` |
| Builds | EAS Build (development client + preview APK) |

## How it works

1. Each reminder (title, note, coordinates, radius, active flag) is stored in AsyncStorage.
2. Every change to the reminder list calls `syncGeofences()`, which registers all active reminders as native geofence regions with `Location.startGeofencingAsync`. Android uses the Google Play services Geofencing API, so no persistent foreground service is needed.
3. When the OS detects that the device entered a region, it wakes the app headlessly and runs a task defined with `TaskManager.defineTask`. The task reads the reminder from AsyncStorage (React state does not exist in the background) and schedules a local notification.
4. Geofences are re-registered every time the app opens, because Android can drop them after a reboot or an app update.

The task must be defined at module scope and imported first in `index.ts`, otherwise it is not registered when the OS launches the app in the background.

## Project structure

```
.
├── index.ts                    # Entry point; imports geofenceService first
├── App.tsx                     # Map / List tabs, permissions, notification channel
├── app.json                    # Expo config (plugins, permissions)
├── app.config.js               # Injects the Google Maps key from the environment
├── eas.json                    # EAS build profiles
├── components/
│   ├── ReminderModal.tsx       # Create-reminder bottom sheet
│   ├── ReminderList.tsx        # List with toggle and delete
│   └── DebugLog.tsx            # In-app geofence log viewer
├── hooks/
│   └── useReminders.ts         # Reminder state, persistence, geofence sync
└── services/
    └── geofenceService.ts      # Geofence task, permissions, logging
```

## Getting started

### Prerequisites

- Node.js (current LTS) and npm
- An [Expo](https://expo.dev) account and the EAS CLI: `npm install -g eas-cli`
- A Google Maps API key with **Maps SDK for Android** (and **Maps SDK for iOS**, if you target iOS) enabled
- An Android phone for testing (an emulator cannot reproduce real background behaviour)

### 1. Install

```bash
git clone <your-repo-url>
cd LocationReminder
npm install
```

### 2. Configure the Maps key

The key is kept out of the repository. Create a `.env` file in the project root:

```
GOOGLE_MAPS_API_KEY=your_key_here
```

`.env` is listed in `.gitignore`. `app.config.js` reads the key at build time and injects it into the iOS and Android configuration.

For cloud builds, add the same variable to your EAS project (for the `development`, `preview`, and `production` environments) on the expo.dev dashboard or with the EAS CLI. The profiles in `eas.json` reference these environments.

Because the key is embedded in the app binary, restrict it in Google Cloud Console (Application restrictions: Android apps, with your package name and signing SHA-1; API restrictions: Maps SDK only).

### 3. Set your own app identifiers

In `app.json`, replace the placeholder `com.yourname.locationreminder` for both `ios.bundleIdentifier` and `android.package` with your own, and set your own EAS `projectId` (`eas init`).

### 4. Build a development client

Geofencing, maps, and notifications use native code, so Expo Go cannot run this project.

```bash
eas build --profile development --platform android
```

Install the resulting APK on your phone, then:

```bash
npx expo start --dev-client
```

Phone and computer must be on the same network (or use `--tunnel`). Rebuild the client whenever you change `app.json` or add a package with native code. JS and TS changes hot reload.

## Testing background geofencing

Background behaviour cannot be tested with a development build, because the JavaScript is loaded from Metro and is unavailable when the app is closed. Use a standalone preview build:

```bash
eas build --profile preview --platform android
```

Then:

1. Grant location permission, choose **Allow all the time**, and allow notifications.
2. Set battery usage for the app to **Unrestricted** (on Samsung, also add it to "Never sleeping apps").
3. Create a reminder roughly 300 to 500 m away with a radius of 100 to 200 m.
4. Swipe the app away from recent apps, lock the phone, and walk to the location. Allow up to a couple of minutes after entering the radius.
5. Open the app, **long-press the List tab** to open the debug log, and check for `event ENTER` and `obavijest poslana` (notification sent) entries.

A fake-GPS app is handy for quick logic checks, but always finish with a real walk, since battery optimisation behaves differently in the real world.

## Known limitations and notes

- **Not instant.** Android geofencing can take a minute or two to report an entry, and moving speeds it up.
- **Region limits.** iOS monitors at most 20 regions per app; Android allows 100.
- **Minimum radius.** Keep radii at 100 m or more; smaller geofences are unreliable.
- **Immediate trigger when already inside.** Registering a geofence while you are already inside it can fire an entry event right away. Test with a location you are not at.
- **Aggressive battery managers** (Samsung, Xiaomi, Huawei, and others) can stop background work. Set the app to unrestricted.
- **R8 minification is disabled for release builds** (`expo-build-properties` in `app.json`). With it enabled, the release build crashed at launch because R8 broke the WorkManager database class used by a native dependency.
- After an OS reboot, open the app once so geofences are re-registered.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Map is blank or grey | Maps key missing from the build, or key restrictions do not match the package name and SHA-1 |
| App closes immediately after install (release build) | Read the crash with `adb logcat -b crash -d` |
| Notification works in foreground only | Location permission is not "Allow all the time", or battery usage is restricted |
| No `event ENTER` in the log | The OS never woke the app: check permissions, battery, location services, and Google Play services |
| `event ENTER` logged but no notification | Notification permission or channel problem |
| Native module error in a dev build (for example a missing view manager) | The dev client was built before the package was added; rebuild it |

## Roadmap

- [ ] Edit existing reminders
- [ ] Notify on exit as well as on entry
- [ ] Search for an address instead of long-pressing the map
- [ ] Dark mode
- [ ] Verify and polish the iOS build

## License

Add a license of your choice (for example MIT) before publishing.