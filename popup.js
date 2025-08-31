// popup.js — consolidated + master-aware

// ===== helpers =====
const SELECTORS_TO_DISABLE = [
  '#ad-block', '#phishing', '#https', '#cookies',
  '#block-scripts', '#fingerprint', '#forget-site', '#mlEnabled'
].join(',');

function setBadge(badgeEl, isOn) {
  badgeEl.textContent = isOn
    ? '🛡️ Privacy Shield is ACTIVE'
    : '🛡️ Privacy Shield is INACTIVE';
  badgeEl.classList.toggle('off', !isOn);
}

function setStatusLines(statusTextEl, shieldLabelEl, isOn) {
  statusTextEl.textContent = isOn
    ? 'Your browsing experience is protected.'
    : 'Not protected by GBC Shields 1.0';
  shieldLabelEl.textContent = isOn ? 'Shields are UP' : 'Shields are DOWN';
}

function disableControls(disabled) {
  document.querySelectorAll(SELECTORS_TO_DISABLE).forEach(el => {
    if (el) el.disabled = disabled;
  });
}

function reloadActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id) chrome.tabs.reload(tabs[0].id);
  });
}

// ===== DNR ruleset toggles =====
function applyAdBlockSetting(value, masterOn) {
  const enable = (value === 'enabled') && !!masterOn;
  chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enable ? ['ads_default'] : [],
    disableRulesetIds: enable ? [] : ['ads_default']
  });
}

function applyHttpsSetting(value, masterOn) {
  const enable = (value === 'enabled') && !!masterOn;
  chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enable ? ['https_upgrade'] : [],
    disableRulesetIds: enable ? [] : ['https_upgrade']
  });
}

function applyScriptBlockSetting(checked, masterOn) {
  const enable = !!checked && !!masterOn;
  chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enable ? ['scripts_block'] : [],
    disableRulesetIds: enable ? [] : ['scripts_block']
  });
}

function applyFingerprintSetting(checked, masterOn) {
  const enable = !!checked && !!masterOn;
  chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enable ? ['fp_block'] : [],
    disableRulesetIds: enable ? [] : ['fp_block']
  });
}

function applyThirdPartyCookiesSetting(value, masterOn) {
  const enable = (value === 'enabled') && !!masterOn;
  chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enable ? ['cookies_block'] : [],
    disableRulesetIds: enable ? [] : ['cookies_block']
  });
}

// ===== counters (new grouping) =====
function updateCategoryCounters() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs?.[0]?.id;
    if (!tabId) return;

    chrome.runtime.sendMessage({ type: 'getAllCountsForTab', tabId }, (resp) => {
      const c = resp?.counts || {};

      // Ads + Trackers combined
      const elAT = document.getElementById('count-ads-trackers');
      if (elAT) elAT.textContent = (c.ads ?? 0) + (c.trackers ?? 0);

      // Fingerprinting
      const elF = document.getElementById('count-fp');
      if (elF) elF.textContent = c.fp ?? 0;

      // Scripts + Cookies combined
      const elSC = document.getElementById('count-scripts-cookies');
      if (elSC) elSC.textContent = (c.scripts ?? 0) + (c.cookies ?? 0);

      // Phishing
      const elP = document.getElementById('count-phish');
      if (elP) elP.textContent = c.phish ?? 0;
    });
  });
}

// ===== main =====
document.addEventListener('DOMContentLoaded', () => {
  // elements
  const masterToggle = document.getElementById('shield-toggle');
  const statusText   = document.getElementById('status-text');
  const shieldLabel  = document.getElementById('shield-label');
  const shieldBadge  = document.getElementById('shield-badge');

  const ids = [
    'ad-block','phishing','block-scripts','cookies',
    'forget-site','fingerprint','https','mlEnabled'
  ];

  // hostname at top
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const urlDiv = document.getElementById('current-url');
    try {
      const host = tabs[0]?.url ? new URL(tabs[0].url).hostname : null;
      urlDiv.textContent = host ? host : 'newtab';
    } catch {
      urlDiv.textContent = 'Unable to retrieve URL';
    }
  });

  // restore settings
  chrome.storage.local.get(ids.concat(['shield_master']), (data) => {
    const masterOn = (typeof data.shield_master === 'boolean') ? data.shield_master : true;

    // master UI state
    masterToggle.classList.toggle('on', masterOn);
    masterToggle.querySelector('input').checked = masterOn;
    setBadge(shieldBadge, masterOn);
    setStatusLines(statusText, shieldLabel, masterOn);
    disableControls(!masterOn);

    // restore each control value
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      let v = data[id];
      if (id === 'mlEnabled' && v === undefined) v = true; // default ML = on
      if (v === undefined) return;
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v;
    });

    // apply rulesets according to restored values + master
    const adSel     = document.getElementById('ad-block');
    const httpsSel  = document.getElementById('https');
    const scriptChk = document.getElementById('block-scripts');
    const fpChk     = document.getElementById('fingerprint');
    const ckSel     = document.getElementById('cookies');

    applyAdBlockSetting(adSel ? adSel.value : 'disabled', masterOn);
    applyHttpsSetting(httpsSel ? httpsSel.value : 'disabled', masterOn);
    applyScriptBlockSetting(scriptChk ? scriptChk.checked : false, masterOn);
    applyFingerprintSetting(fpChk ? fpChk.checked : false, masterOn);
    applyThirdPartyCookiesSetting(ckSel ? ckSel.value : 'disabled', masterOn);

    // show counts on popup open
    updateCategoryCounters();
  });

  // save & react to control changes (generic)
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('change', () => {
      const value = el.type === 'checkbox' ? el.checked : el.value;
      chrome.storage.local.set({ [id]: value });

      const isOn = masterToggle.classList.contains('on');

      // Apply DNR rules & reload when network-affecting settings change
      if (['ad-block','https','block-scripts','fingerprint','cookies'].includes(id)) {
        if (id === 'ad-block') applyAdBlockSetting(value, isOn);
        if (id === 'https') applyHttpsSetting(value, isOn);
        if (id === 'block-scripts') applyScriptBlockSetting(el.checked, isOn);
        if (id === 'fingerprint') applyFingerprintSetting(el.checked, isOn);
        if (id === 'cookies') applyThirdPartyCookiesSetting(value, isOn);

        reloadActiveTab();
        setTimeout(() => { updateCategoryCounters(); }, 600);
      }
    });
  });

  // master toggle behaviour
  masterToggle.addEventListener('click', () => {
    const isOn = !masterToggle.classList.contains('on');
    masterToggle.classList.toggle('on', isOn);
    masterToggle.querySelector('input').checked = isOn;

    // UI
    setBadge(shieldBadge, isOn);
    setStatusLines(statusText, shieldLabel, isOn);
    disableControls(!isOn);

    // persist master
    chrome.storage.local.set({ shield_master: isOn });

    // re-apply rulesets under new master state
    const adSel     = document.getElementById('ad-block');
    const httpsSel  = document.getElementById('https');
    const scriptChk = document.getElementById('block-scripts');
    const fpChk     = document.getElementById('fingerprint');
    const ckSel     = document.getElementById('cookies');

    applyAdBlockSetting(adSel ? adSel.value : 'disabled', isOn);
    applyHttpsSetting(httpsSel ? httpsSel.value : 'disabled', isOn);
    applyScriptBlockSetting(scriptChk ? scriptChk.checked : false, isOn);
    applyFingerprintSetting(fpChk ? fpChk.checked : false, isOn);
    applyThirdPartyCookiesSetting(ckSel ? ckSel.value : 'disabled', isOn);

    // reload so content.js & DNR take effect immediately, then refresh counters
    reloadActiveTab();
    setTimeout(() => { updateCategoryCounters(); }, 600);
  });
});
