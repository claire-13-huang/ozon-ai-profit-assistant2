const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const OZON_API_BASE = 'https://api-seller.ozon.ru';

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

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (error) {
    return false;
  }
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
    if (match) return cleanText(match[1], 500);
  }

  return '';
}

function extractTitle(html) {
  return cleanText(extractMeta(html, 'og:title') || (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1], 180);
}

function extractImage(html, baseUrl) {
  const raw = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image');
  if (!raw) return '';

  try {
    return new URL(raw, baseUrl).toString();
  } catch (error) {
    return '';
  }
}

function unique(items, max = 10) {
  return [...new Set(items.map(item => cleanText(item, 32)).filter(Boolean))].slice(0, max);
}

function inferCategory(text) {
  const lower = text.toLowerCase();
  const rules = [
    { category: '服饰 / 配饰', words: ['dress', 'shirt', 'clothes', 'одеж', 'плать', '鞋', '衣', '服', '包'] },
    { category: '家居 / 收纳', words: ['home', 'kitchen', 'storage', 'organizer', 'кух', 'дом', '收纳', '厨房', '家居'] },
    { category: '美妆 / 个护', words: ['beauty', 'makeup', 'skin', 'cosmetic', 'космет', '护肤', '美妆'] },
    { category: '车品 / 工具', words: ['auto', 'car', 'tool', 'авто', 'машин', '车', '工具'] },
    { category: '电子 / 小家电', words: ['usb', 'phone', 'charger', 'electronic', 'смартфон', '电子', '充电'] },
    { category: '母婴 / 玩具', words: ['baby', 'toy', 'kids', 'ребен', 'игруш', '玩具', '儿童', '母婴'] }
  ];

  const matched = rules.find(rule => rule.words.some(word => lower.includes(word)));
  return matched ? matched.category : '待人工复核';
}

function extractKeywords(title, description, keywordMeta) {
  const keywordParts = keywordMeta
    ? keywordMeta.split(/[,，;；|]/)
    : [];
  const titleParts = `${title} ${description}`
    .split(/[^\p{L}\p{N}\u4e00-\u9fa5]+/u)
    .filter(word => word.length >= 2 && word.length <= 18);
  return unique([...keywordParts, ...titleParts], 8);
}

async function fetchSourceProduct(sourceUrl) {
  const response = await fetch(sourceUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 Ozon AI Profit Assistant Bot'
    }
  });

  if (!response.ok) {
    throw new Error(`来源页面读取失败：${response.status}`);
  }

  const html = (await response.text()).slice(0, 250000);
  const title = extractTitle(html);
  const description = extractMeta(html, 'description') || extractMeta(html, 'og:description');
  const keywords = extractKeywords(title, description, extractMeta(html, 'keywords'));
  const category = inferCategory(`${title} ${description} ${keywords.join(' ')}`);
  const host = new URL(sourceUrl).hostname.replace(/^www\./, '');

  return {
    source: {
      url: sourceUrl,
      host,
      title,
      description: cleanText(description, 300),
      image: extractImage(html, sourceUrl)
    },
    insights: {
      category,
      keywords,
      tags: unique([category, host, ...keywords.slice(0, 3)], 6),
      sellingPoints: keywords.slice(0, 3),
      painPoints: ['需要人工复核评价痛点', '需要确认 Ozon 类目匹配', '需要验证广告成本']
    }
  };
}

function hasOzonCredentials(env) {
  return Boolean(env.OZON_CLIENT_ID && env.OZON_API_KEY);
}

async function ozonRequest(env, path, body) {
  const response = await fetch(OZON_API_BASE + path, {
    method: 'POST',
    headers: {
      'Client-Id': env.OZON_CLIENT_ID,
      'Api-Key': env.OZON_API_KEY,
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

async function checkOzonApi(env) {
  if (!hasOzonCredentials(env)) {
    return {
      status: 'missing_credentials',
      message: '等待 Ozon API 授权：Cloudflare 环境变量 OZON_CLIENT_ID / OZON_API_KEY 尚未完整配置。'
    };
  }

  try {
    const { response, data } = await ozonRequest(env, '/v3/product/list', {
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
      const info = await ozonRequest(env, '/v3/product/info/list', infoBody);

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
      message: `Ozon API 已连接，已读取 ${count} 条店铺商品样本。`,
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

  if (!isValidHttpUrl(sourceUrl)) {
    return json({ ok: false, error: '请提供有效的 http/https 商品链接。' }, 400);
  }

  let sourceData;
  const limitations = ['Phase 4A 只使用公开页面信息和 Ozon 官方 API 健康检查，不生成未经验证的全平台竞品数据。'];

  try {
    sourceData = await fetchSourceProduct(sourceUrl);
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

  const ozon = await checkOzonApi(env);
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
        ozon
      });
    }

    if (url.pathname === '/api/analyze-product' && request.method === 'POST') {
      return handleAnalyze(request, env);
    }

    return json({ ok: false, error: 'Not found' }, 404);
  }
};
