
import React, { useEffect, useRef } from 'react';
import { GPSPoint, DetectedStay, StopMaster } from '../types';

declare var L: any;

interface MapViewProps {
  points: GPSPoint[];
  confirmedStops: DetectedStay[];
  masters: StopMaster[];
}

const MapView: React.FC<MapViewProps> = ({ points, confirmedStops, masters }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const pathLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([26.2124, 127.6809], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
      
      markersGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }

    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    // マスタ地点の描画
    masters.forEach(m => {
      L.circleMarker([m.latitude, m.longitude], {
        radius: 12,
        fillColor: '#3b82f6',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.3
      }).addTo(markersGroup).bindPopup(`<b>停留所マスタ: ${m.name}</b>`);
    });

    // 走行ログの描画
    if (pathLayerRef.current) {
      map.removeLayer(pathLayerRef.current);
    }

    if (points.length > 0) {
      const latlngs = points.map(p => [p.latitude, p.longitude]);
      pathLayerRef.current = L.polyline(latlngs, {
        color: '#64748b',
        weight: 3,
        opacity: 0.7
      }).addTo(map);
      
      map.fitBounds(pathLayerRef.current.getBounds(), { padding: [50, 50] });
    }

    // 到着判定地点の描画
    confirmedStops.forEach(s => {
      L.circleMarker([s.latitude, s.longitude], {
        radius: 8,
        fillColor: '#ef4444',
        color: '#fff',
        weight: 2,
        fillOpacity: 1
      }).addTo(markersGroup).bindPopup(`
        <div style="font-family: sans-serif">
          <p style="font-weight:bold; color:#ef4444; margin:0">${s.matchedMasterName || '不明な停留所'}</p>
          <p style="font-size:12px; margin:4px 0 0 0">${s.durationMinutes.toFixed(1)}分滞在</p>
        </div>
      `);
    });

  }, [points, confirmedStops, masters]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          走行ルート・停留地点
        </h3>
        <span className="text-xs text-slate-500">
          {points.length > 0 ? `${points.length} 地点のログを表示中` : 'ログ未読込'}
        </span>
      </div>
      <div ref={mapContainerRef} className="w-full h-[450px] z-0" />
    </div>
  );
};

export default MapView;
