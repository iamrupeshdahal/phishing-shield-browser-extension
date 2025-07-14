(async () => {
  const res = await fetch(chrome.runtime.getURL("phishing_list.json"));
  const data = await res.json();
  const phishingDomains = data.domains;

  const currentHost = window.location.hostname;

  if (phishingDomains.includes(currentHost)) {
    // Clear page
    document.documentElement.innerHTML = "";

    // Inject custom warning
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      background-color: #ffebee;
      color: #b71c1c;
      height: 100vh;
      width: 100vw;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: Arial, sans-serif;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 999999;
    `;

    overlay.innerHTML = `
      <div style="text-align: center;">
        <h1 style="font-size: 28px; color: #d32f2f;">⚠ Dangerous Site</h1>
        <p>This website has been flagged as <strong>phishing</strong> by Privacy Shield.</p>
        <p>For your safety, we’ve blocked access to this site.</p>
        <p><strong>Hostname:</strong> ${currentHost}</p>
        <button style="margin-top: 20px; padding: 10px 20px; font-size: 16px; background-color: #d32f2f; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Exit Page
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector("button").addEventListener("click", () => {
      window.location.href = "about:blank";
    });
  }
})();
