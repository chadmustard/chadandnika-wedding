export type AtlasRegion = 'us' | 'ukraine' | 'italy' | 'singapore';

/** Simple equirectangular projectors tuned per inset panel (viewBox 0..100). */
export function projectToPanel(
  region: AtlasRegion,
  lat: number,
  lng: number,
): { x: number; y: number } {
  const bounds: Record<
    AtlasRegion,
    { minLat: number; maxLat: number; minLng: number; maxLng: number }
  > = {
    us: { minLat: 24, maxLat: 50, minLng: -125, maxLng: -66 },
    ukraine: { minLat: 44, maxLat: 53, minLng: 22, maxLng: 41 },
    italy: { minLat: 36.5, maxLat: 47.5, minLng: 6.5, maxLng: 19 },
    singapore: { minLat: 1.15, maxLat: 1.48, minLng: 103.6, maxLng: 104.1 },
  };

  const b = bounds[region];
  const x = ((lng - b.minLng) / (b.maxLng - b.minLng)) * 100;
  const y = ((b.maxLat - lat) / (b.maxLat - b.minLat)) * 100;
  return {
    x: Math.min(98, Math.max(2, x)),
    y: Math.min(98, Math.max(2, y)),
  };
}
