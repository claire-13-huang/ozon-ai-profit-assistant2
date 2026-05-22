// 只负责获取和缓存当日参考汇率，不参与利润公式计算。
const EXCHANGE_RATE_CACHE_KEY = 'ozon-cny-rub-reference-rate-v1';
const EXCHANGE_RATE_SOURCE_NAME = 'Frankfurter';
const EXCHANGE_RATE_API_URL = 'https://api.frankfurter.dev/v2/rate/CNY/RUB';

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readCachedReferenceExchangeRate() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    if (cached.cacheDate !== getLocalDateKey()) return null;
    if (!cached.rate || cached.rate <= 0) return null;

    return cached;
  } catch (error) {
    return null;
  }
}

function saveReferenceExchangeRateCache(data) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify({
      ...data,
      cacheDate: getLocalDateKey()
    }));
  } catch (error) {
    // 缓存失败不影响页面计算。
  }
}

function parseReferenceExchangeRate(data) {
  const rate = Number(data.rate || (data.rates && data.rates.RUB));

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Invalid exchange rate response');
  }

  return {
    rate,
    source: EXCHANGE_RATE_SOURCE_NAME,
    sourceDate: data.date || getLocalDateKey(),
    fetchedAt: new Date().toISOString()
  };
}

async function fetchReferenceExchangeRate() {
  const response = await fetch(EXCHANGE_RATE_API_URL);

  if (!response.ok) {
    throw new Error('Reference exchange rate request failed');
  }

  const data = await response.json();
  const parsed = parseReferenceExchangeRate(data);
  saveReferenceExchangeRateCache(parsed);
  return { ...parsed, fromCache: false };
}

async function getDailyReferenceExchangeRate() {
  const cached = readCachedReferenceExchangeRate();
  if (cached) {
    return { ...cached, fromCache: true };
  }

  return fetchReferenceExchangeRate();
}
