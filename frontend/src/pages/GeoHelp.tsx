// GPS ruxsati rad etilganda ko'rsatiladigan yo'riqnoma
export default function GeoHelp() {
  return (
    <div className="alert warn small">
      <strong>Joylashuvga ruxsat bering</strong>
      <ol>
        <li>Brauzer manzil satridagi 🔒 belgisini bosing → <em>Joylashuv</em> → <em>Ruxsat berish</em>, so‘ng sahifani yangilang.</li>
        <li>Telefonda <em>Joylashuv (GPS)</em> xizmati yoqilgan bo‘lishi kerak.</li>
        <li>Kamera ochilmasa, shu yerda <em>Kamera</em> ruxsatini ham yoqing.</li>
      </ol>
    </div>
  );
}
