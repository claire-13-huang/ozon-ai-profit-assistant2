// Frontend runtime config.
// After deploying the Cloudflare Worker, set this to the Worker base URL.
// Example: window.PRODUCT_SELECTION_API_BASE_URL = 'https://ozon-ai-profit-assistant.your-subdomain.workers.dev';
const FRONTEND_WORKER_URL_STORAGE_KEY = 'ozon-profit-worker-base-url-v1';
const DEFAULT_PRODUCT_SELECTION_API_BASE_URL = '';

function normalizeWorkerBaseUrl(value) {
  const clean = String(value || '').trim().replace(/\/+$/, '');

  if (!clean) return '';

  try {
    const url = new URL(clean);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString().replace(/\/+$/, '') : '';
  } catch (error) {
    return '';
  }
}

function getSavedWorkerBaseUrl() {
  try {
    return normalizeWorkerBaseUrl(localStorage.getItem(FRONTEND_WORKER_URL_STORAGE_KEY));
  } catch (error) {
    return '';
  }
}

function setSavedWorkerBaseUrl(value) {
  const normalized = normalizeWorkerBaseUrl(value);

  if (!normalized) {
    throw new Error('请输入有效的 Worker 地址，例如 https://xxx.workers.dev');
  }

  try {
    localStorage.setItem(FRONTEND_WORKER_URL_STORAGE_KEY, normalized);
  } catch (error) {
    // localStorage 不可用时仍更新当前页面内存配置。
  }

  window.PRODUCT_SELECTION_API_BASE_URL = normalized;
  return normalized;
}

function clearSavedWorkerBaseUrl() {
  try {
    localStorage.removeItem(FRONTEND_WORKER_URL_STORAGE_KEY);
  } catch (error) {
    // localStorage 不可用时只清空当前页面内存配置。
  }

  window.PRODUCT_SELECTION_API_BASE_URL = normalizeWorkerBaseUrl(DEFAULT_PRODUCT_SELECTION_API_BASE_URL);
}

window.PRODUCT_SELECTION_API_BASE_URL = normalizeWorkerBaseUrl(DEFAULT_PRODUCT_SELECTION_API_BASE_URL) || getSavedWorkerBaseUrl();
