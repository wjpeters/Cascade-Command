export class StorageError extends Error {
  constructor(message, status = 400, fields, retryAfter, code) {
    super(message); Object.assign(this, { status, fields, retryAfter, code });
  }
}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const json = (status, body, headers = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
export function errorResponse(error) {
  if (error.name === 'StorageConfigurationError') {
    console.error('Cascade configuratiefout:', error.message);
    return json(503, { error: 'De opslag is nog niet ingesteld. Vraag de organisator om de serverconfiguratie te controleren.', code: 'STORAGE_CONFIGURATION_ERROR' });
  }
  if (error instanceof StorageError) return json(error.status, { error: error.message, ...(error.fields ? { fields: error.fields } : {}), ...(error.code ? { code: error.code } : {}) }, error.retryAfter ? { 'Retry-After': error.retryAfter } : {});
  // Never print upstream errors, requests, tokens or contact bodies.
  console.error('Cascade opslag niet beschikbaar.');
  return json(503, { error: 'De opslag is even niet bereikbaar. Je invoer blijft staan; probeer het opnieuw.' });
}
export async function readBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new StorageError('Gebruik JSON voor de spelgegevens.', 415);
  if (Number(request.headers.get('content-length')) > 160000) throw new StorageError('Te veel gegevens.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new StorageError('Ongeldige invoer.');
  const decoder = new TextDecoder(); let text = '', size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 160000) { await reader.cancel(); throw new StorageError('Te veel gegevens.', 413); }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  let data; try { data = JSON.parse(text); } catch { throw new StorageError('Ongeldige invoer.'); }
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new StorageError('Ongeldige invoer.');
  return data;
}
export function validDay(day) {
  return typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day + 'T12:00:00Z')) && new Date(day + 'T12:00:00Z').toISOString().slice(0, 10) === day;
}
