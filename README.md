# Speaker Timer

A real-time countdown clock for live events. The moderator controls the timer from one device; the speaker sees a large fullscreen countdown on theirs. Works offline too — no moderator or internet required.

## Features

- **Local mode** — set a timer directly on the speaker's device, runs fully offline
- **Connected mode** — moderator and speaker sync in real time via Firebase
- **Overtime counter** — when time runs out, switches to a `+MM:SS` overtime display
- **Moderator messages** — send short cues to the speaker's screen (e.g. "wrap up now")
- **Speaker queue** — pre-load multiple speakers with individual time allocations
- **Live adjustments** — add or subtract 30 sec, 1 min, or 5 min on the fly
- **Color transitions** — green → yellow (5 min) → red (1 min) → pulsing (30 sec)
- **Audio alerts** — beeps at the 5-minute and 1-minute warnings
- **Fullscreen** — one tap from the hover controls on the speaker view

## Getting Started

### Local mode (no Firebase needed)

1. Open `index.html` in a browser
2. Click **Local Timer**
3. Set your time and hit **Start**

### Connected mode (moderator + speaker)

#### 1. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project
2. Add a **Realtime Database** and set the rules to **test mode**
3. In **Project Settings → Your apps**, register a Web app (click the `</>` icon)
4. Copy the `firebaseConfig` object Firebase provides

#### 2. Configure the app

```bash
cp app.config.example.js app.config.js
```

Open `app.config.js` and paste in your Firebase config values:

```js
const FIREBASE_CONFIG = {
  apiKey:            "...",
  authDomain:        "...",
  databaseURL:       "https://your-project-default-rtdb.firebaseio.com",
  projectId:         "...",
  storageBucket:     "...",
  messagingSenderId: "...",
  appId:             "..."
};
```

> **Note:** `databaseURL` is sometimes missing from the Firebase snippet. Find it in **Realtime Database → Data** — it looks like `https://your-project-default-rtdb.firebaseio.com`.

#### 3. Run the event

1. Open `moderator.html` — a session code is generated automatically and saved across refreshes
2. On the speaker's device, open `index.html` → **Join as Speaker** → enter the code
3. Set the duration, add speakers to the queue if needed, and hit **Start** when they begin talking

## Files

| File | Purpose |
|------|---------|
| `index.html` | Landing page — choose Local Timer, Join as Speaker, or Moderator |
| `speaker.html` | Speaker's fullscreen countdown display |
| `moderator.html` | Moderator dashboard — controls, queue, messaging |
| `app.js` | Shared Firebase logic, timer math, audio alerts |
| `app.config.js` | Your Firebase credentials (**gitignored — do not commit**) |
| `app.config.example.js` | Safe template to copy for setup |
| `style.css` | All styles |

## Notes

- Firebase Realtime Database in **test mode** expires its open rules after 30 days. Update the rules in the Firebase console before they expire.
- Old sessions accumulate in the database harmlessly. Clear them anytime under **Realtime Database → Data**.
- The app works by opening the HTML files directly in a browser (`file://`) — no web server required.
- iOS Safari does not support the Fullscreen API. Use **Add to Home Screen** for a fullscreen experience on iPhone/iPad.
