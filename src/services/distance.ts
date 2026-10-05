import { LocationCoordinates } from '../types';

/**
 * Calculates the great-circle distance between two coordinates using the Haversine formula (in kilometers).
 */
export function calculateHaversineDistance(
  coord1: LocationCoordinates,
  coord2: LocationCoordinates
): number {
  if (
    typeof coord1.lat !== 'number' ||
    typeof coord1.lng !== 'number' ||
    typeof coord2.lat !== 'number' ||
    typeof coord2.lng !== 'number'
  ) {
    return -1;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Returns formatted distance string or district-level fallback note.
 */
export function formatDistance(
  donorLoc: LocationCoordinates,
  hospitalLoc: LocationCoordinates
): { distanceKm: number | null; display: string } {
  const distance = calculateHaversineDistance(donorLoc, hospitalLoc);

  if (distance >= 0) {
    return {
      distanceKm: distance,
      display: `${distance} km`,
    };
  }

  // Fallback to district/city level check
  if (
    donorLoc.district &&
    hospitalLoc.district &&
    donorLoc.district.toLowerCase() === hospitalLoc.district.toLowerCase()
  ) {
    return {
      distanceKm: null,
      display: `Same District (${donorLoc.district}) ~10-15 km est.`,
    };
  }

  if (donorLoc.city && hospitalLoc.city && donorLoc.city.toLowerCase() === hospitalLoc.city.toLowerCase()) {
    return {
      distanceKm: null,
      display: `Same City (${donorLoc.city}) ~5-10 km est.`,
    };
  }

  return {
    distanceKm: null,
    display: 'District-level matching (Coordinates unavailable)',
  };
}
