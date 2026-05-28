// 店铺 API 档案管理：只保存店铺元信息，不保存真实 API Key。
const STORE_API_STORAGE_KEY = 'ozon-profit-store-api-profiles-v1';

const STORE_API_PLAN_LIMITS = {
  free: 1,
  monthly: 5,
  yearly: 10
};

const STORE_API_PLAN_LABELS = {
  free: '未开通会员',
  monthly: '月卡',
  yearly: '年卡'
};

function defaultStoreApiState() {
  return {
    plan: 'free',
    stores: []
  };
}

function loadStoreApiState() {
  try {
    if (typeof localStorage === 'undefined') return defaultStoreApiState();
    const raw = localStorage.getItem(STORE_API_STORAGE_KEY);
    if (!raw) return defaultStoreApiState();
    const parsed = JSON.parse(raw);
    return {
      plan: STORE_API_PLAN_LIMITS[parsed.plan] ? parsed.plan : 'free',
      stores: Array.isArray(parsed.stores) ? parsed.stores : []
    };
  } catch (error) {
    return defaultStoreApiState();
  }
}

function saveStoreApiState(state) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORE_API_STORAGE_KEY, JSON.stringify({
      plan: state.plan,
      stores: state.stores,
      savedAt: new Date().toISOString()
    }));
  } catch (error) {
    // localStorage 不可用时不阻断页面主流程。
  }
}

function storeApiLimit(plan) {
  return STORE_API_PLAN_LIMITS[plan] || STORE_API_PLAN_LIMITS.free;
}

function platformStoreCounts(stores) {
  return stores.reduce((counts, store) => {
    counts[store.platform] = (counts[store.platform] || 0) + 1;
    return counts;
  }, {});
}

function createStoreApiProfile(input) {
  const platform = String(input.platform || '').trim();
  const name = String(input.name || '').trim();
  const credentialRef = String(input.credentialRef || '').trim();

  if (!platform || !name || !credentialRef) {
    return { error: '请填写平台、店铺名称和后端连接档案 ID。' };
  }

  return {
    store: {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      platform,
      name,
      credentialRef,
      status: '等待后端连接档案配置',
      createdAt: new Date().toISOString()
    }
  };
}

function isLocalWorkerUrl(url) {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname);
}

function normalizeOzonWorkerUrl(value) {
  if (typeof normalizeWorkerBaseUrl === 'function') {
    return normalizeWorkerBaseUrl(value);
  }

  return String(value || '').trim().replace(/\/+$/, '');
}

function validateWorkerUrlForCredentials(workerUrl) {
  const normalized = normalizeOzonWorkerUrl(workerUrl || window.PRODUCT_SELECTION_API_BASE_URL || '');

  if (!normalized) {
    return {
      error: 'backend_not_configured',
      message: '尚未配置 Cloudflare Worker URL，前端不会发送 Client ID 或 API Key。'
    };
  }

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'https:' && !isLocalWorkerUrl(url)) {
      return {
        error: 'insecure_worker_url',
        message: '为保护 API Key，真实店铺测试必须使用 HTTPS Worker URL；本地 localhost 调试除外。'
      };
    }
  } catch (error) {
    return {
      error: 'invalid_worker_url',
      message: 'Worker URL 格式不正确，请填写有效的 HTTPS 地址。'
    };
  }

  return { workerUrl: normalized };
}

async function requestOzonTemporaryConnectionTest(input) {
  const worker = validateWorkerUrlForCredentials(input.workerUrl);

  if (worker.error) {
    return {
      ok: false,
      status: worker.error,
      message: worker.message
    };
  }

  const clientId = String(input.clientId || '').trim();
  const apiKey = String(input.apiKey || '').trim();

  if (!clientId || !apiKey) {
    return {
      ok: false,
      status: 'missing_credentials',
      message: '请填写 Ozon Client ID 和 API Key。凭证只会用于本次页面会话中的 Worker 连接测试。'
    };
  }

  const response = await fetch(worker.workerUrl + '/api/ozon/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storeName: String(input.storeName || '').trim(),
      clientId,
      apiKey
    })
  });

  if (response.status === 404) {
    return {
      ok: false,
      status: 'endpoint_not_ready',
      message: 'Worker 已配置，但 /api/ozon/test-connection 端点尚未实现。当前仍是安全准备状态。'
    };
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: data.connected ? 'connected' : 'worker_error',
      message: data.message || `Worker 测试连接失败：HTTP ${response.status}`
    };
  }

  if (Object.prototype.hasOwnProperty.call(data, 'connected')) {
    return {
      ok: Boolean(data.connected),
      status: data.connected ? 'connected' : 'failed',
      message: data.message || (data.connected ? 'Ozon API 连接测试通过。' : 'Ozon API 连接测试失败。'),
      maskedClientId: data.maskedClientId || '',
      timestamp: data.timestamp || ''
    };
  }

  return {
    ok: Boolean(data.ok),
    status: data.status || (data.ok ? 'connected' : 'not_connected'),
    message: data.message || (data.ok ? 'Ozon API 连接测试通过。' : 'Worker 已响应，但未返回连接成功状态。')
  };
}

async function requestBackendStoreProfiles() {
  if (!window.PRODUCT_SELECTION_API_BASE_URL) {
    return {
      ok: false,
      stores: [],
      message: '前端未配置 Worker URL，无法同步后端真实店铺。'
    };
  }

  const response = await fetch(window.PRODUCT_SELECTION_API_BASE_URL.replace(/\/$/, '') + '/api/stores');

  if (!response.ok) {
    throw new Error('后端店铺同步失败：' + response.status);
  }

  return response.json();
}

async function requestStoreApiHealth(platform, credentialRef, workerUrl) {
  const normalizedWorkerUrl = normalizeOzonWorkerUrl(workerUrl || window.PRODUCT_SELECTION_API_BASE_URL || '');

  if (!normalizedWorkerUrl) {
    return {
      ok: false,
      result: {
        status: 'api_not_connected',
        message: 'Missing Worker URL：请先填写 Cloudflare Worker 地址，前端不会发送任何 API 凭证。'
      }
    };
  }

  const response = await fetch(normalizedWorkerUrl.replace(/\/$/, '') + '/api/store-health', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, credentialRef })
  });

  if (!response.ok) {
    throw new Error('店铺 API 测试失败：' + response.status);
  }

  return response.json();
}
