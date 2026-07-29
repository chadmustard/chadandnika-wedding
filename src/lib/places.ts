import type { AtlasRegion } from './atlas';

export type PlaceDefinition = {
  placeLabel: string;
  region: AtlasRegion;
  lat: number;
  lng: number;
};

/** State / country centroids for map markers. US entries use state names only. */
export const PLACES: Record<string, PlaceDefinition> = {
  // US states
  Alabama: { placeLabel: 'Alabama', region: 'us', lat: 32.8067, lng: -86.7911 },
  California: { placeLabel: 'California', region: 'us', lat: 36.7783, lng: -119.4179 },
  Colorado: { placeLabel: 'Colorado', region: 'us', lat: 39.5501, lng: -105.7821 },
  Florida: { placeLabel: 'Florida', region: 'us', lat: 27.6648, lng: -81.5158 },
  Georgia: { placeLabel: 'Georgia', region: 'us', lat: 32.1656, lng: -82.9001 },
  Illinois: { placeLabel: 'Illinois', region: 'us', lat: 40.6331, lng: -89.3985 },
  Indiana: { placeLabel: 'Indiana', region: 'us', lat: 40.2732, lng: -86.1349 },
  Kentucky: { placeLabel: 'Kentucky', region: 'us', lat: 37.8393, lng: -84.27 },
  Michigan: { placeLabel: 'Michigan', region: 'us', lat: 44.3148, lng: -85.6024 },
  'New York': { placeLabel: 'New York', region: 'us', lat: 43.2994, lng: -74.2179 },
  'North Carolina': {
    placeLabel: 'North Carolina',
    region: 'us',
    lat: 35.7596,
    lng: -79.0193,
  },
  Ohio: { placeLabel: 'Ohio', region: 'us', lat: 40.4173, lng: -82.9071 },
  'South Carolina': {
    placeLabel: 'South Carolina',
    region: 'us',
    lat: 33.8361,
    lng: -81.1637,
  },
  Tennessee: { placeLabel: 'Tennessee', region: 'us', lat: 35.5175, lng: -86.5804 },
  Texas: { placeLabel: 'Texas', region: 'us', lat: 31.9686, lng: -99.9018 },
  Virginia: { placeLabel: 'Virginia', region: 'us', lat: 37.4316, lng: -78.6569 },
  Washington: { placeLabel: 'Washington', region: 'us', lat: 47.7511, lng: -120.7401 },
  Wisconsin: { placeLabel: 'Wisconsin', region: 'us', lat: 44.2685, lng: -89.6165 },

  // Inset regions (country-level labels)
  Ukraine: { placeLabel: 'Ukraine', region: 'ukraine', lat: 48.3794, lng: 31.1656 },
  Italy: { placeLabel: 'Italy', region: 'italy', lat: 41.8719, lng: 12.5674 },
  Singapore: { placeLabel: 'Singapore', region: 'singapore', lat: 1.3521, lng: 103.8198 },
};

export function resolvePlace(name: string): PlaceDefinition {
  const place = PLACES[name.trim()];
  if (!place) {
    throw new Error(`Unknown place in timeline: "${name}"`);
  }
  return place;
}
