import { useCallback, useEffect, useRef, useState } from 'react';
import { GeoError, getPosition, Position } from './geo';

/** Ro'yxat yuklash: data / error / loading va qayta yuklash */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const load = useCallback(() => {
    const id = ++seq.current;
    setLoading(true);
    setError('');
    fn()
      .then((d) => id === seq.current && setData(d))
      .catch((e) => id === seq.current && setError((e as Error).message))
      .finally(() => id === seq.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(load, [load]);
  return { data, error, loading, reload: load, setData };
}

/** GPS: aniqlash, xato va "ruxsat rad etilgan" holati */
export function useGps(auto = false) {
  const [pos, setPos] = useState<Position | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [denied, setDenied] = useState(false);
  const locate = useCallback(async () => {
    setBusy(true);
    setError('');
    setDenied(false);
    try {
      setPos(await getPosition());
    } catch (e) {
      setError((e as Error).message);
      setDenied(e instanceof GeoError && e.denied);
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    if (auto) locate();
  }, [auto, locate]);
  return { pos, busy, error, denied, locate, reset: () => setPos(null) };
}

/** Brauzer ruxsati holati so'ramasdan: granted / prompt / denied / unknown */
export function useGeoPermission() {
  const [state, setState] = useState<'granted' | 'prompt' | 'denied' | 'unknown'>('unknown');
  useEffect(() => {
    let status: PermissionStatus | undefined;
    navigator.permissions
      ?.query({ name: 'geolocation' as PermissionName })
      .then((s) => {
        status = s;
        setState(s.state as 'granted' | 'prompt' | 'denied');
        s.onchange = () => setState(s.state as 'granted' | 'prompt' | 'denied');
      })
      .catch(() => {});
    return () => {
      if (status) status.onchange = null;
    };
  }, []);
  return state;
}

/** Rasm tanlash: oldindan ko'rish va yuklangan URL keshi (qayta urinishda qayta yuklanmaydi) */
export function usePhoto() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const uploaded = useRef<{ file: File; url: string } | null>(null);
  useEffect(() => {
    if (!file) return setPreview('');
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return { file, setFile, preview, uploaded, clear: () => { setFile(null); uploaded.current = null; } };
}
