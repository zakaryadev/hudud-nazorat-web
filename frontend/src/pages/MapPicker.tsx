import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  value: { latitude: number; longitude: number } | null;
  radiusM: number;
  onChange: (p: { latitude: number; longitude: number }) => void;
}

const DEFAULT_CENTER: [number, number] = [41.3111, 69.2797];

// Xaritada bosib hudud markazini tanlash; radius doira bilan ko'rsatiladi
export default function MapPicker({ value, radiusM, onChange }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map>();
  const marker = useRef<L.CircleMarker>();
  const circle = useRef<L.Circle>();
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const m = L.map(el.current!).setView(DEFAULT_CENTER, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(m);
    m.on('click', (e) => cb.current({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
    map.current = m;
    return () => { m.remove(); };
  }, []);

  useEffect(() => {
    const m = map.current!;
    if (!value) return;
    const ll: [number, number] = [value.latitude, value.longitude];
    if (!marker.current) {
      marker.current = L.circleMarker(ll, { radius: 6 }).addTo(m);
      circle.current = L.circle(ll, { radius: radiusM }).addTo(m);
      m.setView(ll, Math.max(m.getZoom(), 16));
    } else {
      marker.current.setLatLng(ll);
      circle.current!.setLatLng(ll).setRadius(radiusM);
    }
  }, [value, radiusM]);

  return <div ref={el} className="map" />;
}
