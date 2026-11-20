(() => {
  'use strict';

  const DATA_KEY = 'sims-data-v1';

  const initialData = () => ({
    products: [
      { id: 'p-laptop', name: 'Laptop', category: 'Electronics', price: 55000, stock: 12 },
      { id: 'p-mobile', name: 'Mobile', category: 'Electronics', price: 18000, stock: 0 },
      { id: 'p-keyboard', name: 'Keyboard', category: 'Accessories', price: 1200, stock: 45 },
      { id: 'p-mouse', name: 'Mouse', category: 'Accessories', price: 800, stock: 30 },
      { id: 'p-headphones', name: 'Headphones', category: 'Accessories', price: 2500, stock: 4 }
    ],
    users: [
      { id: 'u-admin', name: 'Admin', email: 'admin@sims.com', role: 'Administrator', active: true },
      { id: 'u-customer', name: 'Customer', email: 'customer@sims.com', role: 'Customer', active: true }
    ],
    sales: [],
    activities: [{ id: 'a-welcome', message: 'Demo data is ready to use.', createdAt: new Date().toISOString(), type: 'system' }]
  });

  function save(data) {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }

  function ensureRoleUsers() {
    let data;
    try { data = JSON.parse(localStorage.getItem(DATA_KEY)); } catch (_) { data = null; }
    if (!data || !Array.isArray(data.products) || !Array.isArray(data.users) || !Array.isArray(data.sales)) {
      save(initialData());
      return;
    }

    let changed = false;
    const requiredUsers = [
      { id: 'u-admin', name: 'Admin', email: 'admin@sims.com', role: 'Administrator', active: true },
      { id: 'u-customer', name: 'Customer', email: 'customer@sims.com', role: 'Customer', active: true }
    ];
    requiredUsers.forEach(required => {
      if (!data.users.some(user => user.email === required.email)) {
        data.users.push(required);
        changed = true;
      }
    });
    if (changed) save(data);
  }

  ensureRoleUsers();
})();
