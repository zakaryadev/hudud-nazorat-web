import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Pt { latitude: number; longitude: number }
interface Props {
  value: Pt | null; // hudud markazi
  radiusM: number;
  onChange?: (p: Pt) => void; // berilmasa — faqat ko'rsatish rejimi
  me?: Pt | null; // xodimning joriy nuqtasi
  height?: number | string;
  round?: boolean;
}

const DEFAULT_CENTER: [number, number] = [42.4531, 59.6103];
const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Hudud markazi va radius doirasi. onChange bo'lsa xaritani bosib markazni tanlash mumkin.
// Ranglar brend tokenlaridan (--primary) olinadi.
export default function MapView({ value, radiusM, onChange, me, height = 260, round }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map>();
  const marker = useRef<L.CircleMarker>();
  const circle = useRef<L.Circle>();
  const meMarker = useRef<L.CircleMarker>();
  const cb = useRef(onChange);
  cb.current = onChange;
  const readOnly = !onChange;

  useEffect(() => {
    const m = L.map(el.current!, { zoomControl: false, attributionControl: true }).setView(DEFAULT_CENTER, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(m);
    if (!readOnly) m.on('click', (e) => cb.current?.({ latitude: e.latlng.lat, longitude: e.latlng.lng }));
    map.current = m;
    // Flex/sheet ichida o'lcham keyin aniqlanadi
    const ro = new ResizeObserver(() => map.current && m.invalidateSize({ animate: false }));
    ro.observe(el.current!);
    return () => {
      ro.disconnect();
      map.current = undefined;
      m.remove();
      marker.current = circle.current = meMarker.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !value) return;
    const ll: [number, number] = [value.latitude, value.longitude];
    const primary = cssVar('--primary') || '#006a6a';
    const first = !marker.current;
    if (first) {
      circle.current = L.circle(ll, { radius: radiusM, color: primary, fillColor: primary, fillOpacity: 0.16, weight: 2 }).addTo(m);
      marker.current = L.circleMarker(ll, { radius: 6, color: cssVar('--surface') || '#fff', weight: 3, fillColor: primary, fillOpacity: 1 }).addTo(m);
    } else {
      marker.current!.setLatLng(ll);
      circle.current!.setLatLng(ll).setRadius(radiusM);
    }

    if (me) {
      const mll: [number, number] = [me.latitude, me.longitude];
      const user = '#d9480f';
      if (!meMarker.current) {
        meMarker.current = L.circleMarker(mll, { radius: 8, color: cssVar('--surface') || '#fff', weight: 3, fillColor: user, fillOpacity: 1 }).addTo(m);
      } else {
        meMarker.current.setLatLng(mll);
      }
      m.fitBounds(circle.current!.getBounds().extend(mll), { padding: [28, 28], maxZoom: 18, animate: false });
    } else {
      meMarker.current?.remove();
      meMarker.current = undefined;
      if (first || readOnly) m.setView(ll, Math.max(readOnly ? 16 : m.getZoom(), 16), { animate: false });
    }
  }, [value, radiusM, me, readOnly]);

  return <div ref={el} className={`map ${round ? 'round' : ''}`} style={{ height }} />;
}
