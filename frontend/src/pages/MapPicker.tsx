import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Pt {
  latitude: number;
  longitude: number;
}
interface Props {
  value: Pt | null; // hudud markazi
  radiusM: number;
  onChange?: (p: Pt) => void; // berilmasa — faqat ko'rsatish rejimi
  me?: Pt | null; // xodimning joriy nuqtasi
  height?: number;
}

const DEFAULT_CENTER: [number, number] = [41.3111, 69.2797];

// Xaritada hudud markazi va radius doirasi; onChange bo'lsa bosib markazni tanlash mumkin
export default function MapPicker({ value, radiusM, onChange, me, height = 260 }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map>();
  const marker = useRef<L.CircleMarker>();
  const circle = useRef<L.Circle>();
  const meMarker = useRef<L.CircleMarker>();
  const cb = useRef(onChange);
  cb.current = onChange;
  const readOnly = !onChange;

  useEffect(() => {
    const m = L.map(el.current!).setView(DEFAULT_CENTER, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(m);
    if (!readOnly) {
      m.on('click', (e) => cb.current?.({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
    }
    map.current = m;
    return () => {
      m.remove();
      marker.current = circle.current = meMarker.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current!;
    if (!value) return;
    const ll: [number, number] = [value.latitude, value.longitude];
    const first = !marker.current;
    if (first) {
      marker.current = L.circleMarker(ll, { radius: 6 }).addTo(m);
      circle.current = L.circle(ll, { radius: radiusM }).addTo(m);
    } else {
      marker.current!.setLatLng(ll);
      circle.current!.setLatLng(ll).setRadius(radiusM);
    }

    if (me) {
      const mll: [number, number] = [me.latitude, me.longitude];
      if (!meMarker.current) {
        meMarker.current = L.circleMarker(mll, { radius: 7, color: '#d9480f', fillColor: '#d9480f', fillOpacity: 0.9 }).addTo(m);
      } else {
        meMarker.current.setLatLng(mll);
      }
      m.fitBounds(circle.current!.getBounds().extend(mll), { padding: [24, 24], maxZoom: 18 });
    } else {
      meMarker.current?.remove();
      meMarker.current = undefined;
      if (first || readOnly) m.setView(ll, Math.max(readOnly ? 16 : m.getZoom(), 16));
    }
  }, [value, radiusM, me, readOnly]);

  return <div ref={el} className="map" style={{ height }} />;
}
