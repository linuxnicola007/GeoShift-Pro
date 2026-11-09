/**
 * GeoShift Pro - Utility Functions
 * Shared helpers for validation, conversion, and formatting.
 */

const GeoUtils = {
  /**
   * Validate latitude value (-90 to +90)
   */
  isValidLatitude(lat) {
    const num = parseFloat(lat);
    return !isNaN(num) && num >= -90 && num <= 90;
  },

  /**
   * Validate longitude value (-180 to +180)
   */
  isValidLongitude(lon) {
    const num = parseFloat(lon);
    return !isNaN(num) && num >= -180 && num <= 180;
  },

  /**
   * Validate accuracy value (positive number)
   */
  isValidAccuracy(acc) {
    const num = parseFloat(acc);
    return !isNaN(num) && num > 0;
  },

  /**
   * Validate all coordinate inputs
   */
  validateCoordinates(lat, lon, acc) {
    const errors = [];
    if (!this.isValidLatitude(lat)) errors.push("Latitude must be between -90 and +90");
    if (!this.isValidLongitude(lon)) errors.push("Longitude must be between -180 and +180");
    if (acc !== undefined && acc !== "" && !this.isValidAccuracy(acc)) errors.push("Accuracy must be a positive number");
    return { valid: errors.length === 0, errors };
  },

  /**
   * Convert Decimal Degrees to DMS (Degrees, Minutes, Seconds)
   */
  decimalToDMS(decimal, isLatitude) {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);
    const direction = isLatitude
      ? (decimal >= 0 ? "N" : "S")
      : (decimal >= 0 ? "E" : "W");
    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  },

  /**
   * Convert DMS string to Decimal Degrees
   */
  dmsToDecimal(dmsStr) {
    const regex = /(\d+)°\s*(\d+)'\s*([\d.]+)"\s*([NSEWnsew])/;
    const match = dmsStr.match(regex);
    if (!match) return null;
    const degrees = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseFloat(match[3]);
    const direction = match[4].toUpperCase();
    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (direction === "S" || direction === "W") decimal *= -1;
    return parseFloat(decimal.toFixed(6));
  },

  /**
   * Generate a random coordinate within a radius (in meters) of a center point
   */
  randomNearby(lat, lon, radiusMeters) {
    const radiusInDegrees = radiusMeters / 111320;
    const u = Math.random();
    const v = Math.random();
    const w = radiusInDegrees * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const newLat = lat + w * Math.cos(t);
    const newLon = lon + w * Math.sin(t) / Math.cos(lat * (Math.PI / 180));
    return {
      latitude: parseFloat(newLat.toFixed(6)),
      longitude: parseFloat(newLon.toFixed(6))
    };
  },

  /**
   * Format coordinates for display
   */
  formatCoords(lat, lon) {
    return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`;
  },

  /**
   * Default preset locations
   */
  defaultPresets: [
    { name: "Dubai", latitude: 25.276987, longitude: 55.296249 },
    { name: "London", latitude: 51.507351, longitude: -0.127758 },
    { name: "Islamabad", latitude: 33.693651, longitude: 73.064720 },
    { name: "New York", latitude: 40.712776, longitude: -74.005974 },
    { name: "Tokyo", latitude: 35.689487, longitude: 139.691711 }
  ],

  /**
   * Default extension state
   */
  defaultState: {
    latitude: 0,
    longitude: 0,
    accuracy: 10,
    enabled: false,
    showBadge: true,
    darkMode: true,
    presets: [],
    history: []
  }
};

// Make available in both contexts
if (typeof module !== "undefined" && module.exports) {
  module.exports = GeoUtils;
}