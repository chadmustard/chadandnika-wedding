'use client';

/**
 * react-simple-maps ships FunctionComponent types that clash with newer @types/react.
 * Thin wrappers keep call sites clean.
 */
import {
  ComposableMap as RsmComposableMap,
  Geographies as RsmGeographies,
  Geography as RsmGeography,
  Marker as RsmMarker,
  Line as RsmLine,
  type ComposableMapProps,
  type GeographiesProps,
  type GeographyProps,
  type MarkerProps,
  type LineProps,
} from 'react-simple-maps';

export const ComposableMap =
  RsmComposableMap as unknown as React.FC<ComposableMapProps>;
export const Geographies =
  RsmGeographies as unknown as React.FC<GeographiesProps>;
export const Geography =
  RsmGeography as unknown as React.FC<GeographyProps>;
export const Marker = RsmMarker as unknown as React.FC<MarkerProps>;
export const Line = RsmLine as unknown as React.FC<LineProps>;
