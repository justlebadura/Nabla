// Nabla TUI — desbranding (hide, no remove) + animaciones en DuckDuckGo

// forzar tema oscuro por cookie
const t = document.cookie.match(/kae=(\w)/);
if (!t || t[1] !== 'd') {
  document.cookie = 'kae=d; path=/; domain=duckduckgo.com; max-age=31536000';
}

// color-scheme dark: evita que Force Dark invierta la pill blanca de tabs
function ensureColorScheme() {
  if (!document.head) return false;
  if (!document.querySelector('meta[name="color-scheme"]')) {
    const m = document.createElement('meta');
    m.name = 'color-scheme';
    m.content = 'dark';
    document.head.appendChild(m);
  }
  return true;
}
ensureColorScheme();
document.addEventListener('DOMContentLoaded', ensureColorScheme);

const DEAD_TEXTS = [
  'Search Assist',
  'Ask Duck.ai',
  'Duck.ai',
  'Explore More',
  'Share Feedback',
  'Share feedback about this site',
  'Protection. Privacy. Peace of mind',
  'AI can make mistakes',
];

// ====== notch flotante que persigue al mouse en las tabs ======
// vive DENTRO del UL (encima del vidrio, debajo de los links); el tick()
// lo recrea si React lo elimina al re-renderizar
function setupTabs() {
  const ul = document.querySelector('ul[class*="XvPRmQVeIoCP5lQhICTv"]');
  if (!ul || !ul.querySelector('a')) return;
  let notch = ul.querySelector(':scope > .nabla-notch');
  if (!notch) {
    notch = document.createElement('div');
    notch.className = 'nabla-notch';
    ul.appendChild(notch);
  }
  function activeLink() {
    return ul.querySelector('a.SnptgjT2zdOhGYfNng6g') || ul.querySelector('a');
  }
  function moveTo(el, instant) {
    const n = ul.querySelector(':scope > .nabla-notch');
    if (!el || !n) return;
    [...ul.querySelectorAll('a')].forEach(a => a.classList.toggle('lit', a === el));
    const r = el.getBoundingClientRect(), u = ul.getBoundingClientRect();
    if (instant) n.style.transition = 'none';
    n.style.left = (r.left - u.left) + 'px';
    n.style.top = (r.top - u.top) + 'px';
    n.style.width = r.width + 'px';
    n.style.height = r.height + 'px';
    if (instant) { void n.offsetWidth; n.style.transition = ''; }
    n.style.opacity = '1';
  }
  if (!ul._nablaTabs) {
    ul._nablaTabs = true;
    // el notch SIGUE AL MOUSE horizontalmente y se ACOPLA a la palabra bajo el cursor
    ul.addEventListener('mousemove', e => {
      const a = e.target.closest && e.target.closest('a');
      if (a && ul.contains(a)) { moveTo(a); return; }
      const n = ul.querySelector(':scope > .nabla-notch');
      if (!n) return;
      const u = ul.getBoundingClientRect();
      n.style.left = (e.clientX - u.left - n.offsetWidth / 2) + 'px';
    });
    ul.addEventListener('mouseleave', () => moveTo(activeLink()));
  }
  moveTo(activeLink(), true);
}
setupTabs();

function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

const hidden = new WeakSet();
function hide(el) {
  if (!el || hidden.has(el)) return;
  // REGLA DE SEGURIDAD: nunca ocultar contenedores de resultados o la página
  if (el === document.body || el === document.documentElement) return;
  if (el.querySelector('[data-testid="result"], [data-testid="results"], .react-results--main, #links, #react-layout')) return;
  if (el.dataset && el.dataset.testid === 'result') return;
  hidden.add(el);
  el.style.setProperty('display', 'none', 'important');
}

function purge() {
  // slogan de cabecera
  document.querySelectorAll('.header--aside').forEach(hide);

  // items por texto exacto — solo el propio elemento, SIN subir a ancestros
  for (const el of document.querySelectorAll('li, a, span, button, [role="button"], p, h1, h2')) {
    if (DEAD_TEXTS.includes(norm(el.textContent))) hide(el);
  }

  // tarjeta de IA y preguntas relacionadas — el elemento MÁS PEQUEÑO que contiene la frase
  for (const el of document.querySelectorAll('section, div, aside')) {
    if ((el.textContent || '').includes('Auto-generated based on listed sources') ||
        (el.textContent || '').includes('Answers auto-generated based on listed sources') ||
        (el.textContent || '').includes('What are the best search engines for privacy')) hide(el);
  }

  // badges y botones flotantes
  document.querySelectorAll('[class*="feedback"], [class*="badge-link"], .cb-badge, #dropdown-official').forEach(hide);
}

function animate() {
  document.querySelectorAll('[data-testid="result"], .result').forEach((el, i) => {
    if (el.dataset.nablaAnim) return;
    el.dataset.nablaAnim = '1';
    el.style.animation = 'nabla-rise 1.1s cubic-bezier(.2,.7,.3,1) both';
    el.style.animationDelay = Math.min(i * 60, 900) + 'ms';
  });
}

let pending = null;
function tick() {
  if (pending) return;
  pending = setTimeout(() => { pending = null; purge(); hideAssistBar(); animate(); setupTabs(); }, 150);
}

// el UL de Search Assist queda vacio tras el purge pero sigue pintando
// la pill de vidrio: ocultarlo entero
function hideAssistBar() {
  document.querySelectorAll('ul[class*="XvPRmQVeIoCP5lQhICTv"]').forEach(ul => {
    const txt = ul.textContent;
    if (/Search Assist|Ask Duck\.ai/.test(txt)) hide(ul);
  });
}
tick();

const obs = new MutationObserver(tick);
obs.observe(document.body, { childList: true, subtree: true });

// glow de la caja de busqueda
const box = document.querySelector('#searchbox_input, #search_form_input');
if (box) {
  box.addEventListener('focus', () => { const g = getComputedStyle(document.documentElement).getPropertyValue('--g').trim() || '#7ee787'; box.style.boxShadow = '0 0 0 1px #333, 0 0 18px ' + g + '40'; });
  box.addEventListener('blur', () => { box.style.boxShadow = 'none'; });
}
