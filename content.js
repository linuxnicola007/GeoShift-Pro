/**
 * GeoShift Pro - Content Script (ISOLATED World)
 * Reads extension state from chrome.storage and sends it to the
 * MAIN world inject.js via window.postMessage.
 * Also manages the floating badge UI.
 */

(function () {
  "use strict";

  let geoState = {
    latitude: 0,
    longitude: 0,
    accuracy: 10,
    enabled: false,
    showBadge: true
  };

  let badge = null;

  // Load initial state from storage
  chrome.storage.local.get(["latitude", "longitude", "accuracy", "enabled", "showBadge"], (data) => {
    if (data.latitude !== undefined) geoState.latitude = data.latitude;
    if (data.longitude !== undefined) geoState.longitude = data.longitude;
    if (data.accuracy !== undefined) geoState.accuracy = data.accuracy;
    if (data.enabled !== undefined) geoState.enabled = data.enabled;
    if (data.showBadge !== undefined) geoState.showBadge = data.showBadge;

    sendStateToPage();
    updateBadge();
  });

  // Listen for updates from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GEOSHIFT_UPDATE") {
      geoState = { ...geoState, ...message.data };
      sendStateToPage();
      updateBadge();
    }

    if (message.type === "GEOSHIFT_COPY") {
      const text = `${message.data.latitude}, ${message.data.longitude}`;
      navigator.clipboard.writeText(text).catch(() => {});
    }
  });

  // Listen for the inject.js ready signal, then re-send state
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === "GEOSHIFT_INJECT_READY") {
      sendStateToPage();
    }
  });

  /**
   * Send the current spoofing state to the MAIN world inject.js
   * via postMessage. This bypasses CSP restrictions since no
   * script tag injection is needed.
   */
  function sendStateToPage() {
    window.postMessage({
      type: "GEOSHIFT_STATE",
      payload: {
        latitude: geoState.latitude,
        longitude: geoState.longitude,
        accuracy: geoState.accuracy,
        enabled: geoState.enabled
      }
    }, "*");
  }

  /**
   * Create or update the floating badge showing spoofed coordinates
   */
  function updateBadge() {
    if (!geoState.enabled || !geoState.showBadge) {
      if (badge) {
        badge.remove();
        badge = null;
      }
      return;
    }

    if (!badge) {
      badge = document.createElement("div");
      badge.id = "geoshift-badge";
      badge.innerHTML = `
        <style>
          #geoshift-badge {
            position: fixed;
            bottom: 16px;
            right: 16px;
            background: rgba(17, 24, 39, 0.95);
            color: #e5e7eb;
            padding: 10px 14px;
            border-radius: 10px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            z-index: 2147483647;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            border: 1px solid rgba(74, 222, 128, 0.3);
            cursor: move;
            user-select: none;
            transition: opacity 0.2s;
          }
          #geoshift-badge:hover {
            opacity: 0.7;
          }
          #geoshift-badge .gs-title {
            color: #4ade80;
            font-weight: 600;
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          #geoshift-badge .gs-close {
            position: absolute;
            top: 4px;
            right: 8px;
            cursor: pointer;
            color: #9ca3af;
            font-size: 14px;
            line-height: 1;
          }
          #geoshift-badge .gs-close:hover {
            color: #fff;
          }
          #geoshift-badge .gs-coords {
            font-family: 'SF Mono', Monaco, 'Courier New', monospace;
            font-size: 11px;
            color: #d1d5db;
          }
        </style>
        <span class="gs-close" id="geoshift-badge-close">&times;</span>
        <div class="gs-title">📍 Spoofed Location</div>
        <div class="gs-coords">
          Lat: ${parseFloat(geoState.latitude).toFixed(6)}<br>
          Lon: ${parseFloat(geoState.longitude).toFixed(6)}
        </div>
      `;
      document.body.appendChild(badge);

      // Close button
      document.getElementById("geoshift-badge-close").addEventListener("click", (e) => {
        e.stopPropagation();
        badge.remove();
        badge = null;
        chrome.storage.local.set({ showBadge: false });
      });

      // Make draggable
      let isDragging = false;
      let offsetX, offsetY;
      badge.addEventListener("mousedown", (e) => {
        if (e.target.id === "geoshift-badge-close") return;
        isDragging = true;
        offsetX = e.clientX - badge.getBoundingClientRect().left;
        offsetY = e.clientY - badge.getBoundingClientRect().top;
      });
      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        badge.style.left = (e.clientX - offsetX) + "px";
        badge.style.top = (e.clientY - offsetY) + "px";
        badge.style.right = "auto";
        badge.style.bottom = "auto";
      });
      document.addEventListener("mouseup", () => {
        isDragging = false;
      });
    } else {
      // Update existing badge text
      const coordsEl = badge.querySelector(".gs-coords");
      if (coordsEl) {
        coordsEl.innerHTML = `Lat: ${parseFloat(geoState.latitude).toFixed(6)}<br>Lon: ${parseFloat(geoState.longitude).toFixed(6)}`;
      }
    }
  }
})();