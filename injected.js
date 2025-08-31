// injected.js — fingerprinting noise (runs in page, bypass CSP)
(() => {
  // Canvas noise
  const _toDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function() {
    try {
      const ctx = this.getContext('2d');
      if (ctx) { ctx.fillStyle = 'rgba(0,0,0,0.0001)'; ctx.fillRect(0,0,1,1); }
    } catch {}
    return _toDataURL.apply(this, arguments);
  };

  // WebGL spoof
  const _getParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(p) {
    if (p === 37445) return 'GBC-Shield'; // vendor
    if (p === 37446) return 'GBC-Shield'; // renderer
    return _getParameter.apply(this, arguments);
  };

  // Audio dither
  const _getChannelData = AudioBuffer.prototype.getChannelData;
  AudioBuffer.prototype.getChannelData = function() {
    const data = _getChannelData.apply(this, arguments);
    try { for (let i = 0; i < data.length; i += 100) data[i] += 1e-7; } catch {}
    return data;
  };
})();
