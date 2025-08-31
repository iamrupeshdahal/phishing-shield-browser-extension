// ml.js — lightweight logistic model (no TF.js needed)

function extractFeaturesFromURL(fullUrl) {
  const u = new URL(fullUrl);
  const host = u.hostname;
  const path = u.pathname + u.search;

  const count = (s, re) => (s.match(re) || []).length;
  const isIP = /^[0-9.]+$/.test(host.replace(/\[|\]/g, ''));
  const tld = host.split('.').pop() || '';
  const suspiciousTlds = new Set(['zip','kim','top','gq','cf','ml','tk','link','click','work','country']);
  const keywords = /(login|verify|account|secure|update|confirm|webscr|signin|bank|invoice|password|support|unlock)/i;

  const features = {
    https: u.protocol === 'https:' ? 1 : 0,
    url_len: fullUrl.length,
    host_len: host.length,
    path_len: path.length,
    num_dots: (host.match(/\./g) || []).length,
    num_hyphens: (host.match(/-/g) || []).length,
    num_at: (fullUrl.match(/@/g) || []).length,
    num_digits: (host.match(/\d/g) || []).length,
    has_ip: isIP ? 1 : 0,
    has_keywords: keywords.test(fullUrl) ? 1 : 0,
    suspicious_tld: suspiciousTlds.has(tld.toLowerCase()) ? 1 : 0,
    num_params: (u.search.match(/=/g) || []).length,
    num_encoded: (fullUrl.match(/%[0-9A-Fa-f]{2}/g) || []).length,
  };

  const norm = x => Math.min(1, x);
  return [
    features.https,                          // 0
    norm(features.url_len / 120),            // 1
    norm(features.host_len / 60),            // 2
    norm(features.path_len / 120),           // 3
    norm(features.num_dots / 4),             // 4
    norm(features.num_hyphens / 4),          // 5
    norm(features.num_at / 2),               // 6
    norm(features.num_digits / 6),           // 7
    features.has_ip,                         // 8
    features.has_keywords,                   // 9
    features.suspicious_tld,                 // 10
    norm(features.num_params / 5),           // 11
    norm(features.num_encoded / 5),          // 12
  ];
}

const WEIGHTS = [
  -1.2,  // https
   1.4,  // url_len
   0.8,  // host_len
   0.9,  // path_len
   0.9,  // dots
   1.1,  // hyphens
   1.0,  // '@'
   0.8,  // digits
   1.5,  // IP host
   1.3,  // phishing keywords
   1.0,  // suspicious TLD
   0.7,  // params
   0.7   // encoded chars
];

const BIAS = -1.0; // overall sensitivity knob

function sigmoid(z){ return 1/(1+Math.exp(-z)); }

function scorePhishingURL(fullUrl){
  const x = extractFeaturesFromURL(fullUrl);
  let z = BIAS;
  for (let i=0;i<x.length;i++) z += x[i]*WEIGHTS[i];
  return sigmoid(z); // 0..1
}

// expose to content scripts
window.__ps_scorePhishingURL = scorePhishingURL;
