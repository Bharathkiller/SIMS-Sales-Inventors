(() => {
  'use strict';

  const DATA_KEY = 'sims-data-v1';
  const SESSION_KEY = 'sims-current-user';
  const accounts = {
    admin: { name: 'Admin', email: 'admin@sims.com', password: 'admin123', role: 'Administrator', destination: 'admin-dashboard.html' },
    customer: { name: 'Customer', email: 'customer@sims.com', password: 'customer123', role: 'Customer', destination: 'customer-portal.html' }
  };
  const params = new URLSearchParams(window.location.search);
  const requestedPage = params.get('next');
  let selected = 'admin';

  function setRole(role) {
    selected = role;
    document.querySelectorAll('[data-role]').forEach(button => button.classList.toggle('selected', button.dataset.role === role));
    const account = accounts[role];
    document.querySelector('#login-email').value = account.email;
    document.querySelector('#login-password').value = account.password;
    document.querySelector('#login-submit').textContent = `Continue as ${account.role}`;
    document.querySelector('#login-error').textContent = '';
  }

  function ensureAccount(account) {
    try {
      const data = JSON.parse(localStorage.getItem(DATA_KEY));
      if (data && Array.isArray(data.users) && !data.users.some(user => user.email === account.email)) {
        data.users.push({ id: `u-${account.role.toLowerCase()}`, name: account.name, email: account.email, role: account.role, active: true });
        localStorage.setItem(DATA_KEY, JSON.stringify(data));
      }
    } catch (_) { /* roles.js will create valid initial data when needed. */ }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-role]').forEach(button => button.addEventListener('click', () => setRole(button.dataset.role)));
    setRole(selected);
    document.querySelector('#login-form').addEventListener('submit', event => {
      event.preventDefault();
      const email = document.querySelector('#login-email').value.trim().toLowerCase();
      const password = document.querySelector('#login-password').value;
      const account = Object.values(accounts).find(item => item.email === email && item.password === password);
      if (!account) {
        document.querySelector('#login-error').textContent = 'That email and password combination is not available in this demo.';
        return;
      }
      ensureAccount(account);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name: account.name, email: account.email, role: account.role }));
      const canOpenRequestedPage = requestedPage && /^[a-z0-9-]+\.html$/i.test(requestedPage) && ((account.role === 'Administrator' && requestedPage !== 'customer-portal.html') || (account.role === 'Customer' && requestedPage === 'customer-portal.html'));
      window.location.replace(canOpenRequestedPage ? requestedPage : account.destination);
    });
  });
})();
