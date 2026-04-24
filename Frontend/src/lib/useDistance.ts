// src/lib/useDistance.ts
// Calculates real road distance using OSRM (free, no API key needed)

import { useState, useCallback } from "react";

export interface DistanceResult {
  pg_id: number;
  distance_km: number | null;
  duration_min: number | null;
}

// Add this above the geocodeAddress function
const KNOWN_COLLEGES: Record<string, [number, number]> = {
  "gla university": [27.605837, 77.594537],
  "gla university mathura": [27.605837, 77.594537],
  "gla university chaumuhan mathura": [27.605837, 77.594537],
};

// Update geocodeAddress to check fallback first:
export const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  // Check known colleges first
  const key = address.toLowerCase().trim();
  if (KNOWN_COLLEGES[key]) return KNOWN_COLLEGES[key];

  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=in`,
      {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "PGLens/1.0 (pglens.vercel.app)"
        }
      }
    );
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {
    return null;
  }
};

// Get road distance between two lat/lng points using OSRM
export const getRoadDistance = async (
  from: [number, number],
  to: [number, number]
): Promise<{ distance_km: number; duration_min: number } | null> => {
  try {
    const [fromLat, fromLng] = from;
    const [toLat, toLng] = to;
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    const route = data.routes[0];
    return {
      distance_km: parseFloat((route.distance / 1000).toFixed(1)),
      duration_min: Math.round(route.duration / 60),
    };
  } catch {
    return null;
  }
};

// Hook — call this from Explore.tsx
export const useDistance = () => {
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [distances, setDistances] = useState<Record<number, DistanceResult>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDistances = useCallback(async (
    address: string,
    pgs: { id: number; latitude: number | null; longitude: number | null }[]
  ) => {
    setLoading(true);
    setError(null);
    setDistances({});

    const coords = await geocodeAddress(address);
    if (!coords) {
      setError("Could not find this location. Try a more specific address.");
      setLoading(false);
      return;
    }
    setOriginCoords(coords);

    // Filter only PGs that have coordinates stored
    const pgsWithCoords = pgs.filter(pg => pg.latitude && pg.longitude);

    // Calculate in batches of 5 to avoid rate limiting
    const results: Record<number, DistanceResult> = {};
    const batchSize = 5;

    for (let i = 0; i < pgsWithCoords.length; i += batchSize) {
      const batch = pgsWithCoords.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (pg) => {
          const result = await getRoadDistance(coords, [pg.latitude!, pg.longitude!]);
          results[pg.id] = {
            pg_id: pg.id,
            distance_km: result?.distance_km ?? null,
            duration_min: result?.duration_min ?? null,
          };
        })
      );
    }

    setDistances(results);
    setLoading(false);
  }, []);

  const clearDistances = useCallback(() => {
    setOriginCoords(null);
    setDistances({});
    setError(null);
  }, []);

  return { distances, loading, error, originCoords, calculateDistances, clearDistances };
};