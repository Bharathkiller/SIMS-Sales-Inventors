(() => {
  'use strict';

  const STORAGE_KEY = 'sims-data-v1';
  const LOW_STOCK_LIMIT = 5;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const seedData = () => ({
    products: [
      { id: 'p-laptop', name: 'Laptop', category: 'Electronics', price: 55000, stock: 12 },
      { id: 'p-mobile', name: 'Mobile', category: 'Electronics', price: 18000, stock: 0 },
      { id: 'p-keyboard', name: 'Keyboard', category: 'Accessories', price: 1200, stock: 45 },
      { id: 'p-mouse', name: 'Mouse', category: 'Accessories', price: 800, stock: 30 },
      { id: 'p-headphones', name: 'Headphones', category: 'Accessories', price: 2500, stock: 4 }
    ],
    users: [
      { id: 'u-admin', name: 'Admin', email: 'admin@sims.com', role: 'Administrator', active: true },
      { id: 'u-staff', name: 'Staff', email: 'staff@sims.com', role: 'Employee', active: true }
    ],
    sales: [],
    activities: [
      { id: 'a-welcome', message: 'Demo data is ready to use.', createdAt: new Date().toISOString(), type: 'system' }
    ]
  });

  function getData() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored && Array.isArray(stored.products) && Array.isArray(stored.users) && Array.isArray(stored.sales)) {
        stored.activities ||= [];
        return stored;
      }
    } catch (_) {
      // Fall through to a new, valid data set if old browser storage is malformed.
    }
    const data = seedData();
    saveData(data);
    return data;
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function addActivity(data, message, type = 'update') {
    data.activities.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : `a-${Date.now()}-${Math.random()}`,
      message,
      type,
      createdAt: new Date().toISOString()
    });
    data.activities = data.activities.slice(0, 40);
  }

  function money(value) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  function number(value) {
    return new Intl.NumberFormat('en-IN').format(Number(value) || 0);
  }

  function dateTime(value) {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }

  function dateOnly(value) {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));
  }

  function todayKey(value = new Date()) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  }

  function status(product) {
    if (product.stock <= 0) return { label: 'Out of stock', className: 'out' };
    if (product.stock <= LOW_STOCK_LIMIT) return { label: 'Low stock', className: 'low' };
    return { label: 'In stock', className: 'ok' };
  }

  function getMetrics(data) {
    const today = todayKey();
    const todaySales = data.sales.filter(sale => todayKey(sale.createdAt) === today);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthSales = data.sales.filter(sale => {
      const date = new Date(sale.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    const revenue = sales => sales.reduce((sum, sale) => sum + sale.total, 0);
    return {
      products: data.products.length,
      stockUnits: data.products.reduce((sum, product) => sum + product.stock, 0),
      lowStock: data.products.filter(product => product.stock > 0 && product.stock <= LOW_STOCK_LIMIT).length,
      outOfStock: data.products.filter(product => product.stock <= 0).length,
      todayOrders: todaySales.length,
      todayRevenue: revenue(todaySales),
      monthOrders: monthSales.length,
      monthRevenue: revenue(monthSales),
      totalRevenue: revenue(data.sales)
    };
  }

  function emptyRow(columns, message) {
    return `<tr><td class="empty-state" colspan="${columns}">${escapeHtml(message)}</td></tr>`;
  }

  function toast(message, kind = 'success') {
    let region = $('#toast-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toast-region';
      region.setAttribute('aria-live', 'polite');
      document.body.append(region);
    }
    const item = document.createElement('div');
    item.className = `toast ${kind}`;
    item.textContent = message;
    region.append(item);
    setTimeout(() => item.remove(), 3500);
  }

  function closeModal(modal) {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  function openModal(modal) {
    modal.hidden = false;
    document.body.classList.add('modal-open');
    const input = $('input, select', modal);
    if (input) setTimeout(() => input.focus(), 0);
  }

  function setupModal(modal) {
    $$('[data-close-modal]', modal).forEach(button => button.addEventListener('click', () => closeModal(modal)));
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal(modal);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !modal.hidden) closeModal(modal);
    });
  }

  function setupRevealMotion() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    items.forEach((item, index) => {
      item.style.setProperty('--reveal-delay', `${index * 80}ms`);
      observer.observe(item);
    });
  }

  function renderDashboard() {
    const data = getData();
    const metrics = getMetrics(data);
    $('#dashboard-products').textContent = number(metrics.products);
    $('#dashboard-sales').textContent = money(metrics.todayRevenue);
    $('#dashboard-low-stock').textContent = number(metrics.lowStock + metrics.outOfStock);
    $('#dashboard-stock-units').textContent = number(metrics.stockUnits);
    $('#activity-list').innerHTML = data.activities.length
      ? data.activities.slice(0, 6).map(activity => `<li><span>${escapeHtml(activity.message)}</span><small>${dateTime(activity.createdAt)}</small></li>`).join('')
      : '<li class="empty-state">No recent activity.</li>';
    renderBars($('#sales-overview'), dailySeries(data.sales, 7), money);
    renderBars($('#stock-overview'), data.products.map(product => ({ label: product.name, value: product.stock })), number, true);

    $('#reset-data').addEventListener('click', () => {
      if (!confirm('Reset all products, users, sales, and activity records to the original demo data?')) return;
      saveData(seedData());
      toast('Demo data has been reset.');
      renderDashboard();
    }, { once: true });
  }

  function dailySeries(sales, days) {
    const rows = [];
    for (let offset = days - 1; offset >= 0; offset--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = todayKey(date);
      rows.push({
        label: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date),
        value: sales.filter(sale => todayKey(sale.createdAt) === key).reduce((sum, sale) => sum + sale.total, 0)
      });
    }
    return rows;
  }

  function renderBars(container, items, formatter = value => value, stock = false) {
    if (!container) return;
    const max = Math.max(...items.map(item => item.value), 1);
    container.innerHTML = items.length ? items.map(item => {
      const cls = stock && item.value <= 0 ? 'danger' : stock && item.value <= LOW_STOCK_LIMIT ? 'warning' : '';
      return `<div class="bar-row"><span title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span><div class="bar-track"><i class="bar ${cls}" style="width:${Math.max((item.value / max) * 100, item.value ? 4 : 0)}%"></i></div><strong>${formatter(item.value)}</strong></div>`;
    }).join('') : '<p class="empty-copy">No data available yet.</p>';
  }

  function renderProducts() {
    const data = getData();
    const metrics = getMetrics(data);
    $('#product-total').textContent = number(metrics.products);
    $('#product-categories').textContent = number(new Set(data.products.map(product => product.category)).size);
    $('#product-out').textContent = number(metrics.outOfStock);
    const body = $('#products-body');
    body.innerHTML = data.products.length ? data.products.map(product => {
      const productStatus = status(product);
      return `<tr>
        <td>${escapeHtml(product.name)}</td><td>${escapeHtml(product.category)}</td><td>${money(product.price)}</td><td>${number(product.stock)}</td>
        <td><span class="status ${productStatus.className}">${productStatus.label}</span></td>
        <td class="action-cell"><button class="edit" type="button" data-edit-product="${product.id}">Edit</button><button class="delete" type="button" data-delete-product="${product.id}">Delete</button></td>
      </tr>`;
    }).join('') : emptyRow(6, 'No products yet. Add your first product.');

    const modal = $('#product-modal');
    const form = $('#product-form');
    const heading = $('#product-modal-title');
    setupModal(modal);
    $('#add-product').addEventListener('click', () => {
      form.reset();
      $('#product-id').value = '';
      heading.textContent = 'Add product';
      openModal(modal);
    });
    body.addEventListener('click', event => {
      const edit = event.target.closest('[data-edit-product]');
      const remove = event.target.closest('[data-delete-product]');
      if (edit) {
        const product = getData().products.find(item => item.id === edit.dataset.editProduct);
        if (!product) return;
        $('#product-id').value = product.id;
        $('#product-name').value = product.name;
        $('#product-category').value = product.category;
        $('#product-price').value = product.price;
        $('#product-stock').value = product.stock;
        heading.textContent = 'Edit product';
        openModal(modal);
      }
      if (remove) {
        const current = getData();
        const product = current.products.find(item => item.id === remove.dataset.deleteProduct);
        if (!product || !confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
        current.products = current.products.filter(item => item.id !== product.id);
        addActivity(current, `Deleted product: ${product.name}.`, 'product');
        saveData(current);
        toast('Product deleted.');
        renderProducts();
      }
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const formData = new FormData(form);
      const product = {
        id: formData.get('id') || `p-${Date.now()}`,
        name: formData.get('name').trim(),
        category: formData.get('category').trim(),
        price: Number(formData.get('price')),
        stock: Number(formData.get('stock'))
      };
      if (!product.name || !product.category || product.price < 0 || product.stock < 0) {
        toast('Enter a valid product name, category, price, and stock.', 'error');
        return;
      }
      const current = getData();
      const index = current.products.findIndex(item => item.id === product.id);
      const duplicate = current.products.some(item => item.id !== product.id && item.name.toLowerCase() === product.name.toLowerCase());
      if (duplicate) {
        toast('A product with this name already exists.', 'error');
        return;
      }
      if (index === -1) {
        current.products.push(product);
        addActivity(current, `Added product: ${product.name}.`, 'product');
      } else {
        current.products[index] = product;
        addActivity(current, `Updated product: ${product.name}.`, 'product');
      }
      saveData(current);
      closeModal(modal);
      toast(index === -1 ? 'Product added.' : 'Product updated.');
      renderProducts();
    });
  }

  function renderStock() {
    const data = getData();
    const metrics = getMetrics(data);
    $('#stock-units').textContent = number(metrics.stockUnits);
    $('#stock-low').textContent = number(metrics.lowStock);
    $('#stock-out').textContent = number(metrics.outOfStock);
    const body = $('#stock-body');
    body.innerHTML = data.products.length ? data.products.map(product => {
      const productStatus = status(product);
      return `<tr><td>${escapeHtml(product.name)}</td><td>${escapeHtml(product.category)}</td><td>${number(product.stock)}</td><td><span class="status ${productStatus.className}">${productStatus.label}</span></td><td><button class="edit" type="button" data-adjust-stock="${product.id}">Adjust stock</button></td></tr>`;
    }).join('') : emptyRow(5, 'No products available. Add a product first.');
    const modal = $('#stock-modal');
    const form = $('#stock-form');
    setupModal(modal);
    body.addEventListener('click', event => {
      const button = event.target.closest('[data-adjust-stock]');
      if (!button) return;
      const product = getData().products.find(item => item.id === button.dataset.adjustStock);
      if (!product) return;
      $('#stock-product-id').value = product.id;
      $('#stock-product-name').textContent = `${product.name} — current stock: ${number(product.stock)}`;
      $('#stock-adjustment').value = '';
      $('#stock-reason').value = '';
      openModal(modal);
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const adjustment = Number($('#stock-adjustment').value);
      const reason = $('#stock-reason').value.trim();
      const current = getData();
      const product = current.products.find(item => item.id === $('#stock-product-id').value);
      if (!product || !Number.isInteger(adjustment) || adjustment === 0) {
        toast('Enter a whole stock adjustment other than zero.', 'error');
        return;
      }
      if (product.stock + adjustment < 0) {
        toast('The adjustment would make stock negative.', 'error');
        return;
      }
      product.stock += adjustment;
      addActivity(current, `${adjustment > 0 ? 'Added' : 'Removed'} ${Math.abs(adjustment)} unit(s) for ${product.name}${reason ? ` (${reason})` : ''}.`, 'stock');
      saveData(current);
      closeModal(modal);
      toast('Stock updated.');
      renderStock();
    });
  }

  function renderSales() {
    const data = getData();
    const select = $('#sale-product');
    const available = data.products.filter(product => product.stock > 0);
    select.innerHTML = '<option value="">Select a product</option>' + available.map(product => `<option value="${product.id}">${escapeHtml(product.name)} (${number(product.stock)} available) — ${money(product.price)}</option>`).join('');
    const price = $('#sale-price');
    const quantity = $('#sale-quantity');
    const total = $('#sale-total');
    const syncTotal = () => {
      const product = getData().products.find(item => item.id === select.value);
      price.value = product ? product.price : '';
      total.textContent = product && Number(quantity.value) > 0 ? money(product.price * Number(quantity.value)) : money(0);
      quantity.max = product ? product.stock : '';
    };
    select.addEventListener('change', syncTotal);
    quantity.addEventListener('input', syncTotal);
    $('#sale-form').addEventListener('submit', event => {
      event.preventDefault();
      const current = getData();
      const product = current.products.find(item => item.id === select.value);
      const qty = Number(quantity.value);
      if (!product) {
        toast('Choose a product that is in stock.', 'error');
        return;
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > product.stock) {
        toast(`Enter a quantity between 1 and ${product.stock}.`, 'error');
        return;
      }
      const sale = {
        id: `INV-${String(Date.now()).slice(-8)}`,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice: product.price,
        total: product.price * qty,
        createdAt: new Date().toISOString()
      };
      product.stock -= qty;
      current.sales.unshift(sale);
      addActivity(current, `Generated invoice ${sale.id} for ${qty} × ${product.name}.`, 'sale');
      saveData(current);
      $('#invoice-result').innerHTML = `<strong>Invoice ${sale.id}</strong><span>${qty} × ${escapeHtml(product.name)} · ${money(sale.total)}</span><small>${dateTime(sale.createdAt)}</small>`;
      $('#invoice-result').hidden = false;
      event.target.reset();
      price.value = '';
      total.textContent = money(0);
      toast('Invoice generated and inventory updated.');
      renderSales();
    });
    const salesBody = $('#recent-sales-body');
    salesBody.innerHTML = data.sales.length ? data.sales.slice(0, 8).map(sale => `<tr><td>${escapeHtml(sale.id)}</td><td>${escapeHtml(sale.productName)}</td><td>${number(sale.quantity)}</td><td>${money(sale.total)}</td><td>${dateTime(sale.createdAt)}</td></tr>`).join('') : emptyRow(5, 'No invoices yet. Create the first sale above.');
  }

  function renderUsers() {
    const data = getData();
    const body = $('#users-body');
    body.innerHTML = data.users.length ? data.users.map(user => `<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td>${escapeHtml(user.role)}</td><td><span class="status ${user.active ? 'ok' : 'out'}">${user.active ? 'Active' : 'Inactive'}</span></td><td class="action-cell"><button class="edit" type="button" data-edit-user="${user.id}">Edit</button><button class="delete" type="button" data-delete-user="${user.id}">Delete</button></td></tr>`).join('') : emptyRow(5, 'No users yet. Add a user to get started.');
    $('#user-total').textContent = number(data.users.length);
    $('#user-active').textContent = number(data.users.filter(user => user.active).length);
    $('#user-inactive').textContent = number(data.users.filter(user => !user.active).length);
    const modal = $('#user-modal');
    const form = $('#user-form');
    const heading = $('#user-modal-title');
    setupModal(modal);
    $('#add-user').addEventListener('click', () => {
      form.reset();
      $('#user-id').value = '';
      $('#user-active-input').checked = true;
      heading.textContent = 'Add user';
      openModal(modal);
    });
    body.addEventListener('click', event => {
      const edit = event.target.closest('[data-edit-user]');
      const remove = event.target.closest('[data-delete-user]');
      if (edit) {
        const user = getData().users.find(item => item.id === edit.dataset.editUser);
        if (!user) return;
        $('#user-id').value = user.id;
        $('#user-name').value = user.name;
        $('#user-email').value = user.email;
        $('#user-role').value = user.role;
        $('#user-active-input').checked = user.active;
        heading.textContent = 'Edit user';
        openModal(modal);
      }
      if (remove) {
        const current = getData();
        const user = current.users.find(item => item.id === remove.dataset.deleteUser);
        if (!user || !confirm(`Delete user “${user.name}”?`)) return;
        current.users = current.users.filter(item => item.id !== user.id);
        addActivity(current, `Deleted user: ${user.name}.`, 'user');
        saveData(current);
        toast('User deleted.');
        renderUsers();
      }
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const formData = new FormData(form);
      const user = {
        id: formData.get('id') || `u-${Date.now()}`,
        name: formData.get('name').trim(),
        email: formData.get('email').trim().toLowerCase(),
        role: formData.get('role'),
        active: formData.get('active') === 'on'
      };
      const current = getData();
      const duplicate = current.users.some(item => item.id !== user.id && item.email === user.email);
      if (!user.name || !user.email || !user.role || duplicate) {
        toast(duplicate ? 'A user with that email already exists.' : 'Complete all user details.', 'error');
        return;
      }
      const index = current.users.findIndex(item => item.id === user.id);
      if (index === -1) {
        current.users.push(user);
        addActivity(current, `Added user: ${user.name}.`, 'user');
      } else {
        current.users[index] = user;
        addActivity(current, `Updated user: ${user.name}.`, 'user');
      }
      saveData(current);
      closeModal(modal);
      toast(index === -1 ? 'User added.' : 'User updated.');
      renderUsers();
    });
  }

  function renderReports() {
    const data = getData();
    const metrics = getMetrics(data);
    $('#reports-total-sales').textContent = money(metrics.totalRevenue);
    $('#reports-month-sales').textContent = money(metrics.monthRevenue);
    $('#reports-low-stock').textContent = number(metrics.lowStock + metrics.outOfStock);
    renderBars($('#report-sales-chart'), monthSeries(data.sales), money);
    const inventory = [
      { label: 'In stock', value: data.products.filter(product => product.stock > LOW_STOCK_LIMIT).length },
      { label: 'Low stock', value: metrics.lowStock },
      { label: 'Out of stock', value: metrics.outOfStock }
    ];
    renderBars($('#report-inventory-chart'), inventory, number, true);
  }

  function monthSeries(sales) {
    const rows = [];
    const now = new Date();
    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      rows.push({
        label: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(date),
        value: sales.filter(sale => { const when = new Date(sale.createdAt); return when.getMonth() === month && when.getFullYear() === year; }).reduce((sum, sale) => sum + sale.total, 0)
      });
    }
    return rows;
  }

  function renderDailyReport() {
    const data = getData();
    const sales = data.sales.filter(sale => todayKey(sale.createdAt) === todayKey());
    const total = sales.reduce((sum, sale) => sum + sale.total, 0);
    const productQuantities = new Map();
    sales.forEach(sale => productQuantities.set(sale.productName, (productQuantities.get(sale.productName) || 0) + sale.quantity));
    const top = [...productQuantities.entries()].sort((a, b) => b[1] - a[1])[0];
    $('#daily-orders').textContent = number(sales.length);
    $('#daily-revenue').textContent = money(total);
    $('#daily-top-product').textContent = top ? top[0] : '—';
    $('#daily-sales-body').innerHTML = sales.length ? sales.map(sale => `<tr><td>${escapeHtml(sale.id)}</td><td>${escapeHtml(sale.productName)}</td><td>${number(sale.quantity)}</td><td>${money(sale.total)}</td><td>${dateTime(sale.createdAt)}</td></tr>`).join('') : emptyRow(5, 'No sales recorded today.');
    renderBars($('#hourly-sales-chart'), hourSeries(sales), money);
    renderBars($('#product-sales-chart'), [...productQuantities.entries()].map(([label, value]) => ({ label, value })), number);
  }

  function hourSeries(sales) {
    const hour = new Date().getHours();
    return Array.from({ length: Math.max(hour - 8, 1) }, (_, index) => {
      const actualHour = index + 9;
      return {
        label: `${actualHour > 12 ? actualHour - 12 : actualHour} ${actualHour >= 12 ? 'PM' : 'AM'}`,
        value: sales.filter(sale => new Date(sale.createdAt).getHours() === actualHour).reduce((sum, sale) => sum + sale.total, 0)
      };
    });
  }

  function renderMonthlyReport() {
    const data = getData();
    const sales = data.sales;
    const series = monthSeries(sales);
    const thisMonth = series.at(-1)?.value || 0;
    const now = new Date();
    const orders = sales.filter(sale => { const date = new Date(sale.createdAt); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); });
    const productQuantities = new Map();
    orders.forEach(sale => productQuantities.set(sale.productName, (productQuantities.get(sale.productName) || 0) + sale.quantity));
    const top = [...productQuantities.entries()].sort((a, b) => b[1] - a[1])[0];
    $('#monthly-orders').textContent = number(orders.length);
    $('#monthly-revenue').textContent = money(thisMonth);
    $('#monthly-top-product').textContent = top ? top[0] : '—';
    $('#monthly-sales-body').innerHTML = series.map(row => {
      const month = new Date(now.getFullYear(), now.getMonth() - (5 - series.indexOf(row)), 1);
      const count = sales.filter(sale => { const date = new Date(sale.createdAt); return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear(); }).length;
      return `<tr><td>${row.label}</td><td>${number(count)}</td><td>${money(row.value)}</td></tr>`;
    }).join('');
    renderBars($('#monthly-revenue-chart'), series, money);
    renderBars($('#monthly-order-chart'), series.map((row, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return { label: row.label, value: sales.filter(sale => { const date = new Date(sale.createdAt); return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear(); }).length };
    }), number);
  }

  function renderInventoryReport() {
    const data = getData();
    const metrics = getMetrics(data);
    $('#inventory-products').textContent = number(metrics.products);
    $('#inventory-low').textContent = number(metrics.lowStock);
    $('#inventory-out').textContent = number(metrics.outOfStock);
    $('#inventory-report-body').innerHTML = data.products.length ? data.products.map(product => {
      const productStatus = status(product);
      return `<tr><td>${escapeHtml(product.name)}</td><td>${escapeHtml(product.category)}</td><td>${number(product.stock)}</td><td><span class="status ${productStatus.className}">${productStatus.label}</span></td></tr>`;
    }).join('') : emptyRow(4, 'No products available.');
  }

  function renderActivityReport() {
    const data = getData();
    $('#activity-users').textContent = number(data.users.length);
    $('#activity-active').textContent = number(data.users.filter(user => user.active).length);
    $('#activity-events').textContent = number(data.activities.length);
    $('#activity-report-body').innerHTML = data.activities.length ? data.activities.map(activity => `<tr><td>${escapeHtml(activity.message)}</td><td>${escapeHtml(activity.type || 'update')}</td><td>${dateOnly(activity.createdAt)}</td><td>${dateTime(activity.createdAt).split(', ').at(-1)}</td></tr>`).join('') : emptyRow(4, 'No activity has been recorded.');
  }

  function init() {
    setupRevealMotion();
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
    const page = document.body.dataset.page;
    const pages = {
      dashboard: renderDashboard,
      products: renderProducts,
      stock: renderStock,
      sales: renderSales,
      users: renderUsers,
      reports: renderReports,
      dailyReport: renderDailyReport,
      monthlyReport: renderMonthlyReport,
      inventoryReport: renderInventoryReport,
      activityReport: renderActivityReport
    };
    if (pages[page]) pages[page]();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
