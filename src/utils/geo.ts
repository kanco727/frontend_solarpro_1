// src/utils/geo.ts
export type LatLng = { latitude: number; longitude: number };

/** Parse "POINT(lon lat)" -> { latitude, longitude } */
export function parsePointWkt(wkt?: string | null): LatLng | null {
  if (!wkt) return null;
  const m = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!m) return null;
  const lon = parseFloat(m[1]);
  const lat = parseFloat(m[2]);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return { latitude: lat, longitude: lon };
}

/** { lat, lon } -> "POINT(lon lat)" */
export function pointToWKT(p: LatLng): string {
  return `POINT(${p.longitude} ${p.latitude})`;
}
