export interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export class GeoError extends Error {
  constructor(message: string, public denied = false) {
    super(message);
  }
}

export function getPosition(): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new GeoError("Brauzer GPS'ni qo'llamaydi"));
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
        }),
      (e) =>
        reject(
          new GeoError(
            e.code === e.PERMISSION_DENIED
              ? 'GPS ruxsati berilmagan.'
              : e.code === e.TIMEOUT
                ? 'GPS javob bermadi, qayta urinib ko‘ring.'
                : 'Joylashuvni aniqlab bo‘lmadi.',
            e.code === e.PERMISSION_DENIED,
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

// Mijoz tomonida taxminiy ko'rsatish uchun (yakuniy tekshiruv serverda)
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Rasmni yuklashdan oldin kichraytirish (telefon kamerasi 5-10 MB beradi)
export async function compressImage(file: File, maxSide = 1280, quality = 0.8): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Rasmni qayta ishlab bo‘lmadi'))), 'image/jpeg', quality),
  );
}
