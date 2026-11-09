/**
 * GeoShift Pro - Popup Script
 * Handles all popup UI interactions, storage, and API calls.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const latInput = document.getElementById("latitude");
  const lonInput = document.getElementById("longitude");
  const accInput = document.getElementById("accuracy");
  const statusBar = document.getElementById("status-bar");
  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");
  const infoLat = document.getElementById("info-lat");
  const infoLon = document.getElementById("info-lon");
  const infoAcc = document.getElementById("info-acc");
  const infoDms = document.getElementById("info-dms");
  const presetsList = document.getElementById("presets-list");
  const historyList = document.getElementById("history-list");
  const searchResults = document.getElementById("search-results");
  const citySearch = document.getElementById("city-search");
  const dmsInput = document.getElementById("dms-input");
  const dmsResult = document.getElementById("dms-result");
  const randomRadius = document.getElementById("random-radius");
  const presetName = document.getElementById("preset-name");
  const toggleBadge = document.getElementById("toggle-badge");
  const toggleDark = document.getElementById("toggle-dark");
  const importFile = document.getElementById("import-file");
  const importPresetsFile = document.getElementById("import-presets-file");

  // ===================== TOAST =====================
  function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ===================== TABS =====================
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
    });
  });

  // ===================== LOAD STATE =====================
  function loadState() {
    chrome.storage.local.get(null, (data) => {
      if (data.latitude !== undefined) latInput.value = data.latitude;
      if (data.longitude !== undefined) lonInput.value = data.longitude;
      if (data.accuracy !== undefined) accInput.value = data.accuracy;

      updateStatusUI(data.enabled || false);
      updateInfoDisplay(data.latitude || 0, data.longitude || 0, data.accuracy || 10);

      // Settings
      if (data.showBadge !== undefined) toggleBadge.checked = data.showBadge;
      if (data.darkMode !== undefined) {
        toggleDark.checked = data.darkMode;
        applyTheme(data.darkMode);
      }

      renderPresets(data.presets || []);
      renderHistory(data.history || []);
    });
  }

  function updateStatusUI(enabled) {
    if (enabled) {
      statusBar.className = "status-bar status-on";
      statusText.textContent = "Spoofing ON";
    } else {
      statusBar.className = "status-bar status-off";
      statusText.textContent = "Spoofing OFF";
    }
  }

  function updateInfoDisplay(lat, lon, acc) {
    infoLat.textContent = parseFloat(lat).toFixed(6);
    infoLon.textContent = parseFloat(lon).toFixed(6);
    infoAcc.textContent = acc + "m";

    const latDms = GeoUtils.decimalToDMS(parseFloat(lat), true);
    const lonDms = GeoUtils.decimalToDMS(parseFloat(lon), false);
    infoDms.textContent = latDms + "  " + lonDms;
  }

  function applyTheme(isDark) {
    document.body.classList.toggle("light-mode", !isDark);
    document.getElementById("theme-toggle").textContent = isDark ? "🌙" : "☀️";
  }

  // ===================== VALIDATION =====================
  function getAndValidate() {
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    const acc = parseFloat(accInput.value) || 10;
    const result = GeoUtils.validateCoordinates(lat, lon, acc);
    if (!result.valid) {
      result.errors.forEach(e => showToast(e, "error"));
      return null;
    }
    return { latitude: lat, longitude: lon, accuracy: acc };
  }

  // ===================== HISTORY =====================
  function addToHistory(lat, lon) {
    chrome.storage.local.get("history", (data) => {
      let history = data.history || [];
      // Don't duplicate the last entry
      if (history.length > 0 && history[0].latitude === lat && history[0].longitude === lon) return;
      history.unshift({
        latitude: lat,
        longitude: lon,
        timestamp: new Date().toISOString()
      });
      // Keep last 20
      history = history.slice(0, 20);
      chrome.storage.local.set({ history }, () => renderHistory(history));
    });
  }

  // ===================== BUTTON HANDLERS =====================

  // Save Location
  document.getElementById("btn-save").addEventListener("click", () => {
    const coords = getAndValidate();
    if (!coords) return;
    chrome.storage.local.set(coords, () => {
      updateInfoDisplay(coords.latitude, coords.longitude, coords.accuracy);
      addToHistory(coords.latitude, coords.longitude);
      showToast("Location Saved");
    });
  });

  // Enable Spoofing
  document.getElementById("btn-enable").addEventListener("click", () => {
    const coords = getAndValidate();
    if (!coords) return;
    chrome.storage.local.set({ ...coords, enabled: true }, () => {
      updateStatusUI(true);
      updateInfoDisplay(coords.latitude, coords.longitude, coords.accuracy);
      addToHistory(coords.latitude, coords.longitude);
      showToast("Spoofing Enabled");
    });
  });

  // Disable Spoofing
  document.getElementById("btn-disable").addEventListener("click", () => {
    chrome.storage.local.set({ enabled: false }, () => {
      updateStatusUI(false);
      showToast("Spoofing Disabled");
    });
  });

  // Use Current Location
  document.getElementById("btn-current").addEventListener("click", () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latInput.value = pos.coords.latitude.toFixed(6);
        lonInput.value = pos.coords.longitude.toFixed(6);
        accInput.value = Math.round(pos.coords.accuracy);
        showToast("Current location loaded", "info");
      },
      (err) => {
        showToast("Could not get location: " + err.message, "error");
      },
      { enableHighAccuracy: true }
    );
  });

  // Copy Coordinates
  document.getElementById("btn-copy").addEventListener("click", () => {
    const lat = latInput.value || "0";
    const lon = lonInput.value || "0";
    navigator.clipboard.writeText(lat + ", " + lon).then(() => {
      showToast("Coordinates Copied");
    }).catch(() => {
      showToast("Failed to copy", "error");
    });
  });

  // Open in Google Maps
  document.getElementById("btn-maps").addEventListener("click", () => {
    const lat = latInput.value || "0";
    const lon = lonInput.value || "0";
    chrome.tabs.create({ url: `https://maps.google.com/?q=${lat},${lon}` });
  });

  // Reset
  document.getElementById("btn-reset").addEventListener("click", () => {
    chrome.storage.local.set({
      latitude: 0,
      longitude: 0,
      accuracy: 10,
      enabled: false
    }, () => {
      latInput.value = 0;
      lonInput.value = 0;
      accInput.value = 10;
      updateStatusUI(false);
      updateInfoDisplay(0, 0, 10);
      showToast("Reset to Default", "info");
    });
  });

  // ===================== SEARCH CITY =====================
  document.getElementById("btn-search").addEventListener("click", searchCity);
  citySearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchCity();
  });

  function searchCity() {
    const query = citySearch.value.trim();
    if (!query) return;

    searchResults.classList.remove("hidden");
    searchResults.innerHTML = '<div class="empty-state">Searching...</div>';

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`, {
      headers: { "Accept-Language": "en" }
    })
      .then(r => r.json())
      .then(results => {
        if (!results.length) {
          searchResults.innerHTML = '<div class="empty-state">No results found</div>';
          return;
        }
        searchResults.innerHTML = "";
        results.forEach(r => {
          const item = document.createElement("div");
          item.className = "search-result-item";
          item.textContent = r.display_name.substring(0, 60);
          item.addEventListener("click", () => {
            latInput.value = parseFloat(r.lat).toFixed(6);
            lonInput.value = parseFloat(r.lon).toFixed(6);
            searchResults.classList.add("hidden");
            citySearch.value = "";
            showToast("City coordinates loaded", "info");
          });
          searchResults.appendChild(item);
        });
      })
      .catch(() => {
        searchResults.innerHTML = '<div class="empty-state">Search failed</div>';
      });
  }

  // ===================== PRESETS =====================
  function renderPresets(presets) {
    if (!presets.length) {
      presetsList.innerHTML = '<div class="empty-state">No presets saved</div>';
      return;
    }
    presetsList.innerHTML = "";
    presets.forEach((p, idx) => {
      const item = document.createElement("div");
      item.className = "preset-item";
      item.innerHTML = `
        <div class="preset-info" data-idx="${idx}">
          <div class="preset-name">${escapeHtml(p.name)}</div>
          <div class="preset-coords">${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}</div>
        </div>
        <button class="preset-delete" data-idx="${idx}" title="Delete preset">&times;</button>
      `;
      presetsList.appendChild(item);
    });

    // Click to apply
    presetsList.querySelectorAll(".preset-info").forEach(el => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.dataset.idx);
        const p = presets[idx];
        latInput.value = p.latitude;
        lonInput.value = p.longitude;
        // Switch to main tab
        document.querySelector('.tab[data-tab="main"]').click();
        showToast("Preset loaded: " + p.name, "info");
      });
    });

    // Delete
    presetsList.querySelectorAll(".preset-delete").forEach(el => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.dataset.idx);
        presets.splice(idx, 1);
        chrome.storage.local.set({ presets }, () => {
          renderPresets(presets);
          showToast("Preset deleted", "info");
        });
      });
    });
  }

  // Add preset
  document.getElementById("btn-add-preset").addEventListener("click", () => {
    const name = presetName.value.trim();
    if (!name) {
      showToast("Enter a preset name", "error");
      return;
    }
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    if (!GeoUtils.isValidLatitude(lat) || !GeoUtils.isValidLongitude(lon)) {
      showToast("Invalid coordinates", "error");
      return;
    }
    chrome.storage.local.get("presets", (data) => {
      const presets = data.presets || [];
      presets.push({ name, latitude: lat, longitude: lon });
      chrome.storage.local.set({ presets }, () => {
        presetName.value = "";
        renderPresets(presets);
        showToast("Preset saved: " + name);
      });
    });
  });

  // ===================== HISTORY =====================
  function renderHistory(history) {
    if (!history.length) {
      historyList.innerHTML = '<div class="empty-state">No recent locations</div>';
      return;
    }
    historyList.innerHTML = "";
    history.forEach((h, idx) => {
      const item = document.createElement("div");
      item.className = "preset-item";
      const time = new Date(h.timestamp).toLocaleString();
      item.innerHTML = `
        <div class="preset-info" data-idx="${idx}">
          <div class="preset-coords">${h.latitude.toFixed(6)}, ${h.longitude.toFixed(6)}</div>
          <div class="preset-coords" style="font-size:9px;opacity:0.6">${time}</div>
        </div>
      `;
      historyList.appendChild(item);
    });

    historyList.querySelectorAll(".preset-info").forEach(el => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.dataset.idx);
        const h = history[idx];
        latInput.value = h.latitude;
        lonInput.value = h.longitude;
        document.querySelector('.tab[data-tab="main"]').click();
        showToast("History location loaded", "info");
      });
    });
  }

  document.getElementById("btn-clear-history").addEventListener("click", () => {
    chrome.storage.local.set({ history: [] }, () => {
      renderHistory([]);
      showToast("History cleared", "info");
    });
  });

  // ===================== RANDOM NEARBY =====================
  document.getElementById("btn-random").addEventListener("click", () => {
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    const radius = parseInt(randomRadius.value) || 500;
    if (!GeoUtils.isValidLatitude(lat) || !GeoUtils.isValidLongitude(lon)) {
      showToast("Set valid coordinates first", "error");
      return;
    }
    const result = GeoUtils.randomNearby(lat, lon, radius);
    latInput.value = result.latitude;
    lonInput.value = result.longitude;
    showToast("Random location generated", "info");
  });

  // ===================== DMS CONVERTER =====================
  document.getElementById("btn-dms-to-dec").addEventListener("click", () => {
    const val = dmsInput.value.trim();
    if (!val) return;
    const decimal = GeoUtils.dmsToDecimal(val);
    if (decimal === null) {
      dmsResult.textContent = "Invalid DMS format";
      dmsResult.style.color = "var(--danger)";
    } else {
      dmsResult.textContent = "Decimal: " + decimal;
      dmsResult.style.color = "var(--accent)";
    }
  });

  // ===================== IMPORT / EXPORT =====================
  // Export settings
  document.getElementById("btn-export").addEventListener("click", () => {
    chrome.storage.local.get(["latitude", "longitude", "accuracy", "enabled", "showBadge", "darkMode"], (data) => {
      downloadJSON(data, "geoshift-settings.json");
      showToast("Settings exported");
    });
  });

  // Import settings
  document.getElementById("btn-import").addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const allowed = ["latitude", "longitude", "accuracy", "enabled", "showBadge", "darkMode"];
        const toSet = {};
        allowed.forEach(key => {
          if (data[key] !== undefined) toSet[key] = data[key];
        });
        chrome.storage.local.set(toSet, () => {
          loadState();
          showToast("Settings imported");
        });
      } catch {
        showToast("Invalid JSON file", "error");
      }
    };
    reader.readAsText(file);
    importFile.value = "";
  });

  // Export presets
  document.getElementById("btn-export-presets").addEventListener("click", () => {
    chrome.storage.local.get("presets", (data) => {
      downloadJSON(data.presets || [], "geoshift-presets.json");
      showToast("Presets exported");
    });
  });

  // Import presets
  document.getElementById("btn-import-presets").addEventListener("click", () => importPresetsFile.click());
  importPresetsFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error();
        const valid = data.filter(p => p.name && typeof p.latitude === "number" && typeof p.longitude === "number");
        chrome.storage.local.get("presets", (stored) => {
          const merged = [...(stored.presets || []), ...valid];
          chrome.storage.local.set({ presets: merged }, () => {
            renderPresets(merged);
            showToast("Presets imported (" + valid.length + ")");
          });
        });
      } catch {
        showToast("Invalid presets file", "error");
      }
    };
    reader.readAsText(file);
    importPresetsFile.value = "";
  });

  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===================== SETTINGS =====================
  toggleBadge.addEventListener("change", () => {
    chrome.storage.local.set({ showBadge: toggleBadge.checked });
  });

  toggleDark.addEventListener("change", () => {
    const isDark = toggleDark.checked;
    chrome.storage.local.set({ darkMode: isDark });
    applyTheme(isDark);
  });

  document.getElementById("theme-toggle").addEventListener("click", () => {
    toggleDark.checked = !toggleDark.checked;
    toggleDark.dispatchEvent(new Event("change"));
  });

  // ===================== UTILITY =====================
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ===================== INIT =====================
  loadState();

  // Listen for external storage changes (from background)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.enabled) updateStatusUI(changes.enabled.newValue);
    }
  });
});