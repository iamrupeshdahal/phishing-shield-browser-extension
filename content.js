
(async () => {
  const proto = location.protocol;
  if (proto !== 'http:' && proto !== 'https:') return;
  if (!location.hostname || location.hostname === 'newtab') return;

  const fullUrl     = location.href;
  const currentHost = location.hostname;

  let shield_master = true;
  let phishingPref  = 'enabled';
  let mlEnabled     = true;
  let httpsPref     = 'enabled';
  let fpEnabled     = false;

  try {
    const s = await chrome.storage.local.get([
      'shield_master', 'phishing', 'mlEnabled', 'https', 'fingerprint'
    ]);
    if (typeof s.shield_master === 'boolean') shield_master = s.shield_master;
    if (typeof s.phishing === 'string')       phishingPref  = s.phishing;
    if (typeof s.mlEnabled === 'boolean')     mlEnabled     = s.mlEnabled;
    if (typeof s.https === 'string')          httpsPref     = s.https;
    if (typeof s.fingerprint === 'boolean')   fpEnabled     = s.fingerprint;
  } catch (_) {}

  const MASTER_ON = !!shield_master;
  const PHISH_ON  = phishingPref === 'enabled';
  const ML_ON     = mlEnabled !== false;
  const HTTPS_ON  = httpsPref === 'enabled';
  const FP_ON     = !!fpEnabled;

  if (MASTER_ON && HTTPS_ON && proto === 'http:') {
    try {
      const httpsUrl = 'https://' + location.host + location.pathname + location.search + location.hash;
      location.replace(httpsUrl);
      return;
    } catch (_) {}
  }

  if (!MASTER_ON) return;

  if (PHISH_ON) {
    try {
      const res = await fetch(chrome.runtime.getURL('phishing_list.json'), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data?.domains) ? data.domains : [];
        if (list.includes(currentHost)) {
          return blockNow('Static list detection');
        }
      }
    } catch (_) {}

    if (ML_ON && typeof window.__ps_scorePhishingURL === 'function') {
      try {
        const score = window.__ps_scorePhishingURL(fullUrl);
        const THRESHOLD = 0.5;
        if (typeof score === 'number' && score >= THRESHOLD) {
          return blockNow(`ML risk ${(score * 100).toFixed(0)}%`);
        }
      } catch (_) {}
    }
  }

  if (FP_ON) {
    try {
      chrome.runtime.sendMessage({ type: 'inject-fp' });
    } catch (_) {}
  }

  function blockNow(reason) {
    showBlockOverlay(currentHost, reason);
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs?.[0]?.id;
        if (tabId) {
          chrome.runtime.sendMessage({ type: 'incPhishForThisTab', tabId });
        } else {
          chrome.runtime.sendMessage({ type: 'incPhishForThisTab' });
        }
      });
    } catch (_) {}
    return;
  }

  function showBlockOverlay(host, reason) {
    if (document.getElementById('__gbc_shield_overlay__')) return;
    document.documentElement.innerHTML = '';
    const overlay = document.createElement('div');
    overlay.id = '__gbc_shield_overlay__';
    overlay.style.cssText = `
      background-color:#ffebee;color:#b71c1c;height:100vh;width:100vw;
      display:flex;justify-content:center;align-items:center;flex-direction:column;
      position:fixed;top:0;left:0;z-index:2147483647;font-family:system-ui,Arial,sans-serif;`;
    overlay.innerHTML = `
      <div style="text-align:center;max-width:640px;padding:0 16px;">
        <h1 style="font-size:28px;color:#d32f2f;margin:0 0 8px;">⚠ Dangerous Site</h1>
        <p>This website has been flagged as <strong>phishing</strong> by GBC Shield.</p>
        <p><strong>Hostname:</strong> ${host}</p>
        <p style="font-size:13px;color:#7f1d1d;">Reason: ${reason}</p>
        <button id="__gbc_exit_btn__"
          style="margin-top:8px;padding:10px 20px;font-size:14px;background:#d32f2f;color:#fff;border:none;border-radius:6px;cursor:pointer;">
          Exit Page
        </button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#__gbc_exit_btn__')?.addEventListener('click', () => {
      try { window.location.href = 'https://rupeshdahal.com/gbcshield.php'; } catch(_) {}
    });
  }
})();
