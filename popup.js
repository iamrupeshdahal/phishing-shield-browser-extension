document.addEventListener("DOMContentLoaded", () => {
  const settings = [
    "ad-block",
    "phishing",
    "block-scripts",
    "cookies",
    "forget-site",
    "fingerprint",
    "https"
  ];

  settings.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", () => {
        const value = el.type === "checkbox" ? el.checked : el.value;
        console.log(`${id} changed to`, value);

        // You can store settings using chrome.storage.local here
        chrome.storage.local.set({ [id]: value });
      });
    }
  });

  // Load saved values
  chrome.storage.local.get(settings, (data) => {
    settings.forEach(id => {
      const el = document.getElementById(id);
      if (el && data[id] !== undefined) {
        if (el.type === "checkbox") el.checked = data[id];
        else el.value = data[id];
      }
    });
  });
});

// Show current tab's URL
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const tab = tabs[0];
  const urlDiv = document.getElementById("current-url");

  if (tab && tab.url) {
    let hostname = new URL(tab.url).hostname;
    urlDiv.textContent = `🔗 ${hostname}`;
  } else {
    urlDiv.textContent = "Unable to retrieve URL";
  }
});

