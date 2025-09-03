

const RS_SCRIPTS = 'scripts_block';
const RS_ADS     = 'ads_default';
const RS_FP      = 'fp_block';


async function getCounts(tabId) {
  const key = `counts:${tabId}`;
  const { [key]: val } = await chrome.storage.session.get(key);
  return val || { ads: 0, trackers: 0, fp: 0, phish: 0, scripts: 0 };
}
async function setCounts(tabId, counts) {
  const key = `counts:${tabId}`;
  await chrome.storage.session.set({ [key]: counts });
}
async function resetCounts(tabId) {
  await setCounts(tabId, { ads: 0, trackers: 0, fp: 0, phish: 0, scripts: 0 });
}
async function bump(tabId, field) {
  const c = await getCounts(tabId);
  c[field] = (c[field] || 0) + 1;
  await setCounts(tabId, c);
}


chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading' || changeInfo.url) {
    resetCounts(tabId);
  }
});


chrome.tabs.onRemoved.addListener(async (tabId) => {
  await chrome.storage.session.remove(`counts:${tabId}`);
});


chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async (info) => {
  const tabId = info.tabId ?? (info.request && info.request.tabId);
  const ruleId = info.rule.ruleId;
  const rs     = info.rule.rulesetId;

  console.log("Matched rule:", rs, "id:", ruleId, "tab:", tabId);

  if (tabId && tabId > 0) {
    if (rs === RS_SCRIPTS) await bump(tabId, 'scripts');
    else if (rs === RS_FP) await bump(tabId, 'fp');
    else if (rs === RS_ADS) {
      if (ruleId >= 10000 && ruleId < 20000) await bump(tabId, 'ads');
      else if (ruleId >= 20000 && ruleId < 30000) await bump(tabId, 'trackers');
      else await bump(tabId, 'trackers');
    }
  }
});


function getLiveCountsFromMatched(tabId) {
  return new Promise((resolve) => {
    chrome.declarativeNetRequest.getMatchedRules({ tabId }, (res) => {
      if (chrome.runtime.lastError) {
        console.warn("getMatchedRules failed", chrome.runtime.lastError);
        resolve(null);
        return;
      }

      const live = { ads: 0, trackers: 0, fp: 0, phish: 0, scripts: 0 };

      for (const mr of res.rulesMatchedInfo || []) {
        const rs = mr.rule.rulesetId;
        const id = mr.rule.ruleId || 0;

        console.log("getMatchedRules ->", rs, id);

        if (rs === RS_SCRIPTS) { live.scripts++; continue; }
        if (rs === RS_FP) { live.fp++; continue; }
        if (rs === RS_ADS) {
          if (id >= 10000 && id < 20000) live.ads++;
          else if (id >= 20000 && id < 30000) live.trackers++;
          else live.trackers++;
        }
      }
      resolve(live);
    });
  });
}


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'getAllCountsForTab') {
    const tabId = sender?.tab?.id ?? msg.tabId;
    if (!tabId) return false;

    getLiveCountsFromMatched(tabId).then(async (live) => {
      if (live) {
        sendResponse({ ok: true, counts: live, live: true });
      } else {
        const counts = await getCounts(tabId);
        sendResponse({ ok: true, counts });
      }
    });
    return true;
  }

  if (msg?.type === 'incPhishForThisTab') {
    let tabId = sender?.tab?.id ?? msg.tabId;

    if (!tabId) {

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          bump(tabs[0].id, 'phish').then(() => sendResponse({ ok: true }));
        } else {
          sendResponse({ ok: false, error: "no tabId available" });
        }
      });
      return true; 
    }

    bump(tabId, 'phish').then(() => sendResponse({ ok: true }));
    return true;
  }


  if (msg?.type === 'inject-fp' && sender.tab?.id) {
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ['injected.js']
    });
  }
});
