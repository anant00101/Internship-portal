// ============================================================
//  api.js  —  Central API utility for InternHub frontend
//  All backend calls go through this file
// ============================================================

const BASE_URL = 'http://localhost:5000/api';

// ─── TOKEN HELPERS ──────────────────────────────────────────
const Auth = {
  saveUser(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  getToken() {
    return localStorage.getItem('token');
  },
  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  },
  // Redirect if not logged in
  requireAuth(role = null) {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    if (role && this.getUser()?.role !== role) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },
};

// ─── CORE FETCH WRAPPER ─────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = Auth.getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Error ${res.status}`);
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── AUTH APIs ───────────────────────────────────────────────
const AuthAPI = {
  async register(payload) {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async login(email, password) {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  async getMe() {
    return apiFetch('/auth/me');
  },
  async updateProfile(payload) {
    return apiFetch('/auth/updateprofile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};

// ─── INTERNSHIP APIs ─────────────────────────────────────────
const InternshipAPI = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/internships?${query}`);
  },
  async getOne(id) {
    return apiFetch(`/internships/${id}`);
  },
  async create(payload) {
    return apiFetch('/internships', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async update(id, payload) {
    return apiFetch(`/internships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async delete(id) {
    return apiFetch(`/internships/${id}`, { method: 'DELETE' });
  },
  async getMyPostings() {
    return apiFetch('/internships/my/postings');
  },
  async toggle(id) {
    return apiFetch(`/internships/${id}/toggle`, { method: 'PATCH' });
  },
};

// ─── APPLICATION APIs ────────────────────────────────────────
const ApplicationAPI = {
  async apply(internshipId, payload) {
    return apiFetch(`/applications/${internshipId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async getMyApplications() {
    return apiFetch('/applications/my');
  },
  async withdraw(id) {
    return apiFetch(`/applications/${id}`, { method: 'DELETE' });
  },
  async getForInternship(internshipId) {
    return apiFetch(`/applications/internship/${internshipId}`);
  },
  async getAllRecruiter() {
    return apiFetch('/applications/recruiter/all');
  },
  async updateStatus(id, status, recruiterNote = '') {
    return apiFetch(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, recruiterNote }),
    });
  },
};

// ─── UI HELPERS ──────────────────────────────────────────────
const UI = {
  showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.getElementById('ih-toast');
    if (existing) existing.remove();

    const colors = {
      success: 'rgba(0,212,170,0.15)',
      error: 'rgba(239,68,68,0.15)',
      info: 'rgba(124,58,237,0.15)',
    };
    const icons = { success: '✓', error: '✕', info: 'ℹ' };

    const toast = document.createElement('div');
    toast.id = 'ih-toast';
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      background:var(--bg-card); border:1px solid var(--border);
      border-left: 3px solid ${type === 'success' ? 'var(--accent)' : type === 'error' ? '#ef4444' : '#a78bfa'};
      border-radius:12px; padding:12px 18px;
      display:flex; align-items:center; gap:10px;
      font-family:'DM Sans',sans-serif; font-size:0.88rem;
      box-shadow:0 8px 32px rgba(0,0,0,0.4);
      animation: slideUp 0.3s ease;
      max-width: 320px;
    `;
    toast.innerHTML = `
      <span style="color:${type === 'success' ? 'var(--accent)' : type === 'error' ? '#ef4444' : '#a78bfa'};font-weight:700;">${icons[type]}</span>
      <span style="color:var(--text-primary);">${message}</span>
    `;

    if (!document.getElementById('ih-toast-style')) {
      const style = document.createElement('style');
      style.id = 'ih-toast-style';
      style.textContent = `@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  },

  setLoading(btn, loading, originalText = '') {
    if (loading) {
      btn.disabled = true;
      btn.dataset.original = btn.innerHTML;
      btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
          </path>
        </svg>
        Loading...</span>`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.original || originalText;
    }
  },

  showError(inputEl, message) {
    let err = inputEl.parentElement.querySelector('.field-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'field-error';
      err.style.cssText = 'color:#ef4444; font-size:0.78rem; margin-top:4px;';
      inputEl.parentElement.appendChild(err);
    }
    err.textContent = message;
    inputEl.style.borderColor = '#ef4444';
  },

  clearErrors() {
    document.querySelectorAll('.field-error').forEach(e => e.remove());
    document.querySelectorAll('.form-control-dark').forEach(i => i.style.borderColor = '');
  },
};
