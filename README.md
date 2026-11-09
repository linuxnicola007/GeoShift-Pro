# GeoShift Pro

**A Chrome/Edge/Brave extension that lets you set the location your browser reports to websites.**

GeoShift Pro overrides the browser's Geolocation API (`navigator.geolocation`) with coordinates you choose. It is useful for **testing location-based web features**, checking how a site behaves in another city, and **keeping your real GPS position private** from sites that ask for it.

> **Important:** GeoShift Pro changes only what the browser's location API returns. It is **not a VPN** and does **not** change your IP address, time zone or language. Sites that use IP-based location will still see your real region.

---

## Features

- Enter **latitude, longitude and accuracy** by hand, then switch spoofing on or off with one click
- **Presets**: Dubai, London, Islamabad, New York, Tokyo, plus your own saved locations
- **City search** using OpenStreetMap Nominatim (needs internet)
- **Recent history** (last 20 locations)
- **Export / import** settings and presets as JSON
- **Random nearby** coordinate generator (choose a radius)
- **DMS ↔ decimal** converter
- Floating on-page **badge** showing the active fake location
- Dark and light theme
- Keyboard shortcuts: `Alt+Shift+G` toggle spoofing, `Alt+Shift+C` copy coordinates
- Open the current coordinates in a map
- Overrides `getCurrentPosition`, `watchPosition` and the geolocation permission query, so sites do not see a mismatch

## Install (developer mode)

1. Download or clone this repository.
2. Open `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the folder that contains `manifest.json`.
5. Pin the GeoShift Pro icon to the toolbar.

```bash
git clone https://github.com/linuxnicola007/GeoShift-Pro.git
```

## Use

1. Click the toolbar icon.
2. Enter the latitude, longitude and accuracy (or pick a preset, or search for a city).
3. Click **Enable Spoofing**.
4. **Refresh the page** you want to test. The site now receives the fake location.
5. Click **Disable Spoofing** to go back to your real location.

## Privacy

- All settings, presets and history are stored **only in your browser** (`chrome.storage.local`). Nothing is sent to the developer or any analytics service.
- The only network request the extension makes is the optional **city search**, which sends your search text to `nominatim.openstreetmap.org`. If you never use city search, the extension makes no network requests.
- There are no accounts, no trackers and no remote code.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Save coordinates, presets and settings on your device |
| `scripting` | Inject the geolocation override into pages |
| `activeTab` | Work with the tab you are looking at |
| `tabs` | Tell open tabs when you change or toggle the location |
| `<all_urls>` (host access) | The override must run on every site that may ask for location |

## Limits

| Situation | What to expect |
|---|---|
| Site still shows the real place | Refresh the page after enabling. If it still does, it probably uses your **IP address** |
| Time zone, language or Wi-Fi based location | Not changed by this extension |
| Very strict sites | Some sites detect overrides or combine several signals. This tool gives no guarantee |
| City search does not work offline | It needs the internet. Everything else works offline |

## Responsible use

Use GeoShift Pro to test your own work and protect your own privacy. Do not use it to break a website's or service's terms, to get around legal or licensing restrictions, or to deceive other people. You are responsible for how you use it.

## Project structure

```
GeoShift-Pro/
├── manifest.json   Extension manifest (Manifest V3)
├── popup.html      Popup interface
├── popup.css       Popup styles
├── popup.js        Popup logic
├── background.js   Service worker (shortcuts, sync)
├── inject.js       Runs in the page, replaces navigator.geolocation
├── content.js      Syncs settings to the page, draws the badge
├── utils.js        Shared helpers
└── icons/          Toolbar icons (16, 32, 48, 128 px)
```

## Compatibility

Chrome, Microsoft Edge and Brave (Chromium, Manifest V3).

## License

MIT. See [LICENSE](LICENSE).
