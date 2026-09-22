/**
 * Vercel Serverless Function — POST-free DP lookup proxy.
 * Browser → /api/dp?number=94XXXXXXXXX → VPS wa-dp-api (secret key server-side).
 */
export const config = { maxDuration: 45 };

// naive per-instance IP rate limit: 12 lookups / minute
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (rec && now < rec.reset && rec.count >= 12) return true;
  if (!rec || now >= rec.reset) hits.set(ip, { count: 1, reset: now + 60_000 });
  else rec.count++;
  if (hits.size > 5000) hits.clear(); // don't leak memory
  return false;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'method_not_allowed' });
  }

  const base = (process.env.WA_DP_API_BASE || '').replace(/\/+$/, '');
  const key = process.env.WA_DP_API_KEY || '';
  if (!base || !key) {
    return res.status(500).json({ success: false, error: 'not_configured', message: 'Service is not configured yet.' });
  }

  const number = String(req.query.number || '').replace(/\D/g, '').replace(/^0+/, '');
  if (!/^\d{9,15}$/.test(number)) {
    return res.status(400).json({ success: false, error: 'invalid_number', message: 'Enter the full international number (country code + number, digits only).' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'anon';
  if (rateLimited(ip)) {
    return res.status(429).json({ success: false, error: 'rate_limited', message: 'Too many requests — please wait a minute.' });
  }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 40_000);
  try {
    const upstream = await fetch(`${base}/api/dp?number=${number}`, {
      headers: {
        'x-api-key': key,
        'Accept': 'application/json',
        // let the VPS apply its OWN per-user rate limit (nginx appends our egress IP)
        'X-Forwarded-For': ip,
      },
      signal: ctl.signal,
    });
    const data = await upstream.json().catch(() => null);
    if (!data) {
      return res.status(502).json({ success: false, error: 'upstream_error', message: 'Lookup engine returned an invalid response. Try again.' });
    }
    return res.status(upstream.status).json(data);
  } catch (e) {
    const timeout = e && e.name === 'AbortError';
    return res.status(timeout ? 504 : 502).json({
      success: false,
      error: timeout ? 'whatsapp_timeout' : 'upstream_error',
      message: timeout ? 'The lookup took too long — please try again.' : 'Lookup engine is unreachable — please try again shortly.',
    });
  } finally {
    clearTimeout(timer);
  }
}
