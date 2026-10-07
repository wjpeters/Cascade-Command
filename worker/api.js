import { storageConfig } from '../storage/config.js';
import { djangoStorage } from '../storage/django.js';
import { hostedLegacyStorage } from '../storage/legacy-hosted.js';
import { handleGameApi } from '../storage/game-api.js';
import { errorResponse } from '../storage/http.js';
import { handleAdmin, hostedAdmin } from '../admin/api.js';
import { adminStorage } from './admin-storage.js';

export async function handleApi(request, env) {
  try {
    const config = storageConfig(env), url = new URL(request.url);
    if (config.backend === 'legacy' && url.pathname.startsWith('/api/admin/')) return handleAdmin(request, () => adminStorage(env), hostedAdmin(request, env));
    const store = config.backend === 'django' ? djangoStorage(config) : hostedLegacyStorage(env);
    return handleGameApi(request, store, { hosting: 'sites', mobileUrls: [url.origin + '/'] });
  } catch (error) { return errorResponse(error); }
}
