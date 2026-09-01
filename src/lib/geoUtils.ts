/**
 * Utility functions for Spatial & Territory Intelligence
 */

export interface Point {
  lat: number;
  lng: number;
}

/**
 * Ray-casting Point-in-Polygon algorithm.
 * Returns true if the given coordinate falls inside the polygon points array.
 */
export function isPointInPolygon(point: Point, vs: Point[]): boolean {
  if (!vs || vs.length < 3) return false;
  
  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].lng;
    const yi = vs[i].lat;
    const xj = vs[j].lng;
    const yj = vs[j].lat;

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}
