/**
 * GeoShift Pro - MAIN World Injection Script
 * Runs in the page's main world (world: "MAIN") to directly override
 * navigator.geolocation WITHOUT injecting a <script> tag.
 * This bypasses Content Security Policy (CSP) restrictions.
 *
 * Communication with the ISOLATED world content.js happens via
 * window.postMessage — no chrome.* APIs are available here.
 */

(function () {
  "use strict";

  // Store original methods so we can fall back when spoofing is disabled
  const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
  const originalWatchPosition = navigator.geolocation.watchPosition.bind(navigator.geolocation);
  const originalClearWatch = navigator.geolocation.clearWatch.bind(navigator.geolocation);

  // Spoofed state — updated by content.js via postMessage
  let spoofedState = {
    latitude: 0,
    longitude: 0,
    accuracy: 10,
    enabled: false
  };

  // Listen for state updates from the ISOLATED world content script
  window.addEventListener("message", function (event) {
    if (event.source !== window) return;
    if (event.data && event.data.type === "GEOSHIFT_STATE") {
      spoofedState = Object.assign({}, spoofedState, event.data.payload);
    }
  });

  // Also dispatch a ready event so content.js knows we're loaded
  window.postMessage({ type: "GEOSHIFT_INJECT_READY" }, "*");

  function createSpoofedPosition() {
    return {
      coords: {
        latitude: spoofedState.latitude,
        longitude: spoofedState.longitude,
        accuracy: spoofedState.accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    };
  }

  // Override getCurrentPosition on the prototype so it can't be easily
  // reverted by the page
  var geoProto = Object.getPrototypeOf(navigator.geolocation);

  Object.defineProperty(geoProto, "getCurrentPosition", {
    value: function (success, error, options) {
      if (spoofedState.enabled) {
        if (typeof success === "function") {
          setTimeout(function () {
            success(createSpoofedPosition());
          }, 100);
        }
      } else {
        return originalGetCurrentPosition(success, error, options);
      }
    },
    writable: true,
    configurable: true,
    enumerable: true
  });

  var watchIdCounter = 0;

  Object.defineProperty(geoProto, "watchPosition", {
    value: function (success, error, options) {
      if (spoofedState.enabled) {
        watchIdCounter++;
        var id = watchIdCounter;
        if (typeof success === "function") {
          setTimeout(function () {
            success(createSpoofedPosition());
          }, 100);
        }
        return id;
      } else {
        return originalWatchPosition(success, error, options);
      }
    },
    writable: true,
    configurable: true,
    enumerable: true
  });

  Object.defineProperty(geoProto, "clearWatch", {
    value: function (id) {
      if (spoofedState.enabled) {
        // No-op for spoofed watches
      } else {
        return originalClearWatch(id);
      }
    },
    writable: true,
    configurable: true,
    enumerable: true
  });

  // Also override navigator.permissions.query for geolocation
  // so sites that check permission before calling getCurrentPosition
  // also see spoofed state
  if (navigator.permissions && navigator.permissions.query) {
    var originalQuery = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = function (desc) {
      if (spoofedState.enabled && desc && desc.name === "geolocation") {
        return Promise.resolve({ state: "granted", onchange: null });
      }
      return originalQuery(desc);
    };
  }
})();