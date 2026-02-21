'use client';

import { useEffect, useRef } from 'react';
import type { PlanSpot } from '@/hooks/useNowgoStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PlanMapProps {
  spots: PlanSpot[];
  currentLocation?: { lat: number; lng: number } | null;
  className?: string;
}

export function PlanMap({ spots, currentLocation, className = '' }: PlanMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || spots.length === 0) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    });
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const allPoints: L.LatLng[] = [];

    // 現在地マーカー
    if (currentLocation?.lat && currentLocation?.lng) {
      const locLatlng = L.latLng(currentLocation.lat, currentLocation.lng);
      allPoints.push(locLatlng);

      const locIcon = L.divIcon({
        className: 'current-location-marker',
        html: `<div style="
          width: 14px; height: 14px;
          background: #3b82f6;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 2px #3b82f6, 0 0 12px rgba(59,130,246,0.4);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker(locLatlng, { icon: locIcon })
        .addTo(map)
        .bindPopup('<b>現在地</b>');
    }

    // スポットマーカー
    spots.forEach((spot, index) => {
      if (!spot.lat || !spot.lng) return;
      const latlng = L.latLng(spot.lat, spot.lng);
      allPoints.push(latlng);

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 28px; height: 28px;
          background: ${index === 0 ? '#2563eb' : '#6b7280'};
          color: white;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 2px solid white;
        ">${index + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker(latlng, { icon })
        .addTo(map)
        .bindPopup(`<b>${spot.name}</b><br/>${spot.category} · ${spot.duration}分`);
    });

    // スポット間をラインで接続
    const spotPoints = allPoints.slice(currentLocation?.lat ? 1 : 0);
    if (spotPoints.length > 1) {
      L.polyline(spotPoints, {
        color: '#2563eb',
        weight: 2,
        opacity: 0.4,
        dashArray: '6, 8',
      }).addTo(map);
    }

    // 全ポイントが見えるようにフィット
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [spots, currentLocation]);

  return (
    <div className={`rounded-2xl overflow-hidden ring-1 ring-gray-100 shadow-sm ${className}`}>
      <div ref={mapRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
}
