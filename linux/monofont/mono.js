// Nabla: fuente + color de glow configurables + puente de config desde newtab (file://)
(function () {
  let link = null;
  function apply(nf, g) {
    const root = document.documentElement;
    if (nf && nf !== 'none') {
      root.style.setProperty('--nf', nf);
      if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL('font.css');
        (document.head || document.documentElement).appendChild(link);
      }
    } else if (link) { link.remove(); link = null; }
    if (g) root.style.setProperty('--g', g); // glow global: yt.css/ddg.css usan var(--g,#ffffff)
  }
  try {
    chrome.storage.local.get(['nf', 'g'], d => {
      d = d || {};
      apply(d.nf !== undefined ? d.nf : '"JetBrains Mono"', d.g !== undefined ? d.g : '#ffffff'); // glow default: el configurado en la pantalla inicial
    });
  } catch (e) {}
  // puente: el newtab manda la config por postMessage y aqui se persiste
  if (location.protocol === 'file:') {
    window.addEventListener('message', e => {
      const m = e.data;
      if (m && m.nabla === 'cfg') {
        try { chrome.storage.local.set(m, () => apply(m.nf, m.g)); } catch (err) {}
      }
    });
  }
})();
