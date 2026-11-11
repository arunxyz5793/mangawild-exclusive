/**
 * Cloudflare Pages Functions catch-all API route (/functions/api/[[route]].js)
 * Automatically enables R2 Bucket Bindings (MANGAWILD_BUCKET) on Cloudflare Pages deployments.
 */
import { handleApiRequest } from '../../cloudflare-worker.js';

export async function onRequest(context) {
  const response = await handleApiRequest(context.request, context.env);
  if (response) return response;
  return new Response(JSON.stringify({ error: 'API route not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}
