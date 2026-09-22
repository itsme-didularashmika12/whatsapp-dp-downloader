/**
 * Vercel Serverless Function — health proxy for the footer status pill.
 */
export const config = { maxDuration: 15 };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=30');
  const base = (process.env.WA_DP_API_BASE || '').replace(/\/+$/, '');
  if (!base) return res.status(200).json({ ok: false });

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8_000);
  try {
    const upstream = await fetch(`${base}/api/health`, { signal: ctl.signal });
    const data = await upstream.json().catch(() => null);
    return res.status(200).json(data || { ok: false });
  } catch {
    return res.status(200).json({ ok: false });
  } finally {
    clearTimeout(timer);
  }
}
