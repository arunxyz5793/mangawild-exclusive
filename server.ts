import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

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
