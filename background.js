/**
 * GeoShift Pro - Background Service Worker
 * Maintains extension state, listens for storage changes,
 * and notifies content scripts of updates.
 */

// Initialize default state on install
chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(null);
  const defaults = {
    latitude: 0,
    longitude: 0,
    accuracy: 10,
    enabled: false,
    showBadge: true,
    darkMode: true,
    presets: [
      { name: "Dubai", latitude: 25.276987, longitude: 55.296249 },
      { name: "London", latitude: 51.507351, longitude: -0.127758 },
      { name: "Islamabad", latitude: 33.693651, longitude: 73.064720 },
      { name: "New York", latitude: 40.712776, longitude: -74.005974 },
      { name: "Tokyo", latitude: 35.689487, longitude: 139.691711 }
    ],
    history: []
  };

  // Only set values that aren't already stored
  const toSet = {};
  for (const [key, value] of Object.entries(defaults)) {
    if (stored[key] === undefined) {
      toSet[key] = value;
    }
  }

  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }

  console.log("[GeoShift Pro] Extension installed and initialized.");
});

// Listen for storage changes and notify all content scripts
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  const relevantKeys = ["latitude", "longitude", "accuracy", "enabled", "showBadge"];
  const hasRelevantChange = relevantKeys.some(key => key in changes);

  if (hasRelevantChange) {
    // Get the current full state and broadcast to all tabs
    chrome.storage.local.get(["latitude", "longitude", "accuracy", "enabled", "showBadge"], (data) => {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: "GEOSHIFT_UPDATE",
              data: {
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: data.accuracy,
                enabled: data.enabled,
                showBadge: data.showBadge
              }
            }).catch(() => {
              // Tab might not have content script loaded
            });
          }
        });
      });
    });
  }
});

// Handle keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-spoofing") {
    const { enabled } = await chrome.storage.local.get("enabled");
    await chrome.storage.local.set({ enabled: !enabled });
    console.log("[GeoShift Pro] Spoofing toggled:", !enabled);
  }

  if (command === "copy-coordinates") {
    const { latitude, longitude } = await chrome.storage.local.get(["latitude", "longitude"]);
    // Send message to the active tab to copy coordinates
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: "GEOSHIFT_COPY",
        data: { latitude, longitude }
      }).catch(() => {});
    }
  }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_STATE") {
    chrome.storage.local.get(["latitude", "longitude", "accuracy", "enabled", "showBadge"], (data) => {
      sendResponse(data);
    });
    return true; // Keep channel open for async response
  }
});