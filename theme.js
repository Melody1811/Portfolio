(() => {
  const button = document.querySelector('#theme-toggle');
  function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    document.querySelector('meta[name="theme-color"]').content = dark ? '#141414' : '#ffffff';
  }
  let dark = false;
  try { dark = localStorage.getItem('orbit-template-theme') === 'dark'; } catch {}
  applyTheme(dark);
  button.addEventListener('pointerleave', () => button.classList.remove('theme-activated'));
  button.addEventListener('blur', () => button.classList.remove('theme-activated'));
  button.addEventListener('click', () => {
    button.classList.add('theme-activated');
    dark = !dark;
    applyTheme(dark);
    try { localStorage.setItem('orbit-template-theme', dark ? 'dark' : 'light'); } catch {}
  });
})();

(() => {
  const brand = document.querySelector('.brand');
  brand.addEventListener('click', () => {
    brand.classList.add('brand-collapsed');
    try { sessionStorage.setItem('orbit-brand-clicked', '1'); } catch {}
  });
  try {
    if (sessionStorage.getItem('orbit-brand-clicked') === '1') {
      brand.classList.add('brand-collapsed');
      sessionStorage.removeItem('orbit-brand-clicked');
    }
  } catch {}
  brand.addEventListener('pointerleave', () => brand.classList.remove('brand-collapsed'));
  brand.addEventListener('blur', () => brand.classList.remove('brand-collapsed'));
})();
