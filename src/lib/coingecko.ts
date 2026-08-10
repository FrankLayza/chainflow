/**
 * CoinGecko price feed for off-chain trigger evaluation (PRICE_BELOW /
 * PRICE_ABOVE). The free `simple/price` endpoint works without an API key but
 * is rate-limited, so a single cron tick shares one cached fetch across every
 * queued rule instead of hammering it once per rule.
 */
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_TTL_MS = 60_000;

let cachedPrice: { token: string; price: number; at: number } | null = null;

export async function getTokenUsdPrice(token: string = 'ethereum'): Promise<number> {
  if (cachedPrice && cachedPrice.token === token && Date.now() - cachedPrice.at < CACHE_TTL_MS) {
    return cachedPrice.price;
  }

  const apiKey = process.env.COINGECKO_API_KEY;
  const url = new URL(`${COINGECKO_BASE}/simple/price`);
  url.searchParams.set('ids', token);
  url.searchParams.set('vs_currencies', 'usd');

  const response = await fetch(url, {
    headers: apiKey ? { 'x-cg-demo-api-key': apiKey } : {},
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko API HTTP ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as Record<string, { usd?: number }>;
  const price = data[token]?.usd;

  if (typeof price !== 'number' || !Number.isFinite(price)) {
    throw new Error(`CoinGecko returned no price for "${token}"`);
  }

  cachedPrice = { token, price, at: Date.now() };
  return price;
}
