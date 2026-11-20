// The page controllers render after a save. Refresh only when storage changed
// so a controller is always re-initialised with one set of event listeners.
(() => {
  const key = 'sims-data-v1';
  const afterPossibleChange = before => window.setTimeout(() => {
    if (localStorage.getItem(key) !== before) window.location.reload();
  }, 90);
  document.addEventListener('submit', () => afterPossibleChange(localStorage.getItem(key)), true);
  document.addEventListener('click', event => {
    if (event.target.closest('[data-delete-product], [data-delete-user], #reset-data')) {
      afterPossibleChange(localStorage.getItem(key));
    }
  }, true);
})();
