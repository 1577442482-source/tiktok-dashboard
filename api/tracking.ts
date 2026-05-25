import type { VercelRequest, VercelResponse } from '@vercel/node';

type TrackResult = { status: string; detail: string };

// ── USPS — free public API, no key ──

async function trackUSPS(num: string): Promise<TrackResult | null> {
  try {
    const r = await fetch(`https://tools.usps.com/tools/app/track/api/track?trackingNumber=${encodeURIComponent(num)}`);
    if (!r.ok) return null;
    const d = await r.json() as {
      trackingStatusCategory?: string;
      trackHistory?: Array<{ eventDate?: string; eventTime?: string; eventCity?: string; eventState?: string; eventDesc?: string; }>;
    };
    const cat = (d.trackingStatusCategory || '').toLowerCase();
    let status = 'pending';
    if (cat === 'delivered') status = 'delivered';
    else if (['accepted', 'arrived', 'departed', 'in transit', 'out for delivery', 'available for pickup', 'pre-shipment'].some(s => cat.includes(s))) status = 'in_transit';
    else if (cat.includes('alert') || cat.includes('return')) status = 'exception';
    const evt = d.trackHistory?.[0];
    return { status, detail: evt ? [evt.eventDate, evt.eventTime, evt.eventDesc, evt.eventCity, evt.eventState].filter(Boolean).join(' ') : (d.trackingStatusCategory || '') };
  } catch {
    return null;
  }
}

// ── DHL — public endpoint, no key ──

async function trackDHL(num: string): Promise<TrackResult | null> {
  try {
    const r = await fetch(`https://www.dhl.com/utapi?trackingNumber=${encodeURIComponent(num)}&language=en`);
    if (!r.ok) return null;
    const d = await r.json() as {
      results?: Array<{
        checkpoints?: Array<{ description?: string; location?: string; time?: string; }>;
        delivery?: { status?: string; };
      }>;
    };
    const res = d.results?.[0];
    if (!res) return null;
    const s = (res.delivery?.status || '').toLowerCase();
    let status = 'pending';
    if (s.includes('delivered')) status = 'delivered';
    else if (s.includes('transit') || s.includes('processed') || s.includes('picked') || s.includes('departed')) status = 'in_transit';
    else if (s.includes('exception') || s.includes('return') || s.includes('clearance')) status = 'exception';
    const cp = res.checkpoints?.[0];
    return { status, detail: cp ? [cp.time, cp.description, cp.location].filter(Boolean).join(' ') : (res.delivery?.status || '').trim() };
  } catch {
    return null;
  }
}

// ── Canada Post — free public API, no key ──

async function trackCanadaPost(num: string): Promise<TrackResult | null> {
  try {
    const r = await fetch(`https://www.canadapost-postescanada.ca/track-reperage/rs/track/json/package/${encodeURIComponent(num)}/detail`);
    if (!r.ok) return null;
    const d = await r.json() as {
      pin?: { status?: string; events?: Array<{ datetime?: string; location?: string; desc?: string; }>; };
    };
    const pin = d.pin;
    if (!pin) return null;
    const s = (pin.status || '').toLowerCase();
    let status = 'pending';
    if (s.includes('delivered')) status = 'delivered';
    else if (s.includes('transit') || s.includes('out for') || s.includes('processed')) status = 'in_transit';
    else if (s.includes('notice') || s.includes('return') || s.includes('error')) status = 'exception';
    const evt = pin.events?.[0];
    return { status, detail: evt ? [evt.datetime, evt.desc, evt.location].filter(Boolean).join(' ') : (pin.status || '') };
  } catch {
    return null;
  }
}

// ── HTML scraper for carrier tracking pages ──

async function scrapeTracking(url: string, patterns: { statusKey: string; regexes: RegExp[] }[]): Promise<TrackResult | null> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrackingBot/1.0)', Accept: 'text/html' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await r.text();
    const lower = html.toLowerCase();

    for (const { statusKey, regexes } of patterns) {
      for (const re of regexes) {
        if (re.test(lower)) {
          // Extract a detail line near the status keyword
          const detail = extractDetailLine(html, re);
          return { status: statusKey, detail };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function extractDetailLine(html: string, matchRe: RegExp): string {
  // find the matching line and return surrounding context
  const idx = html.toLowerCase().search(matchRe);
  if (idx === -1) return '';
  const start = Math.max(0, idx - 200);
  const end = Math.min(html.length, idx + 300);
  const snippet = html.slice(start, end).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return snippet.slice(0, 200);
}

// ── FedEx — scrape tracking page ──

async function trackFedEx(num: string): Promise<TrackResult | null> {
  return scrapeTracking(`https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(num)}`, [
    { statusKey: 'delivered', regexes: [/delivered/i, /signed for by/i, /left at/i, /package delivered/i, /delivery completed/i] },
    { statusKey: 'in_transit', regexes: [/in transit/i, /out for delivery/i, /on the way/i, /at local fedex facility/i, /arrived at/i, /departed/i, /picked up/i, /shipment information sent/i] },
    { statusKey: 'exception', regexes: [/exception/i, /delayed/i, /returned/i, /clearance delay/i, /held/i, /cancelled/i] },
    { statusKey: 'pending', regexes: [/label created/i, /shipment created/i, /pending/i] },
  ]);
}

// ── UPS — scrape tracking page ──

async function trackUPS(num: string): Promise<TrackResult | null> {
  return scrapeTracking(`https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(num)}`, [
    { statusKey: 'delivered', regexes: [/delivered/i, /left at/i, /met customer/i, /received by/i] },
    { statusKey: 'in_transit', regexes: [/in transit/i, /out for delivery/i, /on the way/i, /arrived at facility/i, /departed/i, /origin scan/i, /pickup scan/i, /destination scan/i, /loaded on delivery vehicle/i] },
    { statusKey: 'exception', regexes: [/exception/i, /delayed/i, /returned/i, /held/i, /address correction/i, /damaged/i] },
    { statusKey: 'pending', regexes: [/label created/i, /shipment ready/i, /order processed/i] },
  ]);
}

// ── OnTrac — scrape tracking page ──

async function trackOnTrac(num: string): Promise<TrackResult | null> {
  return scrapeTracking(`https://www.ontrac.com/tracking/${encodeURIComponent(num)}`, [
    { statusKey: 'delivered', regexes: [/delivered/i, /left at/i, /signed/i] },
    { statusKey: 'in_transit', regexes: [/in transit/i, /out for delivery/i, /arrived at/i, /departed/i, /en route/i, /processed/i] },
    { statusKey: 'exception', regexes: [/exception/i, /delayed/i, /returned/i, /undeliverable/i] },
    { statusKey: 'pending', regexes: [/pending/i, /label created/i, /information received/i] },
  ]);
}

// ── GLS — scrape tracking page ──

async function trackGLS(num: string): Promise<TrackResult | null> {
  return scrapeTracking(`https://gls-group.com/EU/en/parcel-tracking?match=${encodeURIComponent(num)}`, [
    { statusKey: 'delivered', regexes: [/delivered/i, /successfully delivered/i] },
    { statusKey: 'in_transit', regexes: [/in transit/i, /out for delivery/i, /arrived/i, /departed/i, /handed to gls/i, /parcel handed over/i] },
    { statusKey: 'exception', regexes: [/exception/i, /delayed/i, /returned/i, /problem/i] },
    { statusKey: 'pending', regexes: [/created/i, /announced/i, /pending/i] },
  ]);
}

// ── Generic / Swift Express / others — try common tracking API endpoints ──

async function trackGeneric(num: string): Promise<TrackResult | null> {
  // Try some generic tracking endpoints
  const endpoints = [
    `https://alltrack.org/api/track/swiftx/${encodeURIComponent(num)}`,
    `https://global-package-tracking.com/api/track/swiftx/${encodeURIComponent(num)}`,
  ];
  for (const url of endpoints) {
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
      if (!r.ok) continue;
      const d = await r.json() as Record<string, unknown>;
      const text = JSON.stringify(d).toLowerCase();
      if (text.includes('delivered')) return { status: 'delivered', detail: extractDetailLine(JSON.stringify(d), /delivered/i) };
      if (text.includes('transit')) return { status: 'in_transit', detail: extractDetailLine(JSON.stringify(d), /transit/i) };
      if (text.includes('pending')) return { status: 'pending', detail: '' };
      continue;
    } catch {
      continue;
    }
  }
  return null;
}

// ── Main dispatcher ──

type TrackerFn = (num: string) => Promise<TrackResult | null>;

const TRACKERS: Record<string, TrackerFn[]> = {
  usps:     [trackUSPS],
  fedex:    [trackFedEx],
  ups:      [trackUPS],
  dhl:      [trackDHL],
  ontrac:   [trackOnTrac],
  canadapost: [trackCanadaPost],
  gls:      [trackGLS],
  swift:    [trackGeneric],
  amazon:   [],
  lasership: [],
  osm:      [],
  gofly:    [],
  pitney:   [],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { trackingNumber, carrier } = req.body || {};
  if (!trackingNumber || !carrier) {
    return res.status(400).json({ error: 'Missing trackingNumber or carrier' });
  }

  const fns = TRACKERS[carrier] || [];
  for (const fn of fns) {
    const result = await fn(trackingNumber);
    if (result) return res.json(result);
  }

  // No result — return manual status hint
  return res.json({
    status: 'pending',
    detail: `${carrier.toUpperCase()} 请在快递官网手动查询后更新状态`,
  });
}
