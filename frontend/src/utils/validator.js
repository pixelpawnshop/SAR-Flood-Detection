import * as turf from '@turf/turf';

/**
 * Validate AOI geometry and size
 * @param {Object} geometry - GeoJSON geometry
 * @returns {Object} - { isValid: boolean, error: string|null, area: number }
 */
export const validateAOI = (geometry) => {
  try {
    // Check if geometry exists
    if (!geometry) {
      return { isValid: false, error: 'No geometry provided', area: 0 };
    }

    // Create turf polygon
    const polygon = turf.polygon(geometry.coordinates);

    // Calculate area in m²
    const areaM2 = turf.area(polygon);
    const areaKm2 = areaM2 / 1_000_000;

    // Check maximum size (2500 km² = 50×50 km)
    const MAX_AREA_KM2 = 2500;
    
    if (areaKm2 > MAX_AREA_KM2) {
      return {
        isValid: false,
        error: `AOI too large (${areaKm2.toFixed(2)} km²). Maximum allowed: ${MAX_AREA_KM2} km² (50×50 km)`,
        area: areaKm2,
      };
    }

    // Check minimum size (0.01 km² = 100m × 100m)
    const MIN_AREA_KM2 = 0.01;
    
    if (areaKm2 < MIN_AREA_KM2) {
      return {
        isValid: false,
        error: `AOI too small (${areaKm2.toFixed(4)} km²). Minimum allowed: ${MIN_AREA_KM2} km²`,
        area: areaKm2,
      };
    }

    // Valid AOI
    return {
      isValid: true,
      error: null,
      area: areaKm2,
    };

  } catch (error) {
    console.error('Error validating AOI:', error);
    return {
      isValid: false,
      error: 'Invalid geometry',
      area: 0,
    };
  }
};

/**
 * Format area for display
 * @param {number} areaKm2 - Area in km²
 * @returns {string} - Formatted area string
 */
export const formatArea = (areaKm2) => {
  if (areaKm2 < 1) {
    return `${(areaKm2 * 1_000_000).toFixed(0)} m²`;
  }
  return `${areaKm2.toFixed(2)} km²`;
};
