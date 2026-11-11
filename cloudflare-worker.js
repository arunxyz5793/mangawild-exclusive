/**
 * MangaWild - Cloudflare Worker Entry Point (with R2 Storage & Live Razorpay API)
 * Enables R2 Bucket Bindings (MANGAWILD_BUCKET) alongside Vite static assets (./dist).
 */

const LIVE_RAZORPAY_KEY_ID = 'rzp_live_TyPIbdkIBH1OQU';
const LIVE_RAZORPAY_KEY_SECRET = '7WeAPfio4L9TovzXk5bFBsvP';

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...extraHeaders,
    },
  });
}

async function computeHmacSha256Hex(secret, message) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function parseDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1];
  const base64 = match[2];
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return { contentType, bytes };
}

export async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true }, 200);
  }

  // 1. Health check
  if (pathname === '/api/health') {
    return jsonResponse({
      status: 'ok',
      runtime: 'cloudflare-worker',
      r2Connected: Boolean(env && env.MANGAWILD_BUCKET),
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Cloudflare R2 Upload Endpoint (/api/r2/upload)
  if (pathname === '/api/r2/upload' && request.method === 'POST') {
    if (!env || !env.MANGAWILD_BUCKET) {
      return jsonResponse(
        {
          success: false,
          error: 'R2 Bucket binding (MANGAWILD_BUCKET) is not configured yet.',
        },
        503
      );
    }

    try {
      const contentTypeHeader = request.headers.get('content-type') || '';
      let fileBytes = null;
      let mimeType = 'image/jpeg';
      let folder = 'uploads';
      let rawName = 'image.jpg';

      if (contentTypeHeader.includes('multipart/form-data')) {
        const formData = await request.formData();
        const file = formData.get('file');
        folder = String(formData.get('folder') || 'uploads');
        if (!file || typeof file === 'string') {
          return jsonResponse({ success: false, error: 'Missing file in form data' }, 400);
        }
        rawName = file.name || 'image.jpg';
        mimeType = file.type || 'image/jpeg';
        fileBytes = await file.arrayBuffer();
      } else {
        const body = await request.json();
        folder = String(body.folder || 'uploads').replace(/[^a-zA-Z0-9_-]/g, '');
        rawName = String(body.fileName || 'image.jpg');
        if (!body.dataUrl) {
          return jsonResponse({ success: false, error: 'Missing dataUrl payload' }, 400);
        }
        const parsed = parseDataUrl(body.dataUrl);
        if (!parsed) {
          return jsonResponse({ success: false, error: 'Invalid base64 dataUrl format' }, 400);
        }
        mimeType = body.contentType || parsed.contentType || 'image/jpeg';
        fileBytes = parsed.bytes.buffer;
      }

      const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueKey = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;

      await env.MANGAWILD_BUCKET.put(uniqueKey, fileBytes, {
        httpMetadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });

      const publicBase = env.R2_PUBLIC_URL ? String(env.R2_PUBLIC_URL).replace(/\/$/, '') : '';
      const fileUrl = publicBase ? `${publicBase}/${uniqueKey}` : `/api/r2/file/${uniqueKey}`;

      return jsonResponse({
        success: true,
        key: uniqueKey,
        url: fileUrl,
      });
    } catch (err) {
      return jsonResponse(
        { success: false, error: err?.message || 'Failed to upload file to R2' },
        500
      );
    }
  }

  // 3. Cloudflare R2 File Serve Endpoint (/api/r2/file/*)
  if (pathname.startsWith('/api/r2/file/') && request.method === 'GET') {
    if (!env || !env.MANGAWILD_BUCKET) {
      return new Response('R2 Bucket binding not configured', { status: 404 });
    }
    const key = decodeURIComponent(pathname.replace(/^\/api\/r2\/file\//, ''));
    if (!key) {
      return new Response('Missing file key', { status: 400 });
    }

    const object = await env.MANGAWILD_BUCKET.get(key);
    if (!object) {
      return new Response('File not found in R2', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'image/jpeg');
    }
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(object.body, { headers });
  }

  // 4. Razorpay Live Order Creation (/api/payment/create-order)
  if (pathname === '/api/payment/create-order' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { planId, amountInPaise, currency = 'INR', notes = {} } = body;

      if (!amountInPaise || typeof amountInPaise !== 'number' || amountInPaise <= 0) {
        return jsonResponse({ success: false, error: 'Invalid order amount' }, 400);
      }

      const keyId =
        env?.RAZORPAY_KEY_ID && String(env.RAZORPAY_KEY_ID).startsWith('rzp_live_')
          ? env.RAZORPAY_KEY_ID
          : LIVE_RAZORPAY_KEY_ID;
      const keySecret = env?.RAZORPAY_KEY_SECRET || LIVE_RAZORPAY_KEY_SECRET;

      const authHeader = 'Basic ' + btoa(`${keyId}:${keySecret}`);
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: Math.round(amountInPaise),
          currency,
          receipt: `rcpt_${Date.now().toString(36)}`,
          notes: {
            ...notes,
            planId: planId || 'vip_pass',
          },
        }),
      });

      const orderData = await rzpRes.json().catch(() => ({}));
      if (!rzpRes.ok) {
        return jsonResponse(
          {
            success: false,
            error: orderData?.error?.description || 'Failed to create order on Razorpay',
          },
          rzpRes.status
        );
      }

      return jsonResponse({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId,
      });
    } catch (err) {
      return jsonResponse(
        { success: false, error: err?.message || 'Server error creating order' },
        500
      );
    }
  }

  // 5. Razorpay Live Payment Signature Verification (/api/payment/verify-payment)
  if (pathname === '/api/payment/verify-payment' && request.method === 'POST') {
    try {
      const body = await request.json();
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = body;

      if (!razorpay_payment_id) {
        return jsonResponse({ success: false, error: 'Payment ID is required' }, 400);
      }

      const keySecret = env?.RAZORPAY_KEY_SECRET || LIVE_RAZORPAY_KEY_SECRET;

      if (razorpay_order_id && razorpay_signature) {
        const expectedSig = await computeHmacSha256Hex(
          keySecret,
          `${razorpay_order_id}|${razorpay_payment_id}`
        );
        if (expectedSig !== razorpay_signature) {
          return jsonResponse(
            {
              success: false,
              verified: false,
              error: 'Invalid payment signature. Verification failed.',
            },
            400
          );
        }
      }

      return jsonResponse({
        success: true,
        verified: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id || null,
        planId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return jsonResponse(
        { success: false, error: err?.message || 'Server error verifying payment' },
        500
      );
    }
  }

  // 6. Reviews fallback on Edge
  if (pathname.startsWith('/api/reviews')) {
    return jsonResponse({ success: true, reviews: [] });
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      const apiRes = await handleApiRequest(request, env);
      if (apiRes) return apiRes;
      return jsonResponse({ error: 'API route not found' }, 404);
    }

    // Serve static frontend assets built by Vite (./dist)
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('MangaWild Worker Active', { status: 200 });
  },
};
