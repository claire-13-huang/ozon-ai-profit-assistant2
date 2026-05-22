// 只负责安全读写本地表单状态，不参与计算公式。
const FORM_STORAGE_KEY = 'ozon-profit-decision-form-v1';

function saveFormState(values) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({
      ...values,
      savedAt: new Date().toISOString()
    }));
  } catch (error) {
    // localStorage 不可用时静默失败，避免影响计算。
  }
}

function loadFormState() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(FORM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function clearFormState() {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(FORM_STORAGE_KEY);
  } catch (error) {
    // localStorage 不可用时静默失败，避免影响页面。
  }
}
