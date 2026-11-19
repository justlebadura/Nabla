// ====== Nabla: YouTube minimal + panel glass con buscador y enlaces ======
// Panel PROPIO (no depende del drawer de YT, que colapsaba y escondia los enlaces).
// Contiene: buscador arriba + Subscriptions/You/History/Playlists con notch vertical.

const NB_LINKS = [
  ['Subscriptions', '/feed/subscriptions'],
  ['You', '/feed/you'],
  ['History', '/feed/history'],
  ['Playlists', '/feed/playlists'],
];

// anti Force-Dark: Chromium invierte/recolorize colores si la pagina no declara color-scheme
function ensureColorScheme() {
  if (!document.querySelector('meta[name="color-scheme"]')) {
    const m = document.createElement('meta');
    m.name = 'color-scheme'; m.content = 'dark';
    (document.head || document.documentElement).appendChild(m);
  }
}
ensureColorScheme();
document.addEventListener('DOMContentLoaded', ensureColorScheme);

// ---- panel propio ----
function nbInjectPanel() {
  if (document.getElementById('nabla-yt-panel')) return;
  const panel = document.createElement('div');
  panel.id = 'nabla-yt-panel';
  const form = document.createElement('form');
  form.id = 'nabla-yt-search';
  const tab = document.createElement('div');
  tab.className = 'nabla-yt-tab';
  tab.textContent = 'nabla~$ yt'; // recogido: al hover se expande hacia abajo
  const q = document.createElement('input');
  q.type = 'search'; q.placeholder = 'buscar en yt...'; q.autocomplete = 'off';
  form.appendChild(tab);
  form.appendChild(q);
  tab.addEventListener('click', () => q.focus()); // el click en la pestañita abre el buscador
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = q.value.trim();
    if (v) location.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(v);
  });
  const nav = document.createElement('nav');
  const notch = document.createElement('div');
  notch.className = 'nabla-notch-v';
  nav.appendChild(notch);
  for (const [label, href] of NB_LINKS) {
    const a = document.createElement('a');
    a.className = 'nabla-yt-item';
    a.textContent = label;
    a.href = href;
    a.addEventListener('click', e => { e.preventDefault(); location.href = href; });
    nav.appendChild(a);
  }
  panel.appendChild(form);
  panel.appendChild(nav);
  (document.body || document.documentElement).appendChild(panel);

  // notch vertical + .lit (listeners en el nav: el DOM es nuestro, estable)
  nav.addEventListener('mouseover', e => {
    const a = e.target.closest && e.target.closest('.nabla-yt-item');
    if (!a) return;
    nav.querySelectorAll('.nabla-yt-item.lit').forEach(x => x.classList.remove('lit'));
    a.classList.add('lit');
    const nr = nav.getBoundingClientRect(), ar = a.getBoundingClientRect();
    notch.style.top = (ar.y - nr.y) + 'px';
    notch.style.height = ar.height + 'px';
    notch.classList.add('show');
  });
  nav.addEventListener('mouseleave', () => {
    nav.querySelectorAll('.nabla-yt-item.lit').forEach(x => x.classList.remove('lit'));
    notch.classList.remove('show');
  });
}

// ---- feed minimal: quitar estantes de shorts (respaldo del CSS :has) ----
const NB_HIDDEN = new WeakSet();
function nbHide(el) { if (!el || NB_HIDDEN.has(el)) return; NB_HIDDEN.add(el); el.style.display = 'none'; }
function nbFeedPurge() {
  document.querySelectorAll('ytd-rich-section-renderer').forEach(sec => {
    if (sec.querySelector('ytd-rich-shelf-renderer')) nbHide(sec);
  });
}

let nbTickY = null;
// modo cine por defecto: expandir el player al cargar / navegar dentro de YT
function nbTheater() {
  if (!/^\/watch/.test(location.pathname)) return;
  const flexy = document.querySelector('ytd-watch-flexy');
  const btn = document.querySelector('.ytp-size-button');
  if (!flexy || !btn) return;
  const v = document.querySelector('video');
  const wide = v ? v.getBoundingClientRect().width >= innerWidth * 0.7 : false;
  if (!wide && !flexy.hasAttribute('nabla-theater')) {
    flexy.setAttribute('nabla-theater', '');
    btn.click(); // botón "Modo cine" de YT
  }
}
new MutationObserver(() => {
  if (nbTickY) return;
  nbTickY = setTimeout(() => { nbTickY = null; try { nbInjectPanel(); nbFeedPurge(); nbTheater(); } catch (e) {} }, 200);
}).observe(document.documentElement, { childList: true, subtree: true });
