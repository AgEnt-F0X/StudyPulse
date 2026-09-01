# StudyPulse Browser Extension

Quick-access Chrome extension for the [StudyPulse AI Study Companion](https://studypulse.app).

## Features

- **Pomodoro timer** — start focus sessions directly from your browser toolbar
- **Quick add** — add assignments without opening the full app
- **Upcoming assignments** — see your next 6 due tasks at a glance
- **Google Classroom import** — visit classroom.google.com and click "Import to StudyPulse"
- **Due-date notifications** — get notified when assignments are due tomorrow

## Install (Developer Mode)

1. Clone this repo or [download the ZIP](https://github.com/kaorii-ako/StudyPulse/archive/refs/heads/master.zip)
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select the `extension/` folder
5. Pin the StudyPulse icon to your toolbar

> Firefox support coming soon — see [issue #TODO](https://github.com/kaorii-ako/StudyPulse/issues)

## How it works

The extension stores assignments in `chrome.storage.local` using the same key format as the StudyPulse web app (`studypulse-assignments`). Data is local — nothing is sent to any server.

## Development

```
extension/
├── manifest.json          # Manifest V3
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic (timer, assignments, quick-add)
├── background.js          # Service worker (alarms, notifications)
├── content-classroom.js   # Google Classroom import button
└── icons/                 # 16/32/48/128px icons
```

To add icons, place PNG files at `extension/icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`.
