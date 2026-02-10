// Simple geocoding helpers for prototype use.
// - reverseGeocode: lat/lng -> human readable address
// - geocode: free text (e.g., station name) -> lat/lng
//
// NOTE: This uses OpenStreetMap Nominatim. For production, you should:
// - add your own proxy to comply with usage policy and rate limits
// - add caching + backoff
// - add a stable provider and SLA

export type GeocodeResult = {
  displayName: string;
  lat: number;
  lng: number;
};

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

function buildHeaders() {
  // Nominatim recommends providing a valid User-Agent / Referer.
  // Browsers restrict setting User-Agent, so we use a descriptive header.
  return {
    'Accept': 'application/json',
    'Accept-Language': 'ja',
    // This is a harmless hint; real compliance should be handled via server proxy.
    'X-Requested-With': 'NowGo-Prototype',
  } as Record<string, string>;
}

export async function reverseGeocode(lat: number, lng: number, signal?: AbortSignal): Promise<string> {
  const url = new URL(`${NOMINATIM_BASE}/reverse`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('zoom', '18');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(),
    signal,
  });
  if (!res.ok) throw new Error(`reverseGeocode failed: ${res.status}`);
  const data = (await res.json()) as any;
  return (data?.display_name as string) || '';
}

export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '1');
  url.searchParams.set('accept-language', 'ja');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: buildHeaders(),
    signal,
  });
  if (!res.ok) throw new Error(`geocode failed: ${res.status}`);
  const list = (await res.json()) as any[];
  const first = list?.[0];
  if (!first) return null;

  return {
    displayName: String(first.display_name || q),
    lat: Number(first.lat),
    lng: Number(first.lon),
  };
}
