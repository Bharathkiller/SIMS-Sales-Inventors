// Keep each post-save screen fresh.  The original pages are deliberately
// single-page scripts, so a reload also prevents duplicate event listeners
// after a create, edit, delete, or stock adjustment.
(() => {
  const refreshSoon = () => window.setTimeout(() => window.location.reload(), 80);
  document.addEventListener('submit', refreshSoon, true);
  document.addEventListener('click', event => {
    if (event.target.closest('[data-delete-product], [data-delete-user], #reset-data')) refreshSoon();
  }, true);
})();
