require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'support@aerieintelligence.com';
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'Aerie Website <onboarding@resend.dev>';

const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
    'https://aerieintelligence.com,https://www.aerieintelligence.com'
).split(',').map((s) => s.trim()).filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // no origin = same-origin/non-browser request (curl, health checks, etc.)
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    }
}));
app.use(express.json({ limit: '20kb' }));

const SERVICE_LABELS = {
    'app-dev': 'App & Website Development',
    'data': 'Data Analytics & Dashboards',
    'ai': 'AI & Intelligent Solutions',
    'strategy': 'Digital Strategy Consulting',
    'multiple': 'Multiple Services'
};

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// In-memory per-IP rate limit. Resets on restart — fine for a low-volume contact form;
// swap for a shared store (e.g. Redis) if this ever runs on more than one instance.
const submissionsByIp = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip) {
    const now = Date.now();
    const recent = (submissionsByIp.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    recent.push(now);
    submissionsByIp.set(ip, recent);
    return recent.length > RATE_LIMIT_MAX;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/contact', async (req, res) => {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
    if (isRateLimited(ip)) {
        return res.status(429).json({ ok: false, error: 'Too many submissions. Please try again later.' });
    }

    const { name, email, service, message, website } = req.body || {};

    // Honeypot: a hidden field real visitors never fill in. Silently accept so bots don't learn.
    if (website) {
        return res.json({ ok: true });
    }

    if (!name || !email || !message) {
        return res.status(400).json({ ok: false, error: 'Name, email, and message are required.' });
    }
    if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ ok: false, error: 'Please provide a valid email address.' });
    }
    if (String(name).length > 200 || String(message).length > 5000) {
        return res.status(400).json({ ok: false, error: 'Submission is too long.' });
    }

    const serviceLabel = SERVICE_LABELS[service] || 'Not specified';

    try {
        // Note: the Resend SDK resolves with { data, error } on failure — it does not throw.
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: TO_EMAIL,
            replyTo: email,
            subject: `New inquiry from ${name} — Aerie website`,
            html: `
                <h2>New contact form submission</h2>
                <p><strong>Name:</strong> ${escapeHtml(name)}</p>
                <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                <p><strong>Service interested in:</strong> ${escapeHtml(serviceLabel)}</p>
                <p><strong>Message:</strong></p>
                <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
            `.trim()
        });
        if (error) throw error;
        res.json({ ok: true });
    } catch (err) {
        console.error('Failed to send email:', err);
        res.status(502).json({ ok: false, error: 'Failed to send message. Please try again later or email us directly.' });
    }
});

app.get('/health', (req, res) => res.json({ ok: true }));

// Keep error responses (e.g. CORS rejections) as clean JSON — never leak stack traces.
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    console.error('Unhandled request error:', err);
    res.status(err.message === 'Not allowed by CORS' ? 403 : 500).json({ ok: false, error: 'Request could not be processed.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Aerie contact backend listening on port ${PORT}`));
