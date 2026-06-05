const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const OZON_API_BASE = 'https://api-seller.ozon.ru';
const WB_ANALYTICS_API_BASE = 'https://seller-analytics-api.wildberries.ru';
const YANDEX_MARKET_API_BASE = 'https://api.partner.market.yandex.ru';
const SOURCE_PREVIEW_REDIRECT_LIMIT = 3;
const SOURCE_PREVIEW_FALLBACK_MESSAGE = '无法自动读取该链接的公开页面信息，请手动填写商品标题、采购价和类目信息。';
const SOURCE_PREVIEW_REDIRECT_FALLBACK_MESSAGE = '该链接跳转后仍无法读取公开页面信息，请手动填写商品标题、采购价和类目信息。';

const SUPPLIER_PRICE_NOTICE = '识别到的是候选采购价，请确认是否为真实拿货成本。';
const MARKETPLACE_PRICE_NOTICE = '识别到的是平台销售参考价，不等于你的采购成本。';
const NO_PRICE_NOTICE = '未能自动识别价格，请手动填写或确认。';

const SOURCE_PLATFORM_RULES = [
  { platform: '1688', platformType: 'supplier', priceRole: 'candidate_source_cost', match: host => /(^|\.)1688\.com$/.test(host) },
  { platform: 'Taobao', platformType: 'supplier', priceRole: 'candidate_source_cost', match: host => /(^|\.)taobao\.com$/.test(host) },
  { platform: 'Tmall', platformType: 'supplier', priceRole: 'candidate_source_cost', match: host => /(^|\.)tmall\.com$/.test(host) },
  { platform: 'Pinduoduo', platformType: 'supplier', priceRole: 'candidate_source_cost', match: host => /(^|\.)pinduoduo\.com$/.test(host) || /(^|\.)yangkeduo\.com$/.test(host) },
  { platform: 'JD', platformType: 'supplier', priceRole: 'candidate_source_cost', match: host => /(^|\.)jd\.com$/.test(host) },
  { platform: 'AliExpress', platformType: 'supplier', priceRole: 'candidate_source_cost', match: host => /(^|\.)aliexpress\./.test(host) },
  { platform: 'Amazon', platformType: 'marketplace', priceRole: 'market_reference_price', match: host => /(^|\.)amazon\./.test(host) },
  { platform: 'Ozon', platformType: 'marketplace', priceRole: 'market_reference_price', match: host => /(^|\.)ozon\.ru$/.test(host) },
  { platform: 'Wildberries', platformType: 'marketplace', priceRole: 'market_reference_price', match: host => /(^|\.)wildberries\.ru$/.test(host) },
  { platform: 'Yandex Market', platformType: 'marketplace', priceRole: 'market_reference_price', match: host => /(^|\.)market\.yandex\.ru$/.test(host) }
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function cleanText(value, max = 240) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, max);
}

function decodeHtmlEntities(value) {
  const named = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' '
  };

  return String(value || '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    if (named[lower]) return named[lower];
    if (lower[0] !== '#') return match;

    const code = lower[1] === 'x'
      ? parseInt(lower.slice(2), 16)
      : parseInt(lower.slice(1), 10);

    return Number.isFinite(code) ? String.fromCodePoint(code) : match;
  });
}

function cleanMetadataText(value, max = 240) {
  return cleanText(decodeHtmlEntities(value), max);
}

function removeSensitiveFields(value) {
  if (Array.isArray(value)) return value.map(removeSensitiveFields);
  if (!value || typeof value !== 'object') return value;

  return Object.entries(value).reduce((safe, [key, item]) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('key') || lowerKey.includes('token') || lowerKey.includes('secret') || lowerKey.includes('client')) {
      safe[key] = '[redacted]';
    } else {
      safe[key] = removeSensitiveFields(item);
    }
    return safe;
  }, {});
}

function redactKnownSecrets(value, secrets = []) {
  return secrets
    .filter(secret => secret && String(secret).length >= 4)
    .reduce((text, secret) => text.split(String(secret)).join('[redacted]'), String(value || ''));
}

function safeOzonError(data, secrets = []) {
  if (!data) return null;

  const safeData = removeSensitiveFields(data);
  const message = typeof safeData === 'object'
    ? safeData.message || safeData.error || safeData.raw || JSON.stringify(safeData)
    : safeData;
  const text = cleanText(redactKnownSecrets(message, secrets), 500);

  return text ? text : null;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (error) {
    return false;
  }
}

function normalizedHost(url) {
  return url.hostname.replace(/^www\./i, '').replace(/\.$/, '').toLowerCase();
}

function isPrivateIpv4(hostname) {
  const parts = hostname.split('.');
  if (parts.length !== 4 || !parts.every(part => /^\d+$/.test(part))) return false;

  const numbers = parts.map(Number);
  if (!numbers.every(part => Number.isInteger(part) && part >= 0 && part <= 255)) return false;

  const [a, b] = numbers;
  return a === 0 ||
    a === 10 ||
    a === 127 ||
    a === 169 && b === 254 ||
    a === 172 && b >= 16 && b <= 31 ||
    a === 192 && b === 168;
}

function isUnsafeSourceHost(hostname) {
  const host = String(hostname || '').replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan') || host.endsWith('.home')) return true;
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) return true;
  if (/^\d+(?:\.\d+){1,2}$/.test(host)) return true;
  if (isPrivateIpv4(host)) return true;

  // Keep literal IPv6 out of this endpoint for now. This avoids accidentally
  // allowing loopback/link-local/private ranges through incomplete parsing.
  if (host.includes(':')) return true;

  return false;
}

function inferSourcePlatform(host) {
  const cleanHost = String(host || '').toLowerCase();
  const rule = SOURCE_PLATFORM_RULES.find(item => item.match(cleanHost));
  return rule ? rule.platform : cleanHost ? 'Generic ecommerce' : 'External source';
}

function detectSourcePlatform(host) {
  const cleanHost = String(host || '').toLowerCase();
  const rule = SOURCE_PLATFORM_RULES.find(item => item.match(cleanHost));

  if (rule) {
    return {
      platform: rule.platform,
      platformType: rule.platformType,
      priceRole: rule.priceRole
    };
  }

  return {
    platform: cleanHost ? 'Generic ecommerce' : 'External source',
    platformType: 'unknown',
    priceRole: 'unknown'
  };
}

function buildSourcePreviewSource(urlValue) {
  const cleanUrl = String(urlValue || '').trim();
  let url = null;

  try {
    url = cleanUrl ? new URL(cleanUrl) : null;
  } catch (error) {
    url = null;
  }

  const host = url ? normalizedHost(url) : '';
  const platform = detectSourcePlatform(host);

  return {
    url: url ? url.toString() : cleanUrl,
    finalUrl: url ? url.toString() : cleanUrl,
    host,
    platform: platform.platform,
    platformType: platform.platformType,
    title: '',
    image: '',
    description: '',
    canonicalUrl: '',
    price: null,
    currency: '',
    priceRole: platform.priceRole,
    categorySuggestion: '',
    confidence: {
      title: 'none',
      price: 'none',
      category: 'none'
    },
    extractionSources: {
      title: '',
      price: '',
      image: '',
      category: ''
    }
  };
}

function buildSourcePreviewAnalysis(source, ok) {
  const manualNeeded = [];
  const sellingPoints = [];
  const riskNotes = [];
  const limitations = [];
  const titleText = source.title ? `已识别商品标题：${source.title}` : '未能识别商品标题';
  const platformText = source.platform ? `来源平台：${source.platform}` : '来源平台待确认';

  if (source.image) sellingPoints.push('页面提供了公开商品图片，可用于初步判断主图方向');
  if (source.categorySuggestion) sellingPoints.push(`初步类目方向：${source.categorySuggestion}`);
  if (source.description) sellingPoints.push('页面提供了公开描述，可用于人工复核卖点');

  if (!source.title) manualNeeded.push('商品标题');
  if (!source.categorySuggestion) manualNeeded.push('类目或产品类型');
  if (source.price === null) {
    manualNeeded.push('采购价或平台参考价');
    riskNotes.push(NO_PRICE_NOTICE);
  }

  if (source.priceRole === 'candidate_source_cost') {
    manualNeeded.push('确认候选采购价是否是真实拿货成本');
    riskNotes.push(SUPPLIER_PRICE_NOTICE);
  } else if (source.priceRole === 'market_reference_price') {
    manualNeeded.push('确认真实采购成本，不能直接使用平台销售参考价');
    riskNotes.push(MARKETPLACE_PRICE_NOTICE);
  }

  if (!ok) {
    limitations.push('页面可能阻止 Worker 读取、需要动态渲染，或没有返回可用公开商品信息。');
  }

  return {
    summary: ok
      ? `${platformText}。${titleText}。当前结果只基于公开页面返回内容和本地规则。`
      : `${platformText}。未能可靠读取公开商品信息，请使用手动字段继续。`,
    likelyUseCase: source.platformType === 'supplier'
      ? '供应商/货源页，可作为采购成本候选线索'
      : source.platformType === 'marketplace'
        ? '市场销售页，可作为目标市场价格参考'
        : '通用商品页，需要人工判断是货源还是销售参考',
    sellingPoints: uniqueSourceItems(sellingPoints, 5),
    riskNotes: uniqueSourceItems(riskNotes, 5),
    manualConfirmationNeeded: uniqueSourceItems(manualNeeded, 6)
  };
}

function uniqueSourceItems(items, maxItems = 8) {
  return [...new Set((items || [])
    .map(item => cleanText(item, 180))
    .filter(Boolean))]
    .slice(0, maxItems);
}

function sourcePreviewFallback(urlValue, message, limitations = [], metadata = {}) {
  const source = buildSourcePreviewSource(urlValue);
  if (metadata.finalUrl) {
    const finalSource = buildSourcePreviewSource(metadata.finalUrl);
    source.finalUrl = metadata.finalUrl;
    source.host = finalSource.host;
    source.platform = finalSource.platform;
    source.platformType = finalSource.platformType;
    source.priceRole = finalSource.priceRole;
  }

  return {
    ok: false,
    source,
    analysis: buildSourcePreviewAnalysis(source, false),
    message: message || SOURCE_PREVIEW_FALLBACK_MESSAGE,
    limitations,
    ...metadata
  };
}

function validateSourcePreviewUrl(value) {
  let url;

  try {
    url = new URL(String(value || '').trim());
  } catch (error) {
    return {
      error: '请提供有效的 http/https 商品链接。',
      status: 400
    };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return {
      error: '只支持 http 或 https 商品链接。',
      status: 400
    };
  }

  if (url.username || url.password) {
    return {
      error: '链接中不能包含用户名或密码。',
      status: 400
    };
  }

  if (isUnsafeSourceHost(url.hostname)) {
    return {
      error: '该链接指向本地、内网或私有地址，已拒绝自动预览。',
      status: 403
    };
  }

  return { url };
}

function extractMeta(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["'][^>]*>`, 'i')
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return cleanMetadataText(match[1], 500);
  }

  return '';
}

function extractTitle(html) {
  return cleanMetadataText(extractMeta(html, 'og:title') || (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1], 180);
}

function extractLinkHref(html, rel) {
  const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<link[^>]+rel=["'][^"']*${escaped}[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*${escaped}[^"']*["'][^>]*>`, 'i')
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]).trim();
  }

  return '';
}

function toSafePublicAbsoluteUrl(raw, baseUrl) {
  if (!raw) return '';

  try {
    const parsed = new URL(raw, baseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    if (isUnsafeSourceHost(parsed.hostname)) return '';
    return parsed.toString();
  } catch (error) {
    return '';
  }
}

function extractImage(html, baseUrl) {
  const raw = extractMeta(html, 'og:image');
  return toSafePublicAbsoluteUrl(raw, baseUrl);
}

function extractCanonicalUrl(html, baseUrl) {
  return toSafePublicAbsoluteUrl(extractLinkHref(html, 'canonical'), baseUrl);
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    const text = decodeHtmlEntities(match[1]).trim();
    if (!text) continue;

    try {
      blocks.push(JSON.parse(text));
    } catch (error) {
      // Some platforms return malformed JSON-LD fragments. Ignore them rather
      // than trying to repair or infer private data.
    }
  }

  return blocks;
}

function jsonLdTypeMatches(value, typeName) {
  if (Array.isArray(value)) return value.some(item => jsonLdTypeMatches(item, typeName));
  return String(value || '').toLowerCase() === typeName.toLowerCase();
}

function walkJsonLd(value, callback) {
  if (Array.isArray(value)) {
    value.forEach(item => walkJsonLd(item, callback));
    return;
  }

  if (!value || typeof value !== 'object') return;
  callback(value);

  if (value['@graph']) walkJsonLd(value['@graph'], callback);
  if (value.itemListElement) walkJsonLd(value.itemListElement, callback);
  if (value.item) walkJsonLd(value.item, callback);
}

function firstCleanValue(value, max = 240) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const clean = firstCleanValue(item, max);
      if (clean) return clean;
    }
    return '';
  }

  if (value && typeof value === 'object') {
    return firstCleanValue(value.name || value.url || value.contentUrl, max);
  }

  return cleanMetadataText(value, max);
}

function firstSafeImage(value, baseUrl) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const safe = firstSafeImage(item, baseUrl);
      if (safe) return safe;
    }
    return '';
  }

  if (value && typeof value === 'object') {
    return firstSafeImage(value.url || value.contentUrl, baseUrl);
  }

  return toSafePublicAbsoluteUrl(value, baseUrl);
}

function normalizePriceValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  let clean = raw.replace(/[^\d.,-]/g, '');
  if (!clean || clean === '-' || clean === '.' || clean === ',') return null;

  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/,/g, '');
  } else if (clean.includes(',') && !clean.includes('.')) {
    const parts = clean.split(',');
    clean = parts[parts.length - 1].length <= 2 ? clean.replace(',', '.') : clean.replace(/,/g, '');
  }

  const number = Number(clean);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeCurrency(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/[¥￥]/.test(raw) || /\b(CNY|RMB)\b/i.test(raw)) return 'CNY';
  if (/\$/.test(raw) || /\bUSD\b/i.test(raw)) return 'USD';
  if (/₽/.test(raw) || /\bRUB\b/i.test(raw) || /руб/i.test(raw)) return 'RUB';
  if (/€/.test(raw) || /\bEUR\b/i.test(raw)) return 'EUR';
  return cleanText(raw, 12).toUpperCase();
}

function extractJsonLdProductData(html, baseUrl) {
  const result = {};
  const blocks = extractJsonLdBlocks(html);
  const products = [];
  const breadcrumbs = [];

  blocks.forEach(block => {
    walkJsonLd(block, item => {
      if (jsonLdTypeMatches(item['@type'], 'Product')) products.push(item);
      if (jsonLdTypeMatches(item['@type'], 'BreadcrumbList')) breadcrumbs.push(item);
    });
  });

  const product = products[0];
  if (product) {
    const title = firstCleanValue(product.name, 180);
    const description = firstCleanValue(product.description, 300);
    const image = firstSafeImage(product.image, baseUrl);
    const category = firstCleanValue(product.category, 120);

    if (title) result.title = { value: title, source: 'json-ld Product.name', confidence: 'high' };
    if (description) result.description = { value: description, source: 'json-ld Product.description' };
    if (image) result.image = { value: image, source: 'json-ld Product.image', confidence: 'high' };
    if (category) result.category = { value: category, source: 'json-ld Product.category', confidence: 'high' };

    const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
    if (offers && typeof offers === 'object') {
      const price = normalizePriceValue(offers.price || offers.lowPrice || offers.highPrice);
      if (price !== null) {
        result.price = {
          value: price,
          currency: normalizeCurrency(offers.priceCurrency),
          source: offers.price ? 'json-ld Product.offers.price' : 'json-ld Product.offers price range',
          confidence: 'high'
        };
      }
    }
  }

  if (!result.category) {
    const crumbs = breadcrumbs
      .flatMap(item => Array.isArray(item.itemListElement) ? item.itemListElement : [])
      .map(item => firstCleanValue(item && (item.name || item.item), 80))
      .filter(Boolean);
    const category = crumbs.length ? crumbs.slice(-2).join(' / ') : '';
    if (category) result.category = { value: category, source: 'json-ld BreadcrumbList', confidence: 'medium' };
  }

  return result;
}

function extractMetaProductData(html, baseUrl) {
  const result = {};
  const title = extractMeta(html, 'og:title') || extractMeta(html, 'twitter:title') || extractMeta(html, 'title');
  const description = extractMeta(html, 'og:description') || extractMeta(html, 'twitter:description') || extractMeta(html, 'description');
  const image = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image') || extractMeta(html, 'image');
  const category = extractMeta(html, 'product:category') || extractMeta(html, 'category') || extractMeta(html, 'og:type');
  const priceText = extractMeta(html, 'product:price:amount') ||
    extractMeta(html, 'product:price') ||
    extractMeta(html, 'price') ||
    extractMeta(html, 'twitter:data1');
  const currencyText = extractMeta(html, 'product:price:currency') || extractMeta(html, 'priceCurrency') || extractMeta(html, 'currency');
  const price = normalizePriceValue(priceText);

  if (title) result.title = { value: cleanMetadataText(title, 180), source: title === extractMeta(html, 'og:title') ? 'Open Graph title' : 'meta title', confidence: 'medium' };
  if (description) result.description = { value: cleanMetadataText(description, 300), source: 'meta description' };
  if (image) {
    const safeImage = toSafePublicAbsoluteUrl(image, baseUrl);
    if (safeImage) result.image = { value: safeImage, source: 'Open Graph/Twitter image', confidence: 'medium' };
  }
  if (category) result.category = { value: cleanMetadataText(category, 120), source: 'product/category meta', confidence: 'medium' };
  if (price !== null) {
    result.price = {
      value: price,
      currency: normalizeCurrency(currencyText || priceText),
      source: 'product price meta',
      confidence: 'medium'
    };
  }

  return result;
}

function extractItempropValue(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const contentPattern = new RegExp(`<[^>]+itemprop=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  const valuePattern = new RegExp(`<[^>]+itemprop=["']${escaped}["'][^>]+(?:href|src)=["']([^"']+)["'][^>]*>`, 'i');
  const textPattern = new RegExp(`<[^>]+itemprop=["']${escaped}["'][^>]*>([\\s\\S]{0,300})<\\/[^>]+>`, 'i');
  const match = html.match(contentPattern) || html.match(valuePattern) || html.match(textPattern);
  return match ? cleanMetadataText(match[1], 300) : '';
}

function extractItempropProductData(html, baseUrl) {
  const result = {};
  const title = extractItempropValue(html, 'name');
  const image = extractItempropValue(html, 'image');
  const priceText = extractItempropValue(html, 'price');
  const currencyText = extractItempropValue(html, 'priceCurrency');
  const category = extractItempropValue(html, 'category');
  const price = normalizePriceValue(priceText);

  if (title) result.title = { value: title.slice(0, 180), source: 'itemprop name', confidence: 'medium' };
  if (image) {
    const safeImage = toSafePublicAbsoluteUrl(image, baseUrl);
    if (safeImage) result.image = { value: safeImage, source: 'itemprop image', confidence: 'medium' };
  }
  if (category) result.category = { value: category.slice(0, 120), source: 'itemprop category', confidence: 'medium' };
  if (price !== null) {
    result.price = {
      value: price,
      currency: normalizeCurrency(currencyText || priceText),
      source: 'itemprop price',
      confidence: 'medium'
    };
  }

  return result;
}

function stripHtmlForVisibleText(html) {
  return cleanMetadataText(String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+(?:display\s*:\s*none|visibility\s*:\s*hidden)[^>]*>[\s\S]*?<\/[^>]+>/gi, ' ')
    .replace(/<[^>]+>/g, ' '), 8000);
}

function extractVisiblePriceData(html) {
  const text = stripHtmlForVisibleText(html);
  const symbolPattern = /(?:价格|售价|price|цена|стоимость)?\s*([¥￥$€₽]|CNY|RMB|USD|RUB|EUR)\s*([0-9][0-9\s.,]{0,14})/i;
  const codePattern = /(?:价格|售价|price|цена|стоимость)?\s*([0-9][0-9\s.,]{0,14})\s*(CNY|RMB|USD|RUB|EUR|₽|руб\.?|рублей)\b/i;
  const match = text.match(symbolPattern) || text.match(codePattern);
  if (!match) return null;

  const priceToken = /^[0-9]/.test(match[1]) ? match[1] : match[2];
  const currencyToken = /^[0-9]/.test(match[1]) ? match[2] : match[1];
  const price = normalizePriceValue(priceToken);
  if (price === null) return null;

  return {
    value: price,
    currency: normalizeCurrency(currencyToken),
    source: 'visible page text price pattern',
    confidence: 'low'
  };
}

const SOURCE_CATEGORY_RULES = [
  { category: '服饰', keywords: ['clothing', 'apparel', 'shirt', 'dress', 'pants', 'jacket', '服装', '服饰', '衣服', '上衣', '连衣裙', '裤'] },
  { category: '鞋靴', keywords: ['shoe', 'sneaker', 'slipper', 'sandal', 'boot', '鞋', '拖鞋', '凉鞋', '运动鞋', '靴'] },
  { category: '母婴童装', keywords: ['baby', 'kids', 'children', 'toddler', '婴儿', '儿童', '童装', '母婴'] },
  { category: '3C配件', keywords: ['phone case', 'charger', 'cable', 'adapter', 'usb', 'earphone', '手机壳', '数据线', '充电器', '耳机'] },
  { category: '饰品', keywords: ['jewelry', 'necklace', 'earrings', 'bracelet', 'ring', '首饰', '饰品', '项链', '耳环', '手链', '戒指'] },
  { category: '家居百货', keywords: ['kitchen', 'storage', 'organizer', 'home', 'household', 'cleaning', '厨房', '收纳', '置物', '家居', '百货', '清洁'] }
];

function suggestSourceCategory(text) {
  const clean = String(text || '').toLowerCase();
  if (!clean) return '';

  const match = SOURCE_CATEGORY_RULES.find(rule =>
    rule.keywords.some(keyword => clean.includes(keyword.toLowerCase()))
  );

  return match ? match.category : '';
}

function preferField(target, key, candidate) {
  if (!candidate || candidate.value === undefined || candidate.value === null || candidate.value === '') return;
  if (target[key] && target[key].value !== undefined && target[key].value !== null && target[key].value !== '') return;
  target[key] = candidate;
}

function extractPlatformAwareProductData(html, finalUrl, source) {
  const extracted = {};
  const jsonLd = extractJsonLdProductData(html, finalUrl);
  const meta = extractMetaProductData(html, finalUrl);
  const itemprop = extractItempropProductData(html, finalUrl);
  const titleFallback = extractTitle(html);
  const visiblePrice = extractVisiblePriceData(html);

  ['title', 'description', 'image', 'category', 'price'].forEach(key => preferField(extracted, key, jsonLd[key]));
  ['title', 'description', 'image', 'category', 'price'].forEach(key => preferField(extracted, key, meta[key]));
  ['title', 'image', 'category', 'price'].forEach(key => preferField(extracted, key, itemprop[key]));
  preferField(extracted, 'title', titleFallback ? { value: titleFallback, source: '<title>', confidence: 'low' } : null);
  preferField(extracted, 'price', visiblePrice);

  if (!extracted.category) {
    const suggested = suggestSourceCategory([
      extracted.title && extracted.title.value,
      extracted.description && extracted.description.value,
      source.platform,
      source.host
    ].filter(Boolean).join(' '));
    preferField(extracted, 'category', suggested ? { value: suggested, source: 'local keyword category rule', confidence: 'low' } : null);
  }

  return extracted;
}

function applyExtractedDataToSource(source, extracted) {
  if (extracted.title) {
    source.title = extracted.title.value;
    source.confidence.title = extracted.title.confidence || 'medium';
    source.extractionSources.title = extracted.title.source || '';
  }

  if (extracted.description) source.description = extracted.description.value;

  if (extracted.image) {
    source.image = extracted.image.value;
    source.extractionSources.image = extracted.image.source || '';
  }

  if (extracted.category) {
    source.categorySuggestion = extracted.category.value;
    source.confidence.category = extracted.category.confidence || 'medium';
    source.extractionSources.category = extracted.category.source || '';
  }

  if (extracted.price) {
    source.price = extracted.price.value;
    source.currency = extracted.price.currency || source.currency || '';
    source.confidence.price = extracted.price.confidence || 'medium';
    source.extractionSources.price = extracted.price.source || '';
  }
}

async function readTextWithLimit(response, maxBytes = 120000) {
  if (!response.body || !response.body.getReader) {
    return (await response.text()).slice(0, maxBytes);
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;

  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;

    const remaining = maxBytes - received;
    const chunk = value.byteLength > remaining ? value.slice(0, remaining) : value;
    chunks.push(chunk);
    received += chunk.byteLength;

    if (value.byteLength > remaining) break;
  }

  try {
    await reader.cancel();
  } catch (error) {
    // Ignore stream cancel errors; we already have enough metadata bytes.
  }

  const combined = new Uint8Array(received);
  let offset = 0;
  chunks.forEach(chunk => {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  });

  return new TextDecoder('utf-8').decode(combined);
}

function isHttpRedirectStatus(status) {
  return status >= 300 && status < 400;
}

function resolveSafeSourceRedirect(location, currentUrl) {
  if (!location) {
    return {
      error: '跳转响应缺少 Location。',
      status: 400
    };
  }

  let nextUrl;
  try {
    nextUrl = new URL(location, currentUrl);
  } catch (error) {
    return {
      error: '跳转 Location 不是有效 URL。',
      status: 400
    };
  }

  return validateSourcePreviewUrl(nextUrl.toString());
}

async function fetchSourcePreviewPage(sourceUrl, signal) {
  let currentUrl = sourceUrl;
  let redirectCount = 0;

  while (true) {
    let response;
    try {
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.2'
        }
      });
    } catch (error) {
      if (!redirectCount || error.name === 'AbortError') throw error;

      return {
        error: SOURCE_PREVIEW_REDIRECT_FALLBACK_MESSAGE,
        status: 200,
        finalUrl: currentUrl,
        redirectCount,
        limitations: [
          cleanText(error.message, 160) || '跳转后的公开页面读取失败。'
        ]
      };
    }

    if (!isHttpRedirectStatus(response.status)) {
      return {
        response,
        finalUrl: currentUrl,
        redirectCount
      };
    }

    if (redirectCount >= SOURCE_PREVIEW_REDIRECT_LIMIT) {
      return {
        error: SOURCE_PREVIEW_REDIRECT_FALLBACK_MESSAGE,
        status: 200,
        finalUrl: currentUrl,
        redirectCount,
        limitations: [
          `公开页面跳转超过 ${SOURCE_PREVIEW_REDIRECT_LIMIT} 次，已停止继续访问。`
        ]
      };
    }

    const redirect = resolveSafeSourceRedirect(response.headers.get('location'), currentUrl);
    if (redirect.error) {
      return {
        error: SOURCE_PREVIEW_REDIRECT_FALLBACK_MESSAGE,
        status: redirect.status,
        finalUrl: currentUrl,
        redirectCount,
        limitations: [
          redirect.error,
          '跳转目标必须继续满足公开 http/https URL 安全检查。'
        ]
      };
    }

    redirectCount += 1;
    currentUrl = redirect.url.toString();
  }
}

async function handleSourcePreview(request) {
  const body = await request.json().catch(() => null);
  const inputUrl = body && typeof body === 'object' && !Array.isArray(body) ? body.url : '';
  const validation = validateSourcePreviewUrl(inputUrl);

  if (validation.error) {
    return json(sourcePreviewFallback(inputUrl, validation.error, [
      '仅允许公开 http/https 页面。',
      '本端点拒绝本地、内网、私有 IP 和带账号密码的 URL。'
    ]), validation.status);
  }

  const sourceUrl = validation.url.toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const fetchResult = await fetchSourcePreviewPage(sourceUrl, controller.signal);
    if (fetchResult.error) {
      return json(sourcePreviewFallback(sourceUrl, fetchResult.error, fetchResult.limitations, {
        finalUrl: fetchResult.finalUrl || sourceUrl,
        redirectCount: fetchResult.redirectCount || 0
      }), fetchResult.status || 200);
    }

    const { response, finalUrl, redirectCount } = fetchResult;
    const fallbackMessage = redirectCount > 0
      ? SOURCE_PREVIEW_REDIRECT_FALLBACK_MESSAGE
      : SOURCE_PREVIEW_FALLBACK_MESSAGE;

    if (!response.ok) {
      return json(sourcePreviewFallback(sourceUrl, fallbackMessage, [
        `公开页面返回 HTTP ${response.status}。`
      ], { finalUrl, redirectCount }));
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType && !/html|text\/plain|application\/xhtml/i.test(contentType)) {
      return json(sourcePreviewFallback(sourceUrl, redirectCount > 0
        ? SOURCE_PREVIEW_REDIRECT_FALLBACK_MESSAGE
        : '该链接返回的不是可读取的公开 HTML 页面，请手动填写商品标题、采购价和类目信息。', [
        `content-type: ${cleanText(contentType, 80)}`
      ], { finalUrl, redirectCount }));
    }

    const html = await readTextWithLimit(response);
    const source = buildSourcePreviewSource(sourceUrl);
    const finalSource = buildSourcePreviewSource(finalUrl);
    const canonicalUrl = extractCanonicalUrl(html, finalUrl);
    source.finalUrl = finalUrl;
    source.host = finalSource.host;
    source.platform = finalSource.platform;
    source.platformType = finalSource.platformType;
    source.priceRole = finalSource.priceRole;
    const extracted = extractPlatformAwareProductData(html, finalUrl, source);
    applyExtractedDataToSource(source, extracted);
    source.redirectCount = redirectCount;
    source.canonicalUrl = canonicalUrl;

    const hasMetadata = Boolean(
      source.title ||
      source.description ||
      source.image ||
      source.canonicalUrl ||
      source.price !== null ||
      source.categorySuggestion
    );

    if (!hasMetadata) {
      return json({
        ok: false,
        source,
        analysis: buildSourcePreviewAnalysis(source, false),
        message: fallbackMessage,
        limitations: [
          '页面没有返回可用的公开商品标题、图片、价格、类目、description 或 canonical 元数据。',
          '平台可能阻止 Worker 读取、需要动态渲染，或只在登录/客户端环境返回商品信息。'
        ],
        finalUrl,
        redirectCount
      });
    }

    const analysis = buildSourcePreviewAnalysis(source, true);

    return json({
      ok: true,
      source,
      analysis,
      finalUrl,
      redirectCount,
      limitations: [
        '仅读取公开页面返回内容：JSON-LD Product、Open Graph、Twitter card、常见商品 meta、title、canonical 和保守可见价格文本。',
        redirectCount > 0 ? `已安全跟随 ${redirectCount} 次公开 GET 跳转。` : '',
        source.price === null ? NO_PRICE_NOTICE : '',
        source.priceRole === 'candidate_source_cost' ? SUPPLIER_PRICE_NOTICE : '',
        source.priceRole === 'market_reference_price' ? MARKETPLACE_PRICE_NOTICE : '',
        '不读取库存、SKU、规格、评论、销量、卖家私有数据、订单、隐藏数据或登录后数据。'
      ]
        .filter(Boolean)
    });
  } catch (error) {
    const aborted = error && error.name === 'AbortError';
    return json(sourcePreviewFallback(sourceUrl, aborted
      ? '公开页面读取超时，请手动填写商品标题、采购价和类目信息。'
      : SOURCE_PREVIEW_FALLBACK_MESSAGE, [
      aborted ? '公开页面读取超过 5 秒。' : cleanText(error.message, 160)
    ]));
  } finally {
    clearTimeout(timeout);
  }
}

function hasOzonCredentials(env) {
  return Boolean(env.OZON_CLIENT_ID && env.OZON_API_KEY);
}

function parseStoreRegistry(env) {
  const stores = [];

  if (env.STORE_API_CREDENTIALS_JSON) {
    try {
      const parsed = JSON.parse(env.STORE_API_CREDENTIALS_JSON);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item && item.platform && item.credentialRef) stores.push(item);
        });
      }
    } catch (error) {
      // Invalid registry JSON is reported through health endpoints.
    }
  }

  if (hasOzonCredentials(env) && !stores.some(item => item.platform === 'Ozon' && item.credentialRef === 'OZON_MAIN')) {
    stores.push({
      platform: 'Ozon',
      name: 'Ozon 默认店铺',
      credentialRef: 'OZON_MAIN',
      clientId: env.OZON_CLIENT_ID,
      apiKey: env.OZON_API_KEY
    });
  }

  return stores;
}

function publicStoreProfile(store) {
  return {
    platform: store.platform,
    name: store.name || store.credentialRef,
    credentialRef: store.credentialRef,
    status: '后端已配置真实凭证'
  };
}

function findStoreCredentials(env, platform, credentialRef) {
  return parseStoreRegistry(env).find(store => {
    return store.platform === platform && store.credentialRef === credentialRef;
  }) || null;
}

function hasStoreCredentials(store) {
  if (!store) return false;
  if (store.platform === 'Ozon') return Boolean(store.clientId && store.apiKey);
  if (store.platform === 'Wildberries') return Boolean(store.token || store.apiKey);
  if (store.platform === 'Yandex') return Boolean(store.apiKey || store.token);
  return false;
}

function maskClientId(clientId) {
  const clean = String(clientId || '').trim();
  if (!clean) return '';
  if (clean.length <= 4) return clean[0] + '***';
  return clean.slice(0, 2) + '***' + clean.slice(-2);
}

async function ozonRequest(credentials, path, body) {
  const response = await fetch(OZON_API_BASE + path, {
    method: 'POST',
    headers: {
      'Client-Id': credentials.clientId,
      'Api-Key': credentials.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = { raw: cleanText(text, 500) };
  }

  return { response, data };
}

function buildOzonProductListRequest(limit) {
  const numericLimit = Number(limit);
  const safeLimit = Number.isFinite(numericLimit) ? Math.min(Math.max(Math.floor(numericLimit), 1), 5) : 1;

  return {
    filter: { visibility: 'ALL' },
    limit: safeLimit
  };
}

async function testOzonConnection(request) {
  // STORE SAFETY GUARD:
  // This test endpoint is read-only only. It must never call Ozon create,
  // update, delete, price, stock, order, shipment, logistics, warehouse, or ad
  // mutation endpoints. It only verifies credentials with a minimal list/read
  // request and returns sanitized connection status.
  const timestamp = new Date().toISOString();
  const body = await request.json().catch(() => ({}));
  const clientId = String(body.clientId || '').trim();
  const apiKey = String(body.apiKey || '').trim();
  const maskedClientId = maskClientId(clientId);

  if (!clientId || !apiKey) {
    return json({
      connected: false,
      message: 'Missing Ozon Client ID or API Key.',
      maskedClientId,
      timestamp
    }, 400);
  }

  try {
    // Minimal read-only authentication check. This endpoint is already used by
    // the Worker health path and requests only one product record.
    const { response } = await ozonRequest({ clientId, apiKey }, '/v3/product/list', buildOzonProductListRequest(1));

    if (!response.ok) {
      const authError = response.status === 401 || response.status === 403;
      return json({
        connected: false,
        message: authError
          ? 'Ozon rejected the credentials. Check Client ID, API Key, and seller API permissions.'
          : `Ozon API test failed with HTTP ${response.status}.`,
        maskedClientId,
        timestamp
      });
    }

    return json({
      connected: true,
      message: 'Ozon API authentication succeeded through the Cloudflare Worker.',
      maskedClientId,
      timestamp
    });
  } catch (error) {
    return json({
      connected: false,
      message: 'Ozon API test failed through the Worker: ' + cleanText(error.message, 180),
      maskedClientId,
      timestamp
    }, 502);
  }
}

function normalizeOzonProductItem(item) {
  return {
    product_id: item.product_id || item.id || null,
    offer_id: item.offer_id || '',
    sku: item.sku || null,
    name: item.name || item.title || '',
    visibility: item.visibility || item.status || '',
    price: item.price || item.marketing_price || item.old_price || '',
    currency_code: item.currency_code || item.currency || ''
  };
}

function normalizeOzonProductSummaryItem(item) {
  const images = Array.isArray(item.images) ? item.images : [];
  const stocks = item.stocks && typeof item.stocks === 'object' ? item.stocks : {};
  const statuses = item.statuses && typeof item.statuses === 'object' ? item.statuses : {};

  return {
    product_id: item.product_id || item.id || null,
    offer_id: item.offer_id || '',
    name: item.name || item.title || '',
    visibility: item.visibility || statuses.visibility || '',
    status: item.status || statuses.status_name || statuses.moderate_status || 'unknown',
    price: item.price || item.marketing_price || item.old_price || null,
    currency_code: item.currency_code || item.currency || null,
    stock: Number.isFinite(stocks.present) ? stocks.present : null,
    sellable: typeof item.visible === 'boolean' ? item.visible : null,
    image: item.primary_image || images[0] || null,
    product_url: item.product_url || item.link || null
  };
}

function extractOzonListItems(data) {
  const result = data && data.result ? data.result : {};
  const items = Array.isArray(result.items) ? result.items : [];

  return items.map(normalizeOzonProductItem);
}

function extractOzonInfoItems(data) {
  const result = data && data.result ? data.result : {};
  const items = Array.isArray(result.items)
    ? result.items
    : Array.isArray(result)
      ? result
      : [];

  return items.map(normalizeOzonProductItem);
}

function getOzonProductListItems(data) {
  if (!data || !data.result || !Array.isArray(data.result.items)) return null;
  return data.result.items;
}

function getOzonProductInfoItems(data) {
  if (!data || !data.result) return null;
  if (Array.isArray(data.result.items)) return data.result.items;
  if (Array.isArray(data.result)) return data.result;
  return null;
}

function parseProductSummaryLimit(value) {
  const number = Number(value);
  const requested = Number.isFinite(number) ? Math.floor(number) : null;
  const fallback = 3;
  const limit = requested === null ? fallback : Math.min(Math.max(requested, 1), 5);

  return {
    requestedLimit: requested,
    limit,
    limitClamped: requested !== null && requested !== limit
  };
}

function readProductSummaryLimit(body) {
  if (Object.prototype.hasOwnProperty.call(body, 'limit')) return body.limit;
  if (Object.prototype.hasOwnProperty.call(body, 'productLimit')) return body.productLimit;
  if (Object.prototype.hasOwnProperty.call(body, 'sampleLimit')) return body.sampleLimit;
  return undefined;
}

function buildSourcePlaceholder(sourceUrl) {
  const url = String(sourceUrl || '').trim();
  let host = '';

  if (isValidHttpUrl(url)) {
    host = new URL(url).hostname.replace(/^www\./, '');
  }

  return {
    url,
    host,
    title: '',
    image: ''
  };
}

function buildProductSummaryInsights() {
  return {
    category: '待人工复核',
    keywords: [],
    tags: [],
    sellingPoints: [],
    painPoints: []
  };
}

function productSummaryPayload(body, ozon, ok = false, status = 200) {
  return json({
    ok,
    source: buildSourcePlaceholder(body && body.sourceUrl),
    insights: buildProductSummaryInsights(),
    ozon,
    limitations: [
      'Phase 2.5 只读取 1-5 条授权店铺商品样本。',
      '不执行商品同步、分页、订单、财务、广告、库存或价格写入。'
    ]
  }, status);
}

async function handleOzonProductSummary(request) {
  // STORE SAFETY GUARD:
  // This endpoint is read-only only. It accepts temporary credentials for the
  // current request, never stores them, and only calls the existing product
  // list/detail read endpoints for a 1-5 product sample.
  const timestamp = new Date().toISOString();
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({
      ok: false,
      error: 'Missing or invalid JSON request body.',
      ozon: {
        status: 'invalid_request',
        message: '请发送 JSON 请求体；Worker 不会保存任何 Ozon 凭证。',
        products: [],
        sampleCount: 0,
        timestamp
      }
    }, 400);
  }

  const clientId = String(body.clientId || body.ozonClientId || '').trim();
  const apiKey = String(body.apiKey || body.ozonApiKey || '').trim();
  const hasCredentialFields = Object.prototype.hasOwnProperty.call(body, 'clientId')
    || Object.prototype.hasOwnProperty.call(body, 'ozonClientId')
    || Object.prototype.hasOwnProperty.call(body, 'apiKey')
    || Object.prototype.hasOwnProperty.call(body, 'ozonApiKey');
  const maskedClientId = maskClientId(clientId);
  const limitInfo = parseProductSummaryLimit(readProductSummaryLimit(body));

  if (!clientId || !apiKey) {
    return productSummaryPayload(body, {
      status: hasCredentialFields ? 'missing_credentials' : 'api_not_connected',
      message: '缺少临时 Ozon Client ID 或 API Key。本端点不会从前端存储读取凭证，也不会保存凭证。',
      products: [],
      sampleCount: 0,
      requestedLimit: limitInfo.requestedLimit,
      limit: limitInfo.limit,
      limitClamped: limitInfo.limitClamped,
      maskedClientId,
      timestamp
    });
  }

  try {
    const productListRequest = buildOzonProductListRequest(limitInfo.limit);
    const list = await ozonRequest({ clientId, apiKey }, '/v3/product/list', productListRequest);

    if (!list.response.ok) {
      const authError = list.response.status === 401 || list.response.status === 403;
      return productSummaryPayload(body, {
        status: authError ? 'permission_error' : 'product_list_error',
        message: authError
          ? 'Ozon 拒绝了本次临时凭证。请检查 Client ID、API Key 和只读权限。'
          : `Ozon product/list 读取失败：HTTP ${list.response.status}。请求体已限制为 filter.visibility=ALL 和 limit=${productListRequest.limit}，请检查 Ozon product/list 合约或店铺 API 权限。`,
        products: [],
        sampleCount: 0,
        requestedLimit: limitInfo.requestedLimit,
        limit: limitInfo.limit,
        limitClamped: limitInfo.limitClamped,
        failureStep: 'product_list',
        diagnostic: {
          step: 'product_list',
          endpoint: 'POST /v3/product/list',
          httpStatus: list.response.status,
          request: {
            visibility: productListRequest.filter.visibility,
            limit: productListRequest.limit
          },
          ozonError: safeOzonError(list.data, [clientId, apiKey])
        },
        maskedClientId,
        timestamp
      });
    }

    const listItems = getOzonProductListItems(list.data);

    if (!listItems) {
      return productSummaryPayload(body, {
        status: 'malformed_response',
        message: 'Ozon product/list 返回结构不符合预期，未读取商品样本。',
        products: [],
        sampleCount: 0,
        requestedLimit: limitInfo.requestedLimit,
        limit: limitInfo.limit,
        limitClamped: limitInfo.limitClamped,
        maskedClientId,
        timestamp
      }, false, 502);
    }

    const listProducts = listItems.map(normalizeOzonProductSummaryItem).slice(0, limitInfo.limit);
    const productIds = listProducts.map(item => item.product_id).filter(Boolean).slice(0, limitInfo.limit);
    const offerIds = listProducts.map(item => item.offer_id).filter(Boolean).slice(0, limitInfo.limit);
    let products = listProducts;
    let detailStatus = productIds.length || offerIds.length ? 'not_requested' : 'empty_catalog';

    if (productIds.length || offerIds.length) {
      const infoBody = productIds.length
        ? { product_id: productIds }
        : { offer_id: offerIds };
      const info = await ozonRequest({ clientId, apiKey }, '/v3/product/info/list', infoBody);

      if (info.response.ok) {
        const infoItems = getOzonProductInfoItems(info.data);
        if (infoItems) {
          const detailProducts = infoItems.map(normalizeOzonProductSummaryItem).slice(0, limitInfo.limit);
          if (detailProducts.length) products = detailProducts;
          detailStatus = 'connected';
        } else {
          detailStatus = 'malformed_response';
        }
      } else {
        detailStatus = `product_info_error_${info.response.status}`;
      }
    }

    return productSummaryPayload(body, {
      status: 'connected',
      message: `Ozon API 已通过 Worker 读取 ${products.length} 条只读商品样本。`,
      products,
      sampleCount: products.length,
      requestedLimit: limitInfo.requestedLimit,
      limit: limitInfo.limit,
      limitClamped: limitInfo.limitClamped,
      detailStatus,
      maskedClientId,
      timestamp
    }, true);
  } catch (error) {
    return productSummaryPayload(body, {
      status: 'api_error',
      message: 'Ozon 商品摘要读取异常：' + cleanText(error.message, 180),
      products: [],
      sampleCount: 0,
      requestedLimit: limitInfo.requestedLimit,
      limit: limitInfo.limit,
      limitClamped: limitInfo.limitClamped,
      maskedClientId,
      timestamp
    }, false, 502);
  }
}

async function checkOzonApi(env, store) {
  const credentials = store || findStoreCredentials(env, 'Ozon', 'OZON_MAIN');

  if (!credentials || !credentials.clientId || !credentials.apiKey) {
    return {
      status: 'missing_credentials',
      message: '等待 Ozon API 授权：Cloudflare 环境变量 OZON_CLIENT_ID / OZON_API_KEY 尚未完整配置。'
    };
  }

  try {
    const { response, data } = await ozonRequest(credentials, '/v3/product/list', {
      filter: { visibility: 'ALL' },
      limit: 10
    });

    if (!response.ok) {
      return {
        status: response.status === 403 || response.status === 401 ? 'permission_error' : 'api_error',
        message: `Ozon API 已配置但连接失败：HTTP ${response.status}。请检查 Client ID、API Key 和店铺权限。`
      };
    }

    const listProducts = extractOzonListItems(data);
    const productIds = listProducts.map(item => item.product_id).filter(Boolean).slice(0, 10);
    const offerIds = listProducts.map(item => item.offer_id).filter(Boolean).slice(0, 10);
    let products = listProducts;
    let detailStatus = productIds.length || offerIds.length ? 'not_requested' : 'empty_catalog';

    if (productIds.length || offerIds.length) {
      const infoBody = productIds.length
        ? { product_id: productIds }
        : { offer_id: offerIds };
      const info = await ozonRequest(credentials, '/v3/product/info/list', infoBody);

      if (info.response.ok) {
        const detailProducts = extractOzonInfoItems(info.data);
        if (detailProducts.length) products = detailProducts;
        detailStatus = 'connected';
      } else {
        detailStatus = `product_info_error_${info.response.status}`;
      }
    }

    const count = listProducts.length;
    return {
      status: 'connected',
      message: `${credentials.name || 'Ozon 店铺'} API 已连接，已读取 ${count} 条店铺商品样本。`,
      sampleCount: count,
      detailStatus,
      products: products.slice(0, 5)
    };
  } catch (error) {
    return {
      status: 'api_error',
      message: 'Ozon API 连接异常：' + error.message
    };
  }
}

async function checkWildberriesApi(store) {
  const token = store && (store.token || store.apiKey);

  if (!token) {
    return {
      status: 'missing_credentials',
      message: '等待 Wildberries API Token。'
    };
  }

  try {
    const response = await fetch(WB_ANALYTICS_API_BASE + '/ping', {
      headers: { Authorization: token }
    });

    if (!response.ok) {
      return {
        status: response.status === 401 || response.status === 403 ? 'permission_error' : 'api_error',
        message: `Wildberries API 已配置但连接失败：HTTP ${response.status}。`
      };
    }

    return {
      status: 'connected',
      message: `${store.name || 'Wildberries 店铺'} API 已连接，后续可接入分析和报表数据。`,
      products: []
    };
  } catch (error) {
    return {
      status: 'api_error',
      message: 'Wildberries API 连接异常：' + error.message
    };
  }
}

async function checkYandexApi(store) {
  const token = store && (store.apiKey || store.token);

  if (!token) {
    return {
      status: 'missing_credentials',
      message: '等待 Yandex Market API Key。'
    };
  }

  try {
    const response = await fetch(YANDEX_MARKET_API_BASE + '/campaigns', {
      headers: { Authorization: 'Api-Key ' + token }
    });

    if (!response.ok) {
      return {
        status: response.status === 401 || response.status === 403 ? 'permission_error' : 'api_error',
        message: `Yandex Market API 已配置但连接失败：HTTP ${response.status}。`
      };
    }

    const data = await response.json().catch(() => ({}));
    const campaigns = data && data.campaigns && Array.isArray(data.campaigns) ? data.campaigns : [];
    return {
      status: 'connected',
      message: `${store.name || 'Yandex 店铺'} API 已连接，返回 ${campaigns.length} 个 campaign。`,
      sampleCount: campaigns.length,
      products: []
    };
  } catch (error) {
    return {
      status: 'api_error',
      message: 'Yandex Market API 连接异常：' + error.message
    };
  }
}

async function checkStoreApi(env, platform, credentialRef) {
  const store = findStoreCredentials(env, platform, credentialRef);

  if (!store || !hasStoreCredentials(store)) {
    return {
      status: 'missing_credentials',
      message: `${platform} 店铺 ${credentialRef || ''} 未在后端配置真实 API 凭证。`
    };
  }

  if (platform === 'Ozon') return checkOzonApi(env, store);
  if (platform === 'Wildberries') return checkWildberriesApi(store);
  if (platform === 'Yandex') return checkYandexApi(store);

  return {
    status: 'not_supported',
    message: `${platform} 暂未接入 API adapter。`
  };
}

function percent(value) {
  return Number.isFinite(value) ? value.toFixed(2) + '%' : '未填写';
}

function rub(value) {
  return Number.isFinite(value) ? value.toFixed(2) + ' ₽' : '未填写';
}

function buildReport(sourceData, ozon, profitSnapshot) {
  const profitRate = profitSnapshot && Number.isFinite(profitSnapshot.profitRate) ? profitSnapshot.profitRate : null;
  const profit = profitSnapshot && Number.isFinite(profitSnapshot.profit) ? profitSnapshot.profit : 0;
  const type = profitRate === null ? 'waiting' : profit < 0 || profitRate < 10 ? 'risk' : profitRate < 20 ? 'warning' : 'test';
  const status = type === 'risk' ? '暂不建议' : type === 'warning' ? '谨慎测试' : type === 'waiting' ? '数据不足' : '建议小量测试';
  const actions = [
    profitRate !== null && profitRate < 10 ? '利润率低于 10%，暂不建议直接开广告。' : '先用小预算验证 Ozon 搜索关键词和点击转化。',
    ozon.status === 'connected' ? '下一步可继续接入 Ozon 商品、价格或广告报告接口。' : '先完成 Ozon API 授权和 Worker 环境变量配置。',
    '人工复核类目、主图、标题和规格，避免 AI 识别误判。'
  ];
  const sampleText = Array.isArray(ozon.products) && ozon.products.length
    ? ' 店铺样本商品：' + ozon.products
      .map(item => `${item.offer_id || item.product_id || '未命名'}${item.name ? ' / ' + item.name : ''}`)
      .join('；')
    : '';

  return {
    type,
    status,
    summary: `已读取 ${sourceData.source.host}，识别到“${sourceData.source.title || '未识别标题'}”。${ozon.message}`,
    priceText: `当前售价折合约 ${rub(profitSnapshot && profitSnapshot.saleRub)}。Phase 4A 暂不生成未经验证的 Ozon 竞品均价。`,
    profitText: profitRate === null
      ? '等待有效利润测算。'
      : `当前利润约 ¥${profit.toFixed(2)}，利润率约 ${percent(profitRate)}。`,
    competitionText: ozon.status === 'connected'
      ? 'Ozon API 健康检查已通过，已能读取你店铺的商品样本。相似竞品数量、均价、评分评论仍需要后续接入可用报告或合规数据源。' + sampleText
      : ozon.message,
    adText: '广告判断基于当前利润测算。新品建议先小预算测试搜索与推荐，不直接放量。',
    storeText: `类目候选：${sourceData.insights.category}。关键词：${sourceData.insights.keywords.join('、') || '待提取'}。`,
    actions
  };
}

async function handleAnalyze(request, env) {
  const body = await request.json().catch(() => null);
  const sourceUrl = body && body.sourceUrl;
  const selectedStore = body && body.selectedStore ? body.selectedStore : null;

  if (!isValidHttpUrl(sourceUrl)) {
    return json({ ok: false, error: '请提供有效的 http/https 商品链接。' }, 400);
  }

  let sourceData;
  const limitations = ['Phase 4A 只使用公开页面信息和 Ozon 官方 API 健康检查，不生成未经验证的全平台竞品数据。'];

  try {
    const sourcePreviewRequest = new Request('https://worker.local/api/source/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: sourceUrl })
    });
    const sourcePreviewResponse = await handleSourcePreview(sourcePreviewRequest);
    const sourcePreview = await sourcePreviewResponse.json();
    const source = sourcePreview.source || buildSourcePreviewSource(sourceUrl);

    sourceData = {
      source: {
        url: source.url || sourceUrl,
        finalUrl: source.finalUrl || sourcePreview.finalUrl || source.url || sourceUrl,
        host: source.host || new URL(sourceUrl).hostname.replace(/^www\./, ''),
        platform: source.platform || inferSourcePlatform(source.host),
        platformType: source.platformType || 'unknown',
        title: source.title || '',
        description: source.description || '',
        image: source.image || '',
        canonicalUrl: source.canonicalUrl || '',
        price: source.price === undefined ? null : source.price,
        currency: source.currency || '',
        priceRole: source.priceRole || 'unknown',
        categorySuggestion: source.categorySuggestion || '',
        confidence: source.confidence || { title: 'none', price: 'none', category: 'none' },
        extractionSources: source.extractionSources || { title: '', price: '', image: '', category: '' }
      },
      insights: {
        category: source.categorySuggestion || '待人工复核',
        keywords: [],
        tags: [],
        sellingPoints: [],
        painPoints: sourcePreview.ok ? [] : ['来源公开元数据无法自动读取']
      }
    };

    if (sourcePreview.limitations && sourcePreview.limitations.length) {
      limitations.push(...sourcePreview.limitations);
    }

    if (!sourcePreview.ok && sourcePreview.message) limitations.push(sourcePreview.message);
  } catch (error) {
    sourceData = {
      source: {
        url: sourceUrl,
        finalUrl: sourceUrl,
        host: new URL(sourceUrl).hostname.replace(/^www\./, ''),
        platform: inferSourcePlatform(new URL(sourceUrl).hostname.replace(/^www\./, '')),
        platformType: 'unknown',
        title: '',
        description: '',
        image: '',
        canonicalUrl: '',
        price: null,
        currency: '',
        priceRole: 'unknown',
        categorySuggestion: '',
        confidence: { title: 'none', price: 'none', category: 'none' },
        extractionSources: { title: '', price: '', image: '', category: '' }
      },
      insights: {
        category: '待人工复核',
        keywords: [],
        tags: [],
        sellingPoints: [],
        painPoints: ['来源页面无法自动读取']
      }
    };
    limitations.push(error.message);
  }

  const ozon = selectedStore && selectedStore.platform && selectedStore.credentialRef
    ? await checkStoreApi(env, selectedStore.platform, selectedStore.credentialRef)
    : await checkOzonApi(env);
  const report = buildReport(sourceData, ozon, body.profitSnapshot || {});

  return json({
    ok: true,
    ...sourceData,
    ozon,
    limitations,
    report
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      const ozon = await checkOzonApi(env);
      return json({
        ok: true,
        service: 'ozon-ai-profit-assistant-worker',
        ozon,
        stores: parseStoreRegistry(env).map(publicStoreProfile)
      });
    }

    if (url.pathname === '/api/source/preview' && request.method !== 'POST') {
      return json({
        ok: false,
        error: 'Method not allowed. Use POST /api/source/preview.'
      }, 405);
    }

    if (url.pathname === '/api/source/preview' && request.method === 'POST') {
      return handleSourcePreview(request);
    }

    if (url.pathname === '/api/stores') {
      return json({
        ok: true,
        stores: parseStoreRegistry(env).map(publicStoreProfile)
      });
    }

    if (url.pathname === '/api/store-health' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const result = await checkStoreApi(env, body.platform, body.credentialRef);
      return json({ ok: true, store: body, result });
    }

    if (url.pathname === '/api/ozon/test-connection' && request.method === 'POST') {
      return testOzonConnection(request);
    }

    if (url.pathname === '/api/ozon/product-summary' && request.method !== 'POST') {
      return json({
        ok: false,
        error: 'Method not allowed. Use POST /api/ozon/product-summary.'
      }, 405);
    }

    if (url.pathname === '/api/ozon/product-summary' && request.method === 'POST') {
      return handleOzonProductSummary(request);
    }

    if (url.pathname === '/api/analyze-product' && request.method === 'POST') {
      return handleAnalyze(request, env);
    }

    return json({ ok: false, error: 'Not found' }, 404);
  }
};
