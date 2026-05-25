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
    return { error: '请填写平台、店铺名称和后端密钥编号。' };
  }

  return {
    store: {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      platform,
      name,
      credentialRef,
      status: '等待后端密钥配置',
      createdAt: new Date().toISOString()
    }
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

async function requestStoreApiHealth(platform, credentialRef) {
  if (!window.PRODUCT_SELECTION_API_BASE_URL) {
    return {
      ok: false,
      result: {
        status: 'api_not_connected',
        message: '前端未配置 Worker URL，不能测试真实店铺 API。'
      }
    };
  }

  const response = await fetch(window.PRODUCT_SELECTION_API_BASE_URL.replace(/\/$/, '') + '/api/store-health', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, credentialRef })
  });

  if (!response.ok) {
    throw new Error('店铺 API 测试失败：' + response.status);
  }

  return response.json();
}
