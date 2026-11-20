(() => {
  'use strict';

  const DATA_KEY = 'sims-data-v1';
  const SESSION_KEY = 'sims-current-user';
  const LOW_STOCK = 5;
  const PRODUCT_IMAGES = {
    'p-laptop': 'assets/laptops.png',
    'p-mobile': 'assets/mobiles.png',
    'p-keyboard': 'assets/keyboards.png',
    'p-mouse': 'assets/mice.png',
    'p-headphones': 'assets/headphones.png'
  };
  const $ = selector => document.querySelector(selector);
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const getData = () => JSON.parse(localStorage.getItem(DATA_KEY));
  const save = data => localStorage.setItem(DATA_KEY, JSON.stringify(data));

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch (_) { return null; }
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
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(item => observer.observe(item));
  }

  function render() {
    const data = getData();
    const available = data.products.filter(product => product.stock > 0);
    const productSelect = $('#customer-product');
    productSelect.innerHTML = '<option value="">Choose a product</option>' + available.map(product => `<option value="${product.id}">${escapeHtml(product.name)} — ${money(product.price)} (${product.stock} available)</option>`).join('');
    $('#customer-products').innerHTML = data.products.map((product, index) => {
      const className = product.stock <= 0 ? 'out' : product.stock <= LOW_STOCK ? 'low' : 'ok';
      const label = product.stock <= 0 ? 'Out of stock' : product.stock <= LOW_STOCK ? 'Low stock' : `${product.stock} in stock`;
      const imageSrc = PRODUCT_IMAGES[product.id] || 'assets/laptops.png';
      return `<article class="customer-product reveal" style="animation-delay:${index * 55}ms; --reveal-delay:${index * 90}ms;">
        <div class="product-media">
          <img src="${imageSrc}" alt="${escapeHtml(product.name)} product image">
        </div>
        <div class="product-copy">
          <span class="status ${className}">${label}</span>
          <div><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.category)}</p></div>
          <strong>${money(product.price)}</strong>
        </div>
      </article>`;
    }).join('') || '<p class="muted">No products are currently available.</p>';
    const session = getSession();
    const orders = data.sales.filter(sale => sale.customerEmail === session?.email);
    $('#customer-orders').innerHTML = orders.length ? orders.slice(0, 8).map(order => `<tr><td>${escapeHtml(order.id)}</td><td>${escapeHtml(order.productName)}</td><td>${order.quantity}</td><td>${money(order.total)}</td></tr>`).join('') : '<tr><td class="empty-state" colspan="4">You have not placed any orders yet.</td></tr>';
    setupRevealMotion();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupRevealMotion();
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
    render();
    $('#customer-form').addEventListener('submit', event => {
      event.preventDefault();
      const data = getData();
      const product = data.products.find(item => item.id === $('#customer-product').value);
      const quantity = Number($('#customer-quantity').value);
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
        $('#customer-message').textContent = product ? `Please choose a quantity from 1 to ${product.stock}.` : 'Please select an available product.';
        return;
      }
      const session = getSession();
      const sale = { id: `ORD-${String(Date.now()).slice(-8)}`, productId: product.id, productName: product.name, quantity, unitPrice: product.price, total: product.price * quantity, customerEmail: session.email, createdAt: new Date().toISOString() };
      product.stock -= quantity;
      data.sales.unshift(sale);
      data.activities ||= [];
      data.activities.unshift({ id: `a-${Date.now()}`, message: `${session.name} placed order ${sale.id} for ${quantity} × ${product.name}.`, type: 'customer order', createdAt: sale.createdAt });
      save(data);
      $('#customer-message').textContent = `Order ${sale.id} placed successfully. Total: ${money(sale.total)}.`;
      event.target.reset();
      render();
    });
  });
})();
