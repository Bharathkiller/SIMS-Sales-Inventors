(() => {
  'use strict';

  const SESSION_KEY = 'sims-current-user';
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'auth.css';
  document.head.append(stylesheet);

  function currentUser() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (_) { return null; }
  }

  function loginUrl() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    return `login.html?next=${encodeURIComponent(current)}`;
  }

  function signOut() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace('login.html');
  }

  function updateNavigation(user) {
    const nav = document.querySelector('.navbar nav');
    if (!nav || nav.querySelector('.auth-nav')) return;
    const controls = document.createElement('span');
    controls.className = 'auth-nav';
    if (user) {
      controls.innerHTML = `<span class="session-chip">${user.role}</span><button class="nav-signout" type="button">Sign out</button>`;
      controls.querySelector('button').addEventListener('click', signOut);
    } else {
      controls.innerHTML = '<a class="nav-signin" href="login.html">Sign in</a>';
    }
    nav.append(controls);
  }

  function protectRoute(user) {
    const access = document.body.dataset.access;
    if (!access) return;
    const expectedRole = access === 'admin' ? 'Administrator' : 'Customer';
    if (!user || user.role !== expectedRole) window.location.replace(loginUrl());
  }

  const user = currentUser();
  protectRoute(user);
  document.addEventListener('DOMContentLoaded', () => updateNavigation(currentUser()));
})();
