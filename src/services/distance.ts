import { LocationCoordinates } from '../types';

/**
 * Calculates the great-circle distance between two coordinates using the Haversine formula (in kilometers).
 */
export function calculateHaversineDistance(
  coord1?: LocationCoordinates,
  coord2?: LocationCoordinates
): number {
  if (
    !coord1 ||
    !coord2 ||
    typeof coord1.lat !== 'number' ||
    typeof coord1.lng !== 'number' ||
    typeof coord2.lat !== 'number' ||
    typeof coord2.lng !== 'number' ||
    isNaN(coord1.lat) ||
    isNaN(coord1.lng) ||
    isNaN(coord2.lat) ||
    isNaN(coord2.lng) ||
    (coord1.lat === 0 && coord1.lng === 0) ||
    (coord2.lat === 0 && coord2.lng === 0)
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
 * Returns formatted distance string or honest district-level fallback note.
 * Never fabricates GPS coordinates or distances when real coordinates are absent.
 */
export function formatDistance(
  donorLoc?: LocationCoordinates,
  hospitalLoc?: LocationCoordinates
): { distanceKm: number | null; display: string } {
  if (!donorLoc || !hospitalLoc) {
    return {
      distanceKm: null,
      display: 'Precise distance unavailable (District-level matching)',
    };
  }

  const distance = calculateHaversineDistance(donorLoc, hospitalLoc);

  if (distance >= 0) {
    return {
      distanceKm: distance,
      display: `${distance} km away`,
    };
  }

  // Honest fallback to district/city level check without fabricating GPS/km estimates
  const donorDistrict = donorLoc.district?.trim();
  const hospitalDistrict = hospitalLoc.district?.trim();
  const donorCity = donorLoc.city?.trim();
  const hospitalCity = hospitalLoc.city?.trim();

  if (
    donorCity &&
    hospitalCity &&
    donorCity.toLowerCase() === hospitalCity.toLowerCase()
  ) {
    return {
      distanceKm: null,
      display: `Same City (${donorCity}) – District matching (Coordinates unavailable)`,
    };
  }

  if (
    donorDistrict &&
    hospitalDistrict &&
    donorDistrict.toLowerCase() === hospitalDistrict.toLowerCase()
  ) {
    return {
      distanceKm: null,
      display: `Same District (${donorDistrict}) – District matching (Coordinates unavailable)`,
    };
  }

  if (donorDistrict) {
    return {
      distanceKm: null,
      display: `${donorDistrict} District – Regional match (Coordinates unavailable)`,
    };
  }

  return {
    distanceKm: null,
    display: 'Precise distance unavailable (District-level matching)',
  };
}
