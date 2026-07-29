'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import { geoInterpolate } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import * as THREE from 'three';
import { PLACES } from '@/lib/places';

export type AtlasPhoto = {
  id: string;
  imageUrl: string;
  caption: string | null;
  uploadedByPersonId: string | null;
  uploadedByDisplayName: string | null;
};

export type AtlasStay = {
  id: string;
  placeLabel: string;
  region: string;
  lat: number;
  lng: number;
  isCurrent: boolean;
  sortOrder: number;
  photos: AtlasPhoto[];
};

export type AtlasPerson = {
  id: string;
  displayName: string;
  profileImageUrl: string;
  isCouple: boolean;
  stays: AtlasStay[];
};

type PlaceSelection = {
  placeLabel: string;
  region: string;
  current: AtlasPerson[];
  former: AtlasPerson[];
};

type GlobePolygon = Feature<Geometry> & {
  properties: {
    name: string;
    region: string;
  };
};

type PathPoint = { lat: number; lng: number; alt: number };

type PathDatum = {
  key: string;
  personId: string;
  color: string;
  points: PathPoint[];
};

type NodeDatum = {
  key: string;
  personId: string;
  color: string;
  lat: number;
  lng: number;
};

type HtmlCluster = {
  placeLabel: string;
  region: string;
  lat: number;
  lng: number;
  people: AtlasPerson[];
};

const US_GEO = '/geo/us-states-10m.json';
/** Coarser world outline — much cheaper to render than 50m on a WebGL globe. */
const WORLD_GEO = '/geo/countries-110m.json';
const USA_COUNTRY_ID = '840';

/** Clear altitude stack: ocean (0) < land < paths < nodes < avatars */
const ALT = {
  land: 0.006,
  landSelected: 0.01,
  path: 0.016,
  node: 0.02,
  avatar: 0.04,
} as const;

const PATH_SAMPLES = 48;

function greatCirclePoints(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  alt: number,
): PathPoint[] {
  const interpolate = geoInterpolate([fromLng, fromLat], [toLng, toLat]);
  return Array.from({ length: PATH_SAMPLES + 1 }, (_, i) => {
    const [lng, lat] = interpolate(i / PATH_SAMPLES)!;
    return { lat, lng, alt };
  });
}

const SKIP_STATES = new Set([
  'Puerto Rico',
  'Guam',
  'American Samoa',
  'Commonwealth of the Northern Mariana Islands',
  'United States Virgin Islands',
  'District of Columbia',
]);

const MAP = {
  land: '#e8e0d4',
  landActive: '#c9b8a4',
  landEmpty: '#efe8dc',
  stroke: '#8a7f72',
  strokeStrong: '#2a2622',
  ink: '#141210',
  cream: '#f2ebe1',
  ocean: '#d9d0c3',
  atmosphere: '#c4b8a6',
};

/** Saturated path/avatar colors — readable on cream land. */
const PERSON_PALETTE = [
  '#2f9e6b',
  '#e4572e',
  '#2f6fed',
  '#d4a017',
  '#9b4dca',
  '#0f9b8e',
  '#e23e57',
  '#3a7ca5',
  '#c47f17',
  '#b14d8e',
  '#3f8f4a',
  '#d65a31',
  '#4c6ef5',
  '#b8860b',
  '#8e44ad',
  '#16a085',
  '#c0392b',
  '#2980b9',
  '#d35400',
  '#7d3c98',
  '#27ae60',
  '#e74c3c',
  '#2471a3',
  '#f39c12',
  '#6c3483',
  '#1abc9c',
  '#922b21',
  '#1a5276',
  '#a04000',
  '#5b2c6f',
  '#196f3d',
  '#cb4335',
  '#1f618d',
  '#b9770e',
];

function personColor(index: number): string {
  return PERSON_PALETTE[index % PERSON_PALETTE.length]!;
}

function currentStay(person: AtlasPerson): AtlasStay | undefined {
  return person.stays.find((s) => s.isCurrent);
}

function sortedStays(person: AtlasPerson): AtlasStay[] {
  return person.stays.slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

function peopleAtPlaceSelection(
  people: AtlasPerson[],
  placeLabel: string,
  region: string,
): PlaceSelection {
  const connected = people.filter((p) =>
    p.stays.some((s) => s.placeLabel === placeLabel),
  );
  const current = connected.filter(
    (p) => currentStay(p)?.placeLabel === placeLabel,
  );
  const former = connected.filter(
    (p) => currentStay(p)?.placeLabel !== placeLabel,
  );
  return { placeLabel, region, current, former };
}

function regionForLabel(placeLabel: string): string {
  return PLACES[placeLabel]?.region ?? 'us';
}

function groupCurrentByPlace(people: AtlasPerson[]): HtmlCluster[] {
  const map = new Map<string, HtmlCluster>();

  for (const person of people) {
    const stay = currentStay(person);
    if (!stay) continue;
    const existing = map.get(stay.placeLabel);
    if (existing) {
      existing.people.push(person);
    } else {
      map.set(stay.placeLabel, {
        placeLabel: stay.placeLabel,
        region: stay.region,
        lat: stay.lat,
        lng: stay.lng,
        people: [person],
      });
    }
  }

  return [...map.values()];
}

function clumpOffsets(
  count: number,
  radius: number,
): { x: number; y: number }[] {
  if (count <= 0) return [];
  if (count === 1) return [{ x: 0, y: 0 }];
  if (count === 2) {
    return [
      { x: -radius * 0.55, y: 0 },
      { x: radius * 0.55, y: 0 },
    ];
  }
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });
}

function PersonRow({
  person,
  color,
  onSelect,
}: {
  person: AtlasPerson;
  color: string;
  onSelect: () => void;
}) {
  const path = sortedStays(person)
    .map((s) => s.placeLabel)
    .join(' → ');

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-white/50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={person.profileImageUrl}
          alt=""
          className="h-11 w-11 rounded-full object-cover"
          style={{ boxShadow: `0 0 0 2px ${color}` }}
        />
        <span>
          <span className="block text-sm font-medium">
            {person.displayName}
          </span>
          <span className="block text-xs text-wedding-stone">{path}</span>
        </span>
      </button>
    </li>
  );
}

function photosForPlace(selection: PlaceSelection): AtlasPhoto[] {
  const people = [...selection.current, ...selection.former];
  const photos: AtlasPhoto[] = [];
  for (const person of people) {
    for (const stay of person.stays) {
      if (stay.placeLabel !== selection.placeLabel) continue;
      photos.push(...stay.photos);
    }
  }
  return photos;
}

function PlaceDetail({
  selection,
  colorById,
  viewerPersonId,
  canUpload,
  onClose,
  onSelectPerson,
  onPhotoUploaded,
}: {
  selection: PlaceSelection;
  colorById: Map<string, string>;
  viewerPersonId: string | null;
  canUpload: boolean;
  onClose: () => void;
  onSelectPerson: (person: AtlasPerson) => void;
  onPhotoUploaded: () => Promise<void>;
}) {
  const { current, former } = selection;
  const photos = photosForPlace(selection);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  async function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    if (!viewerPersonId) {
      setUploadError('Open your invite link again so we know who you are.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.set('placeLabel', selection.placeLabel);
      body.set('file', file);
      if (caption.trim()) body.set('caption', caption.trim());

      const res = await fetch('/api/history/photos', {
        method: 'POST',
        body,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Upload failed');
      }
      setCaption('');
      await onPhotoUploaded();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="animate-fade-up border border-wedding-ink/10 bg-white/55 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-wedding-stone">
            Place
          </p>
          <h3 className="mt-1 font-display text-3xl tracking-tight">
            {selection.placeLabel}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-wedding-stone hover:text-wedding-ink"
        >
          Close
        </button>
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-wedding-stone">
            Photos from here
          </p>
          {canUpload ? (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-wedding-ink underline decoration-wedding-sage decoration-2 underline-offset-4 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Add a photo'}
            </button>
          ) : null}
        </div>

        {canUpload ? (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption"
              maxLength={200}
              className="w-full border border-wedding-ink/15 bg-white/70 px-3 py-2 text-sm outline-none focus:border-wedding-ink/40 sm:max-w-xs"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void onFileChange(e.target.files)}
            />
            <p className="text-xs text-wedding-stone">
              JPEG, PNG, or WebP · under 5MB. iPhone photos: choose “Most
              Compatible” / JPEG if the upload is rejected.
            </p>
          </div>
        ) : viewerPersonId ? (
          <p className="mt-2 text-xs text-wedding-stone">
            Only guests who’ve lived in {selection.placeLabel} can attach photos.
          </p>
        ) : (
          <p className="mt-2 text-xs text-wedding-stone">
            Open your personal invite link to attach photos from places you’ve
            lived.
          </p>
        )}

        {uploadError ? (
          <p className="mt-2 text-sm text-red-700/80">{uploadError}</p>
        ) : null}

        {photos.length === 0 ? (
          <p className="mt-3 text-sm text-wedding-stone">
            No photos yet
            {canUpload ? ' — be the first.' : '.'}
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <li key={photo.id} className="group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={photo.caption ?? ''}
                  className="aspect-[4/3] w-full object-cover"
                />
                <p className="mt-1.5 text-xs text-wedding-stone">
                  {photo.uploadedByDisplayName ?? 'Guest'}
                  {photo.caption ? ` · ${photo.caption}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <p className="text-xs uppercase tracking-[0.18em] text-wedding-stone">
          Here now
        </p>
        {current.length === 0 ? (
          <p className="mt-2 text-sm text-wedding-stone">
            Nobody from the guest list is here right now.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-wedding-ink/10 border-t border-wedding-ink/10">
            {current.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                color={colorById.get(person.id) ?? MAP.ink}
                onSelect={() => onSelectPerson(person)}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <p className="text-xs uppercase tracking-[0.18em] text-wedding-stone">
          Lived here before
        </p>
        {former.length === 0 ? (
          <p className="mt-2 text-sm text-wedding-stone">
            No one else on the guest list has a stop here in their timeline.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-wedding-ink/10 border-t border-wedding-ink/10">
            {former.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                color={colorById.get(person.id) ?? MAP.ink}
                onSelect={() => onSelectPerson(person)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PersonDetail({
  person,
  color,
  onBack,
  onClose,
}: {
  person: AtlasPerson;
  color: string;
  onBack: () => void;
  onClose: () => void;
}) {
  const stays = sortedStays(person);

  return (
    <div className="animate-fade-up border border-wedding-ink/10 bg-white/55 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={person.profileImageUrl}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
            style={{ boxShadow: `0 0 0 2px ${color}` }}
          />
          <div>
            <h3 className="font-display text-2xl tracking-tight">
              {person.displayName}
            </h3>
            <p className="text-sm text-wedding-stone">
              {stays.map((s) => s.placeLabel).join(' → ')}
            </p>
          </div>
        </div>
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            onClick={onBack}
            className="text-wedding-stone hover:text-wedding-ink"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-wedding-stone hover:text-wedding-ink"
          >
            Close
          </button>
        </div>
      </div>

      <ul className="mt-5 space-y-2 border-t border-wedding-ink/10 pt-4">
        {stays.map((stay) => (
          <li key={stay.id} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="font-medium">{stay.placeLabel}</span>
            {stay.isCurrent ? (
              <span className="text-wedding-stone"> (now)</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AtlasMap({
  people,
  viewerPersonId,
  onPeopleChanged,
}: {
  people: AtlasPerson[];
  viewerPersonId: string | null;
  onPeopleChanged: () => Promise<void>;
}) {
  const [placeSelection, setPlaceSelection] = useState<PlaceSelection | null>(
    null,
  );
  const [personSelection, setPersonSelection] = useState<AtlasPerson | null>(
    null,
  );
  const [polygons, setPolygons] = useState<GlobePolygon[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  const oceanMaterial = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: MAP.ocean,
        emissive: new THREE.Color('#cfc6b8'),
        emissiveIntensity: 0.08,
      }),
    [],
  );

  const colorById = useMemo(() => {
    const map = new Map<string, string>();
    people.forEach((person, index) => {
      map.set(person.id, personColor(index));
    });
    return map;
  }, [people]);

  const clusters = useMemo(() => groupCurrentByPlace(people), [people]);
  const occupied = useMemo(
    () => new Set(clusters.map((c) => c.placeLabel)),
    [clusters],
  );

  const paths = useMemo(() => {
    const next: PathDatum[] = [];
    for (const person of people) {
      const color = colorById.get(person.id) ?? MAP.ink;
      const stays = sortedStays(person);
      for (let i = 0; i < stays.length - 1; i++) {
        const from = stays[i]!;
        const to = stays[i + 1]!;
        next.push({
          key: `${person.id}-${from.id}-${to.id}`,
          personId: person.id,
          color,
          points: greatCirclePoints(
            from.lat,
            from.lng,
            to.lat,
            to.lng,
            ALT.path,
          ),
        });
      }
    }
    return next;
  }, [people, colorById]);

  const pastNodes = useMemo(() => {
    const next: NodeDatum[] = [];
    for (const person of people) {
      const color = colorById.get(person.id) ?? MAP.ink;
      for (const stay of sortedStays(person)) {
        if (stay.isCurrent) continue;
        next.push({
          key: `${person.id}-${stay.id}`,
          personId: person.id,
          color,
          lat: stay.lat,
          lng: stay.lng,
        });
      }
    }
    return next;
  }, [people, colorById]);

  const viewerLivedHere = useMemo(() => {
    if (!viewerPersonId || !placeSelection) return false;
    const viewer = people.find((p) => p.id === viewerPersonId);
    return Boolean(
      viewer?.stays.some((s) => s.placeLabel === placeSelection.placeLabel),
    );
  }, [viewerPersonId, placeSelection, people]);

  // Keep place panel in sync after photo uploads refresh people
  useEffect(() => {
    setPlaceSelection((prev) => {
      if (!prev) return prev;
      return peopleAtPlaceSelection(people, prev.placeLabel, prev.region);
    });
  }, [people]);

  // Load land polygons: world countries (minus USA) + US states
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [worldTopo, usTopo] = await Promise.all([
        fetch(WORLD_GEO).then((r) => r.json() as Promise<Topology>),
        fetch(US_GEO).then((r) => r.json() as Promise<Topology>),
      ]);

      const worldObj = worldTopo.objects.countries as GeometryCollection;
      const worldFc = feature(worldTopo, worldObj) as FeatureCollection;
      const countries = worldFc.features
        .filter((f) => String(f.id) !== USA_COUNTRY_ID)
        .map((f) => {
          const name = String(
            (f.properties as { name?: string } | null)?.name ?? 'Unknown',
          );
          return {
            ...f,
            properties: {
              name,
              region: regionForLabel(name),
            },
          } satisfies GlobePolygon;
        });

      const statesObj = usTopo.objects.states as GeometryCollection;
      const statesFc = feature(usTopo, statesObj) as FeatureCollection;
      const states = statesFc.features
        .filter((f) => {
          const name = String(
            (f.properties as { name?: string } | null)?.name ?? '',
          );
          return name && !SKIP_STATES.has(name);
        })
        .map((f) => {
          const name = String(
            (f.properties as { name?: string } | null)?.name ?? '',
          );
          return {
            ...f,
            properties: {
              name,
              region: 'us',
            },
          } satisfies GlobePolygon;
        });

      if (!cancelled) setPolygons([...countries, ...states]);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep globe sized to its container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function measure() {
      if (!el) return;
      setSize({ w: el.clientWidth, h: el.clientHeight });
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Start over the US — where most of the guest graph lives
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || size.w === 0) return;
    globe.pointOfView({ lat: 38, lng: -97, altitude: 1.85 }, 0);

    // Snappier orbit controls (default damping feels laggy on dense polygons)
    const controls = globe.controls();
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 1.15;
    controls.zoomSpeed = 1.35;
    controls.panSpeed = 1.1;
    controls.minDistance = 120;
    controls.maxDistance = 500;

    // Flat lighting — no specular hotspots on the ocean
    const ambient = new THREE.AmbientLight(0xffffff, 1.05);
    globe.lights([ambient]);
  }, [size.w]);

  // Fly toward a selected person
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !personSelection) return;
    const stay = currentStay(personSelection);
    if (!stay) return;
    globe.pointOfView({ lat: stay.lat, lng: stay.lng, altitude: 1.35 }, 600);
  }, [personSelection]);

  const selectPlace = useCallback((selection: PlaceSelection) => {
    setPersonSelection(null);
    setPlaceSelection(selection);
  }, []);

  const selectPerson = useCallback((person: AtlasPerson) => {
    setPersonSelection(person);
  }, []);

  // After a place/person opens, scroll the detail panel into view (sticky nav offset)
  useEffect(() => {
    if (!placeSelection && !personSelection) return;
    const id = window.setTimeout(() => {
      document
        .getElementById('atlas-selection')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
    return () => window.clearTimeout(id);
    // Intentionally key off labels/ids so photo refresh doesn't re-scroll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeSelection?.placeLabel, personSelection?.id]);

  const onPolygonClick = useCallback(
    (poly: object) => {
      const p = poly as GlobePolygon;
      const name = p.properties?.name;
      if (!name) return;
      selectPlace(peopleAtPlaceSelection(people, name, p.properties.region));
    },
    [people, selectPlace],
  );

  const buildClusterElement = useCallback(
    (cluster: HtmlCluster) => {
      const wrap = document.createElement('div');
      wrap.style.pointerEvents = 'auto';
      wrap.style.cursor = 'pointer';
      wrap.style.transform = 'translate(-50%, -50%)';

      const r = cluster.people.length > 6 ? 14 : cluster.people.length > 3 ? 16 : 18;
      const spread =
        cluster.people.length > 6 ? 22 : cluster.people.length > 3 ? 20 : 18;
      const offsets = clumpOffsets(cluster.people.length, spread);
      const size = spread * 2 + r * 2 + 8;
      wrap.style.width = `${size}px`;
      wrap.style.height = `${size}px`;
      wrap.style.position = 'relative';

      const selected = placeSelection?.placeLabel === cluster.placeLabel;

      cluster.people.forEach((person, i) => {
        const offset = offsets[i] ?? { x: 0, y: 0 };
        const color = colorById.get(person.id) ?? MAP.ink;
        const node = document.createElement('button');
        node.type = 'button';
        node.title = person.displayName;
        node.style.position = 'absolute';
        node.style.left = `calc(50% + ${offset.x}px)`;
        node.style.top = `calc(50% + ${offset.y}px)`;
        node.style.width = `${r * 2}px`;
        node.style.height = `${r * 2}px`;
        node.style.marginLeft = `-${r}px`;
        node.style.marginTop = `-${r}px`;
        node.style.borderRadius = '9999px';
        node.style.padding = '0';
        node.style.border = `${selected ? 2.5 : 2}px solid ${color}`;
        node.style.backgroundImage = `url(${person.profileImageUrl})`;
        node.style.backgroundSize = 'cover';
        node.style.backgroundPosition = 'center';
        node.style.boxShadow = '0 1px 4px rgba(20,18,16,0.25)';
        node.style.cursor = 'pointer';
        node.addEventListener('click', (e) => {
          e.stopPropagation();
          selectPerson(person);
        });
        wrap.appendChild(node);
      });

      wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        selectPlace(
          peopleAtPlaceSelection(
            people,
            cluster.placeLabel,
            cluster.region,
          ),
        );
      });

      return wrap;
    },
    [
      colorById,
      people,
      placeSelection?.placeLabel,
      selectPerson,
      selectPlace,
    ],
  );

  const emphasizedId = personSelection?.id ?? null;

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative aspect-[4/3] w-full overflow-hidden border border-wedding-ink/10 bg-[#ebe4d8] sm:aspect-[16/10]"
      >
        {size.w > 0 && size.h > 0 ? (
          <Globe
            ref={globeRef}
            width={size.w}
            height={size.h}
            backgroundColor="rgba(0,0,0,0)"
            showAtmosphere
            atmosphereColor={MAP.atmosphere}
            atmosphereAltitude={0.15}
            globeImageUrl={null}
            bumpImageUrl={null}
            globeMaterial={oceanMaterial}
            polygonsData={polygons}
            polygonGeoJsonGeometry="geometry"
            animateIn={false}
            rendererConfig={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
            }}
            polygonCapColor={(d: object) => {
              const name = (d as GlobePolygon).properties.name;
              if (placeSelection?.placeLabel === name) return MAP.landActive;
              if (occupied.has(name)) return MAP.land;
              return MAP.landEmpty;
            }}
            polygonSideColor={() => 'rgba(138,127,114,0.25)'}
            polygonStrokeColor={() => MAP.stroke}
            polygonAltitude={(d: object) =>
              placeSelection?.placeLabel ===
              (d as GlobePolygon).properties.name
                ? ALT.landSelected
                : ALT.land
            }
            polygonsTransitionDuration={0}
            onPolygonClick={onPolygonClick}
            pathsData={paths}
            pathPoints="points"
            pathPointLat="lat"
            pathPointLng="lng"
            pathPointAlt="alt"
            pathColor={(d: object) => {
              const path = d as PathDatum;
              if (emphasizedId != null && emphasizedId !== path.personId) {
                return `${path.color}40`;
              }
              return path.color;
            }}
            // Fat Line2 strokes are screen pixels (constant across zoom)
            pathStroke={(d: object) =>
              emphasizedId != null &&
              emphasizedId === (d as PathDatum).personId
                ? 3
                : 2
            }
            pathResolution={2}
            pathTransitionDuration={0}
            pointsData={pastNodes}
            pointLat="lat"
            pointLng="lng"
            pointAltitude={ALT.node}
            pointRadius={0.18}
            pointColor={(d: object) => {
              const node = d as NodeDatum;
              if (emphasizedId != null && emphasizedId !== node.personId) {
                return `${node.color}40`;
              }
              return node.color;
            }}
            pointsMerge={false}
            htmlElementsData={clusters}
            htmlLat="lat"
            htmlLng="lng"
            htmlAltitude={ALT.avatar}
            htmlElement={(d: object) => buildClusterElement(d as HtmlCluster)}
            htmlElementVisibilityModifier={(el: HTMLElement, visible: boolean) => {
              el.style.opacity = visible ? '1' : '0';
              el.style.pointerEvents = visible ? 'auto' : 'none';
            }}
          />
        ) : null}

        <p className="pointer-events-none absolute left-3 top-3 z-10 text-[10px] uppercase tracking-[0.18em] text-wedding-stone">
          Drag to spin · scroll to zoom
        </p>
      </div>

      {personSelection ? (
        <div id="atlas-selection" className="scroll-mt-24">
          <PersonDetail
            person={personSelection}
            color={colorById.get(personSelection.id) ?? MAP.ink}
            onBack={() => setPersonSelection(null)}
            onClose={() => {
              setPersonSelection(null);
              setPlaceSelection(null);
            }}
          />
        </div>
      ) : placeSelection ? (
        <div id="atlas-selection" className="scroll-mt-24">
          <PlaceDetail
            selection={placeSelection}
            colorById={colorById}
            viewerPersonId={viewerPersonId}
            canUpload={viewerLivedHere}
            onClose={() => setPlaceSelection(null)}
            onSelectPerson={selectPerson}
            onPhotoUploaded={onPeopleChanged}
          />
        </div>
      ) : (
        <p className="text-sm text-wedding-stone">
          Drag the globe, zoom into a place, and click a state or country to see
          who’s there. Lived there? You can attach a photo. Each guest has a
          color — matching ring and path.
        </p>
      )}
    </div>
  );
}
