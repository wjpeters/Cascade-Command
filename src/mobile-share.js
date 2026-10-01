// Keep the share URL and QR payload together so they cannot diverge.
export async function renderMobileShare(url) {
  const image = document.getElementById('mobile-qr');
  const link = document.getElementById('mobile-url');
  const hint = document.getElementById('mobile-qr-hint');
  const copy = document.getElementById('copy-url');
  image.hidden = true;
  image.removeAttribute('src');
  link.removeAttribute('href');
  link.textContent = url || 'Geen lokaal netwerkadres gevonden.';
  copy.disabled = !url;
  copy.textContent = 'Kopieer adres';
  if (!url) {
    hint.textContent = 'Verbind de Mac met wifi en open dit venster opnieuw.';
    return;
  }
  link.href = url;
  hint.textContent = 'QR-code wordt klaargezet…';
  try {
    const { default: qrcode } = await import('/vendor/qrcode.js');
    const qr = qrcode(0, 'M');
    qr.addData(url, 'Byte');
    qr.make();
    // Four clear modules surround the code, for reliable camera detection.
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qr.createSvgTag({ cellSize: 8, margin: 32 }));
    image.alt = 'Scan deze QR-code om Cascade Command te openen op ' + url;
    image.hidden = false;
    hint.textContent = 'Scan met de camera van je telefoon.';
  } catch {
    hint.textContent = 'De QR-code kon niet laden. Gebruik het adres hieronder.';
  }
}
