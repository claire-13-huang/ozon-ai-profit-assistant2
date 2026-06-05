const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const OZON_API_BASE = 'https://api-seller.ozon.ru';
const WB_ANALYTICS_API_BASE = 'https://seller-analytics-api.wildberries.ru';
const YANDEX_MARKET_API_BASE = 'https://api.partner.market.yandex.ru';

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
  if (/(^|\.)1688\.com$/.test(cleanHost)) return '1688';
  if (/(^|\.)taobao\.com$/.test(cleanHost)) return 'Taobao';
  if (/(^|\.)tmall\.com$/.test(cleanHost)) return 'Tmall';
  if (/(^|\.)amazon\./.test(cleanHost)) return 'Amazon';
  if (/(^|\.)ozon\./.test(cleanHost)) return 'Ozon marketplace';
  if (/(^|\.)aliexpress\./.test(cleanHost)) return 'AliExpress';
  return cleanHost || 'External source';
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

  return {
    url: url ? url.toString() : cleanUrl,
    host,
    platform: inferSourcePlatform(host),
    title: '',
    image: '',
    description: '',
    canonicalUrl: ''
  };
}

function sourcePreviewFallback(urlValue, message, limitations = []) {
  return {
    ok: false,
    source: buildSourcePreviewSource(urlValue),
    message: message || '无法自动读取该链接的公开页面信息，请手动填写商品标题、采购价和类目信息。',
    limitations
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
    const response = await fetch(sourceUrl, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.2'
      }
    });

    if (response.status >= 300 && response.status < 400) {
      return json(sourcePreviewFallback(sourceUrl, '该页面返回跳转，当前不会自动跟随跳转读取公开信息，请手动填写商品标题、采购价和类目信息。', [
        'source preview 不自动跟随跳转，避免访问非预期地址。'
      ]));
    }

    if (!response.ok) {
      return json(sourcePreviewFallback(sourceUrl, '无法自动读取该链接的公开页面信息，请手动填写商品标题、采购价和类目信息。', [
        `公开页面返回 HTTP ${response.status}。`
      ]));
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType && !/html|text\/plain|application\/xhtml/i.test(contentType)) {
      return json(sourcePreviewFallback(sourceUrl, '该链接返回的不是可读取的公开 HTML 页面，请手动填写商品标题、采购价和类目信息。', [
        `content-type: ${cleanText(contentType, 80)}`
      ]));
    }

    const html = await readTextWithLimit(response);
    const title = extractTitle(html);
    const description = cleanMetadataText(extractMeta(html, 'description'), 300);
    const image = extractImage(html, sourceUrl);
    const canonicalUrl = extractCanonicalUrl(html, sourceUrl);
    const source = buildSourcePreviewSource(sourceUrl);
    const hasMetadata = Boolean(title || description || image || canonicalUrl);

    source.title = title;
    source.image = image;
    source.description = description;
    source.canonicalUrl = canonicalUrl;

    if (!hasMetadata) {
      return json({
        ok: false,
        source,
        message: '无法自动读取该链接的公开页面信息，请手动填写商品标题、采购价和类目信息。',
        limitations: [
          '页面没有返回 title、Open Graph image、description 或 canonical 元数据。'
        ]
      });
    }

    return json({
      ok: true,
      source,
      limitations: [
        '仅读取公开页面元数据：title、og:title、og:image、description、canonical。',
        '不读取价格、库存、SKU、规格、评论、销量、隐藏数据或登录后数据。'
      ]
    });
  } catch (error) {
    const aborted = error && error.name === 'AbortError';
    return json(sourcePreviewFallback(sourceUrl, aborted
      ? '公开页面读取超时，请手动填写商品标题、采购价和类目信息。'
      : '无法自动读取该链接的公开页面信息，请手动填写商品标题、采购价和类目信息。', [
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
        host: source.host || new URL(sourceUrl).hostname.replace(/^www\./, ''),
        title: source.title || '',
        description: source.description || '',
        image: source.image || ''
      },
      insights: {
        category: '待人工复核',
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
        host: new URL(sourceUrl).hostname.replace(/^www\./, ''),
        title: '',
        description: '',
        image: ''
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
