// ============================================================
//  api.js  —  InternHub  |  Phase 5: JWT Authentication
//  Handles: access tokens, refresh tokens, auto-refresh,
//           token expiry, session management
// ============================================================

const BASE_URL = 'http://localhost:5000/api';

// ─── TOKEN / SESSION MANAGEMENT ─────────────────────────────
const Auth = {

  // Save both tokens + user after login/register
  saveSession(accessToken, refreshToken, user) {
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user',         JSON.stringify(user));
  },

  getAccessToken()  { return localStorage.getItem('accessToken'); },
  getRefreshToken() { return localStorage.getItem('refreshToken'); },
  getUser()         { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; },
  isLoggedIn()      { return !!localStorage.getItem('accessToken'); },

  // Update access token after refresh (keep refresh token)
  updateAccessToken(newAccessToken, newRefreshToken, user) {
    localStorage.setItem('accessToken', newAccessToken);
    if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  },

  // Clear all tokens → redirect to login
  clearSession() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  async logout() {
    const refreshToken = this.getRefreshToken();
    try {
      // Tell backend to revoke this refresh token
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch { /* ignore network error on logout */ }
    this.clearSession();
    window.location.href = 'login.html';
  },

  // Redirect if not logged in or wrong role
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

// ─── CORE FETCH WITH AUTO-REFRESH ───────────────────────────
// If a request gets 401 TOKEN_EXPIRED, automatically:
//   1. Call /auth/refresh with the refresh token
//   2. Save the new access token
//   3. Retry the original request once
// If refresh also fails → force logout

let isRefreshing = false;
let refreshQueue = []; // queue up calls while refreshing

async function apiFetch(endpoint, options = {}, _retry = false) {
  const accessToken = Auth.getAccessToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    },
    ...options,
  };

  let res, data;
  try {
    res  = await fetch(`${BASE_URL}${endpoint}`, config);
    data = await res.json();
  } catch (err) {
    return { success: false, error: 'Cannot connect to server. Is the backend running?' };
  }

  // ── Handle token expiry ──────────────────────────────────
  if (res.status === 401 && data.code === 'TOKEN_EXPIRED' && !_retry) {
    // Only one refresh attempt at a time
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await tryRefreshToken();
      isRefreshing = false;

      if (refreshed) {
        // Resolve all queued requests with new token
        refreshQueue.forEach(cb => cb());
        refreshQueue = [];
        // Retry original request with new token
        return apiFetch(endpoint, options, true);
      } else {
        // Refresh failed → session is dead
        refreshQueue = [];
        showSessionExpiredBanner();
        Auth.clearSession();
        return { success: false, error: 'Session expired. Please login again.' };
      }
    } else {
      // Another refresh is already in progress — queue this request
      return new Promise((resolve) => {
        refreshQueue.push(async () => {
          resolve(await apiFetch(endpoint, options, true));
        });
      });
    }
  }

  // ── Other 401 (invalid token, user deleted, etc.) ────────
  if (res.status === 401 && !_retry) {
    Auth.clearSession();
    window.location.href = 'login.html';
    return { success: false, error: data.message };
  }

  if (!res.ok) {
    return { success: false, error: data.message || `Error ${res.status}` };
  }

  return { success: true, data };
}

// ─── TRY REFRESH TOKEN ───────────────────────────────────────
async function tryRefreshToken() {
  const refreshToken = Auth.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res  = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) return false;

    // Save rotated tokens
    Auth.updateAccessToken(data.accessToken, data.refreshToken, data.user);
    return true;
  } catch {
    return false;
  }
}

// ─── SESSION EXPIRED BANNER ──────────────────────────────────
function showSessionExpiredBanner() {
  const banner = document.createElement('div');
  banner.style.cssText = `
    position:fixed; top:0; left:0; right:0; z-index:99999;
    background:rgba(239,68,68,0.95); color:#fff;
    padding:12px; text-align:center; font-size:0.9rem;
    font-family:'DM Sans',sans-serif; font-weight:500;
  `;
  banner.innerHTML = `🔒 Your session has expired. <a href="login.html" style="color:#fff;font-weight:700;text-decoration:underline;">Please login again</a>`;
  document.body.prepend(banner);
  setTimeout(() => window.location.href = 'login.html', 3000);
}

// ─── AUTH APIs ───────────────────────────────────────────────
const AuthAPI = {
  async register(payload) {
    return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  async login(email, password) {
    return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  async getMe() {
    return apiFetch('/auth/me');
  },
  async verifyToken() {
    return apiFetch('/auth/verify');
  },
  async updateProfile(payload) {
    return apiFetch('/auth/updateprofile', { method: 'PUT', body: JSON.stringify(payload) });
  },
  async changePassword(currentPassword, newPassword) {
    return apiFetch('/auth/changepassword', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  async getSessions() {
    return apiFetch('/auth/sessions');
  },
  async logoutAll() {
    return apiFetch('/auth/logout-all', { method: 'POST' });
  },
};

// ─── INTERNSHIP APIs ─────────────────────────────────────────
const InternshipAPI = {
  async getAll(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/internships?${query}`);
  },
  async getOne(id) { return apiFetch(`/internships/${id}`); },
  async create(payload) {
    return apiFetch('/internships', { method: 'POST', body: JSON.stringify(payload) });
  },
  async update(id, payload) {
    return apiFetch(`/internships/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  async delete(id) { return apiFetch(`/internships/${id}`, { method: 'DELETE' }); },
  async getMyPostings() { return apiFetch('/internships/my/postings'); },
  async toggle(id) { return apiFetch(`/internships/${id}/toggle`, { method: 'PATCH' }); },
};

// ─── APPLICATION APIs ────────────────────────────────────────
const ApplicationAPI = {
  async apply(internshipId, payload) {
    return apiFetch(`/applications/${internshipId}`, { method: 'POST', body: JSON.stringify(payload) });
  },
  async getMyApplications() { return apiFetch('/applications/my'); },
  async withdraw(id) { return apiFetch(`/applications/${id}`, { method: 'DELETE' }); },
  async getForInternship(internshipId) { return apiFetch(`/applications/internship/${internshipId}`); },
  async getAllRecruiter() { return apiFetch('/applications/recruiter/all'); },
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
    const existing = document.getElementById('ih-toast');
    if (existing) existing.remove();

    const borderColor = type === 'success' ? 'var(--accent)' : type === 'error' ? '#ef4444' : '#a78bfa';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    const toast = document.createElement('div');
    toast.id = 'ih-toast';
    toast.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      background:var(--bg-card); border:1px solid var(--border);
      border-left:3px solid ${borderColor};
      border-radius:12px; padding:12px 18px;
      display:flex; align-items:center; gap:10px;
      font-family:'DM Sans',sans-serif; font-size:0.88rem;
      box-shadow:0 8px 32px rgba(0,0,0,0.4);
      animation:slideUp 0.3s ease; max-width:320px;
    `;
    toast.innerHTML = `<span style="color:${borderColor};font-weight:700;">${icon}</span><span style="color:var(--text-primary);">${message}</span>`;

    if (!document.getElementById('ih-anim')) {
      const s = document.createElement('style');
      s.id = 'ih-anim';
      s.textContent = `@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`;
      document.head.appendChild(s);
    }
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  },

  setLoading(btn, loading) {
    if (loading) {
      btn.disabled = true;
      btn.dataset.original = btn.innerHTML;
      btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
          </path>
        </svg>Loading...</span>`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.original || '';
    }
  },
};

// ─── VERIFY TOKEN ON EVERY PROTECTED PAGE LOAD ───────────────
// Call this at the top of every dashboard page to silently
// validate the session and auto-refresh if needed
async function initAuthPage(requiredRole) {
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return null;
  }

  const result = await AuthAPI.verifyToken();

  if (!result.success) {
    // apiFetch already attempted auto-refresh internally
    // If we reach here the session is invalid
    return null;
  }

  const user = result.data.user;

  if (requiredRole && user.role !== requiredRole) {
    window.location.href = 'login.html';
    return null;
  }

  // Sync fresh user data to localStorage
  Auth.updateAccessToken(Auth.getAccessToken(), null, user);
  return user;
}
