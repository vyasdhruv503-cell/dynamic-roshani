/**
 * RTPL Smart Digital Academy - Database Controller
 * Bridges database operations to remote Railway backend, with automatic
 * localStorage fallback when the server is unreachable (e.g. on Netlify).
 */

const RTPL_DB = (function () {
  const isLocalHost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.') ||
    window.location.hostname.startsWith('172.');

  const host = window.location.hostname || 'localhost';
  const apiHost = isLocalHost
    ? `http://${host}:3000`
    : 'https://dynamic-roshani.onrender.com';
  const API_URL = `${apiHost}/api`;

  // LocalStorage keys
  const LS_USERS = 'rtpl_local_users';

  // ---- localStorage helpers ----
  function lsGetUsers() {
    try { return JSON.parse(localStorage.getItem(LS_USERS) || '[]'); } catch { return []; }
  }
  function lsSaveUsers(users) {
    localStorage.setItem(LS_USERS, JSON.stringify(users));
  }

  // Simple hash for localStorage (NOT secure – used only as Netlify fallback)
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'lh_' + Math.abs(hash).toString(36);
  }

  let isServerOffline = false;

  // ---- Remote API helper ----
  function request(endpoint, options = {}) {
    if (isServerOffline) {
      return Promise.reject(new Error("Server offline fallback"));
    }

    const customHeaders = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    };

    // Set a 4-second timeout limit so users don't hang waiting for dead servers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: { ...customHeaders, ...(options.headers || {}) }
    }).then(res => {
      clearTimeout(timeoutId);
      return res.json().then(data => {
        if (!res.ok) throw new Error(data.error || 'Server error');
        return data;
      });
    }).catch(err => {
      clearTimeout(timeoutId);
      isServerOffline = true; // Set sticky offline state
      throw err;
    });
  }

  // ---- AUTH TRANSACTIONS ----

  function register(name, email, password, phone) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone })
    }).catch(() => {
      // Fallback: store in localStorage
      const users = lsGetUsers();
      const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) return Promise.reject(new Error('An account with this email already exists.'));
      const newUser = {
        name, email: email.toLowerCase(), phone,
        passwordHash: simpleHash(password),
        type: 'local', date: new Date().toISOString()
      };
      users.push(newUser);
      lsSaveUsers(users);
      return { message: 'Registered successfully (offline mode).' };
    });
  }

  function login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }).catch(() => {
      // Fallback: validate against localStorage
      const users = lsGetUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return Promise.reject(new Error('No account found with this email. Please sign up first.'));
      if (user.passwordHash !== simpleHash(password)) {
        return Promise.reject(new Error('Incorrect password. Please try again.'));
      }
      const sessionUser = {
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        picture: null,
        type: 'Email Login',
        date: new Date().toISOString()
      };
      return { user: sessionUser };
    });
  }

  // OTP store for forgot-password fallback
  const _otpStore = {};

  function forgotPassword(email) {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }).catch(() => {
      // Fallback: check user exists locally
      const users = lsGetUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return Promise.reject(new Error('No account found with this email address.'));
      // Generate a demo OTP and store it in memory
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      _otpStore[email.toLowerCase()] = otp;
      // Show the OTP to the user (since no email server is available)
      alert(`📬 Password Reset OTP (demo mode): ${otp}\n\nIn production, this would be sent to your email.`);
      return { message: 'OTP sent (demo mode).' };
    });
  }

  function verifyOtp(email, otp) {
    return request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    }).catch(() => {
      const stored = _otpStore[email.toLowerCase()];
      if (!stored || stored !== otp.trim()) {
        return Promise.reject(new Error('Invalid or expired OTP code.'));
      }
      return { message: 'OTP verified.' };
    });
  }

  function resetPassword(email, password) {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }).catch(() => {
      const users = lsGetUsers();
      const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (idx === -1) return Promise.reject(new Error('Account not found.'));
      users[idx].passwordHash = simpleHash(password);
      lsSaveUsers(users);
      delete _otpStore[email.toLowerCase()];
      return { message: 'Password reset successfully.' };
    });
  }

  // ---- USERS TRANSACTIONS ----

  function saveUser(userObj) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(userObj)
    }).catch(() => {
      // Silently succeed — Google-authenticated users are stored in session
      return { message: 'Saved locally.' };
    });
  }

  function getUser(email) {
    return request('/users').then(users => {
      return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }).catch(() => {
      const users = lsGetUsers();
      return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    });
  }

  function getAllUsers() {
    return request('/users').catch(() => lsGetUsers());
  }

  function deleteUser(email) {
    return request(`/users/${encodeURIComponent(email)}`, { method: 'DELETE' }).catch(() => {
      const users = lsGetUsers().filter(u => u.email.toLowerCase() !== email.toLowerCase());
      lsSaveUsers(users);
      return { message: 'Deleted locally.' };
    });
  }

  function clearUsers() {
    return request('/users', { method: 'DELETE' }).catch(() => {
      lsSaveUsers([]);
      return { message: 'Cleared locally.' };
    });
  }

  // ---- LEADS TRANSACTIONS ----

  function sanitizeString(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  function addLead(leadObj) {
    return request('/leads', {
      method: 'POST',
      body: JSON.stringify(leadObj)
    }).catch(() => {
      // Store lead in localStorage as fallback
      const leads = JSON.parse(localStorage.getItem('rtpl_local_leads') || '[]');
      leads.push({ ...leadObj, id: Date.now(), date: new Date().toISOString() });
      localStorage.setItem('rtpl_local_leads', JSON.stringify(leads));
      return { message: 'Lead saved locally.' };
    });
  }

  function getAllLeads() {
    return request('/leads').then(leads => {
      return leads.map(l => ({
        ...l,
        name: sanitizeString(l.name),
        email: sanitizeString(l.email),
        phone: sanitizeString(l.phone),
        course: sanitizeString(l.course),
        message: sanitizeString(l.message)
      }));
    }).catch(() => {
      return JSON.parse(localStorage.getItem('rtpl_local_leads') || '[]');
    });
  }

  function deleteLead(id) {
    return request(`/leads/${id}`, { method: 'DELETE' }).catch(() => {
      const leads = JSON.parse(localStorage.getItem('rtpl_local_leads') || '[]')
        .filter(l => l.id !== id);
      localStorage.setItem('rtpl_local_leads', JSON.stringify(leads));
      return { message: 'Deleted locally.' };
    });
  }

  function clearLeads() {
    return request('/leads', { method: 'DELETE' }).catch(() => {
      localStorage.removeItem('rtpl_local_leads');
      return { message: 'Cleared locally.' };
    });
  }

  return {
    register,
    login,
    forgotPassword,
    verifyOtp,
    resetPassword,
    saveUser,
    getUser,
    getAllUsers,
    deleteUser,
    clearUsers,
    addLead,
    getAllLeads,
    deleteLead,
    clearLeads,
    sanitizeString
  };
})();
