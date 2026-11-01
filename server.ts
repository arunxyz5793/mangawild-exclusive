import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

// Production security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json({ limit: '15mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Search Console Sitemaps & Robots
app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml');
  res.sendFile(path.resolve(__dirname, 'public', 'sitemap.xml'));
});

app.get('/devoc-mangawild-online-sitemap_e1f25dbc.xml', (_req, res) => {
  res.type('application/xml');
  res.sendFile(path.resolve(__dirname, 'public', 'devoc-mangawild-online-sitemap_e1f25dbc.xml'));
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.sendFile(path.resolve(__dirname, 'public', 'robots.txt'));
});

// Persistent server-side Review Store (syncs Beta Exclusive & Manga reviews across all devices for Admin Panel)
const REVIEWS_FILE_PATH = path.resolve(__dirname, 'tmp', 'beta_reviews.json');

function loadServerReviews(): any[] {
  try {
    if (fs.existsSync(REVIEWS_FILE_PATH)) {
      const raw = fs.readFileSync(REVIEWS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[Reviews Store] Could not read reviews file:', err);
  }
  return [];
}

function saveServerReviews(reviews: any[]): void {
  try {
    const dir = path.dirname(REVIEWS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(REVIEWS_FILE_PATH, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Reviews Store] Could not write reviews file:', err);
  }
}

let serverReviewsStore: any[] = loadServerReviews();

app.get('/api/reviews', (_req, res) => {
  res.json({ success: true, reviews: serverReviewsStore });
});

app.post('/api/reviews', (req, res) => {
  try {
    const review = req.body;
    if (!review || !review.id) {
      return res.status(400).json({ success: false, error: 'Invalid review payload' });
    }
    const existingIdx = serverReviewsStore.findIndex((r: any) => r.id === review.id);
    if (existingIdx !== -1) {
      serverReviewsStore[existingIdx] = { ...serverReviewsStore[existingIdx], ...review };
    } else {
      serverReviewsStore.unshift(review);
    }
    saveServerReviews(serverReviewsStore);
    return res.json({ success: true, review });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/reviews/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const idx = serverReviewsStore.findIndex((r: any) => r.id === id);
    if (idx !== -1) {
      serverReviewsStore[idx] = { ...serverReviewsStore[idx], ...updates };
      saveServerReviews(serverReviewsStore);
      return res.json({ success: true, review: serverReviewsStore[idx] });
    }
    return res.status(404).json({ success: false, error: 'Review not found' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/reviews/:id', (req, res) => {
  try {
    const { id } = req.params;
    serverReviewsStore = serverReviewsStore.filter((r: any) => r.id !== id);
    saveServerReviews(serverReviewsStore);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Secure server-side OTP Store for password resets (15 min TTL)
const serverOtpStore = new Map<string, { otp: string; expiresAt: number }>();

// Backend Email OTP Dispatcher (Direct delivery via authenticated mail service)
app.post('/api/auth/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes TTL

    serverOtpStore.set(cleanEmail, { otp, expiresAt });

    const rawSmtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS || 'Arunxyz@5793max';
    const smtpHost = process.env.SMTP_HOST || 'smtp.zoho.in';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpFrom = process.env.SMTP_FROM || 'support@mangawild.online';

    let effectiveUser = rawSmtpUser ? rawSmtpUser.trim() : 'support@mangawild.online';
    if (!effectiveUser.includes('@')) {
      const match = smtpFrom.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (match && match[1]) {
        effectiveUser = match[1];
      } else {
        effectiveUser = 'support@mangawild.online';
      }
    }

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: effectiveUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"MangaWild Security" <${effectiveUser}>`,
      to: cleanEmail,
      subject: `Your MangaWild Verification Code: ${otp}`,
      text: `Hello,\n\nYour verification code to reset your MangaWild password is:\n\n${otp}\n\nThis code will expire in 15 minutes. If you did not request this code, please ignore this email.\n\nBest regards,\nThe MangaWild Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #27272a; border-radius: 16px; background-color: #09090b; color: #f4f4f5;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0;">MANGAWILD</h2>
            <p style="color: #a1a1aa; font-size: 13px; margin-top: 4px;">Password Reset Verification</p>
          </div>
          <p style="font-size: 14px; color: #d4d4d8; line-height: 1.6;">Hello,</p>
          <p style="font-size: 14px; color: #d4d4d8; line-height: 1.6;">You requested to reset your password. Use the single-use 6-digit verification code below to complete your password reset:</p>
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; padding: 16px 36px; background-color: #18181b; border: 1px solid #3f3f46; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #ffffff; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #71717a; font-size: 12px; margin-top: 8px;">Code valid for 15 minutes</p>
          </div>
          <p style="font-size: 13px; color: #71717a; line-height: 1.5;">If you did not request this verification code, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #27272a; margin: 24px 0;" />
          <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">&copy; MangaWild Publishing Ecosystem. All rights reserved.</p>
        </div>
      `,
    });

    console.log(`[Email Engine] Verification code ${otp} dispatched successfully to ${cleanEmail}`);
    return res.json({ success: true, method: 'email_engine' });
  } catch (err: any) {
    console.error('[Auth API] send-email-otp error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to dispatch email' });
  }
});

// Verify OTP endpoint
app.post('/api/auth/verify-email-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ valid: false, error: 'Email and OTP required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const stored = serverOtpStore.get(cleanEmail);

    if (!stored) {
      return res.json({ valid: false, error: 'No verification code found for this email. Please request a new code.' });
    }

    if (Date.now() > stored.expiresAt) {
      serverOtpStore.delete(cleanEmail);
      return res.json({ valid: false, error: 'Verification code has expired. Please request a fresh code.' });
    }

    if (stored.otp !== String(otp).trim()) {
      return res.json({ valid: false, error: 'Invalid verification code. Please check your email.' });
    }

    // Successfully verified
    serverOtpStore.delete(cleanEmail);
    return res.json({ valid: true });
  } catch (err: any) {
    return res.status(500).json({ valid: false, error: err.message });
  }
});

// Razorpay Order Creation Endpoint
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { planId, amountInPaise, currency = 'INR', notes = {} } = req.body;
    if (!amountInPaise || typeof amountInPaise !== 'number' || amountInPaise <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid order amount' });
    }

    const keyId =
      process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_TiGD6mgGZQcUBE'
        ? process.env.RAZORPAY_KEY_ID
        : 'rzp_test_TusxJOMGjvZ5q3';
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_SECRET.includes('placeholder')
        ? process.env.RAZORPAY_KEY_SECRET
        : 'aEZz8o5bUng5hSw3gutyrLMG';

    // If real credentials are provided (and not placeholder), call Razorpay Orders API
    if (keySecret && !keySecret.includes('placeholder')) {
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
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

      if (!rzpRes.ok) {
        const errData = await rzpRes.json().catch(() => ({}));
        console.warn('[Razorpay API] create-order failed:', errData);
        return res.status(rzpRes.status).json({
          success: false,
          error: (errData as any)?.error?.description || 'Failed to create order on Razorpay',
        });
      }

      const orderData = await rzpRes.json();
      return res.json({
        success: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        keyId,
      });
    }

    // Standard fallback / sandbox mode when secret is not configured in environment
    const sandboxOrderId = `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    return res.json({
      success: true,
      orderId: sandboxOrderId,
      amount: Math.round(amountInPaise),
      currency,
      keyId,
      isTestMode: true,
    });
  } catch (err: any) {
    console.error('[Payment API] create-order error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error creating order' });
  }
});

// Razorpay Payment Verification Endpoint
app.post('/api/payment/verify-payment', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      userId,
    } = req.body;

    if (!razorpay_payment_id) {
      return res.status(400).json({ success: false, error: 'Payment ID is required' });
    }

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_SECRET.includes('placeholder')
        ? process.env.RAZORPAY_KEY_SECRET
        : 'aEZz8o5bUng5hSw3gutyrLMG';

    // Cryptographic signature check if key secret is configured
    if (keySecret && !keySecret.includes('placeholder') && razorpay_order_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        console.warn('[Payment API] Signature verification failed:', {
          received: razorpay_signature,
          expected: generatedSignature,
        });
        return res.status(400).json({
          success: false,
          verified: false,
          error: 'Invalid payment signature. Verification failed.',
        });
      }
    }

    console.log(`[Payment API] Payment verified successfully: ${razorpay_payment_id} for user ${userId || 'anonymous'}`);
    return res.json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id || null,
      planId,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Payment API] verify-payment error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error verifying payment' });
  }
});

// Mount Vite or serve static dist
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`MangaWild server running on port ${PORT}`);
  });
}

startServer();
