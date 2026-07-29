import type { Feature, Geometry } from 'geojson';
import italy from '../../public/geo/insets/italy.json';
import singapore from '../../public/geo/insets/singapore.json';
import ukraine from '../../public/geo/insets/ukraine.json';

export type InsetFeature = Feature<Geometry>;

export const INSET_GEOGRAPHIES: Record<string, InsetFeature> = {
  Singapore: singapore as InsetFeature,
  Italy: italy as InsetFeature,
  Ukraine: ukraine as InsetFeature,
};

export const INSET_COUNTRY_NAMES = ['Singapore', 'Italy', 'Ukraine'] as const;
