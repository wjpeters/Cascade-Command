import { transform } from 'esbuild';

export async function browserFile(bytes, filename) {
  const loader = filename.endsWith('.js') ? 'js' : filename.endsWith('.css') ? 'css' : null;
  if (!loader) return bytes;
  const source = bytes.toString('utf8');
  // Preserve the QR library's original copyright, MIT license and trademark notice.
  const notice = filename.endsWith('/vendor/qrcode.js') ? source.slice(0, source.indexOf('\n\n')) + '\n' : '';
  const result = await transform(source, { loader, minify: true, target: 'es2022', legalComments: 'eof' });
  return Buffer.from(notice + result.code);
}
