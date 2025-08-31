# 🛡️ GBC Shield – Customised Ad-block & Phishing Shield Browser Extension

![Popup Screenshot](https://rupeshdahal.com/extension/popup.jpg)

## 📌 Project Overview
**GBC Shield** is a browser extension developed as part of **Capstone Project 2** at *Gateway Business College – Adelaide Branch*.  
The extension provides **multi-layered privacy and security protections** by combining rule-based blocking with **machine learning–powered phishing detection**.

---

## 👥 Team Information
**Team Name:** Progressive_Rupesh_Misba_ADL  

- **Rupesh Dahal** *(Leader)* – Student ID: 202312610 – [iamrupeshdahal@gmail.com](mailto:iamrupeshdahal@gmail.com)  
- **Syed Muhammad Hamza** – Student ID: 202412895  
- **Pratik Bhandari** – Student ID: 202412817  
- **Hamza Bin Moin** – Student ID: 202312723  

---

## ⚙️ Features
- 🚫 **Ads & Tracker Blocking** – Blocks domains like `doubleclick.net`, `googletagmanager.com`, `facebook.net`, etc.  
- 🔒 **HTTPS Upgrade** – Automatically redirects insecure `http://` to `https://`.  
- 🎭 **Fingerprinting Protection** – Adds noise to **Canvas, WebGL, Audio APIs** to resist tracking.  
- 📜 **Script & Cookie Control** – Blocks malicious scripts and third-party cookies.  
- 🎯 **Phishing Detection**:
  - **Static List:** Blocks known malicious domains.
  - **Machine Learning:** Logistic Regression scoring of suspicious URLs (e.g., long subdomains, `login/verify` keywords).  
- 📊 **Popup Dashboard:** Live per-tab counters for Ads & Trackers, Scripts & Cookies, Fingerprinting, and Phishing.  
- ⚠️ **Custom Overlay:** Blocks access to suspicious pages with a warning and "Exit Page" button.  

---

## 🏗️ Implementation
- **Manifest V3 APIs**: `declarativeNetRequest`, `tabs`, `storage`, `scripting`.  
- **Background Service Worker:** Tracks per-tab counters.  
- **Content Script:** Handles phishing detection (static + ML), HTTPS upgrades, fingerprinting noise injection.  
- **Popup UI:** Displays counters & toggles.  
- **JSON Rulesets:** Ad, tracker, script, fingerprinting, and cookie blocking rules.  

---

## 📊 Evaluation & Testing
The extension was tested on multiple sites to validate blocking & phishing detection:

- **7news.com.au** – >20 trackers/ads blocked (Google Ads, Taboola, Facebook Pixel).  
- **cnn.com** – Fingerprinting & analytics scripts blocked.  
- **Phishing Simulation URLs** – ML classifier successfully flagged suspicious domains.  
- **Normal Safe Sites** (Google, BBC, UniSA) – No false positives detected.  

---

## ✅ Outcomes & Results
- Blocked average **15–25 trackers per news site**.  
- **100% HTTPS upgrades** where supported.  
- **Phishing Detection Accuracy ~90%** across test cases.  
- Real-time counters in popup validated per-tab blocking performance.  

![Static Detection](https://rupeshdahal.com/extension/static.jpg)  
![ML Detection](https://rupeshdahal.com/extension/ml.jpg)  

---

## 🚀 Deployment Details
- Currently tested in **Chrome Developer Mode**.  
- Will be published as a **Beta Version** on the Chrome Web Store after final evaluation.  
- Exit Page redirects to a [Project Showcase Page](https://rupeshdahal.com/extension/) explaining methodology, evaluation, results, and deployment plan.  

---

## 📈 Methodology
- **Development Approach:** Agile methodology, iterative improvements.  
- **Machine Learning:** Logistic Regression model with phishing dataset features (URL length, number of dots, keywords like `login`, `paypal`, `secure`, etc.).  
- **Significance:** Demonstrates combining static security lists with lightweight ML in real-world extensions.  
- **Future Improvements:**
  - Larger ML phishing datasets.
  - Cross-browser support (Firefox, Edge).
  - Performance optimization and reduced memory overhead.
  - Integration with live threat-intel feeds.  

---

## 🎓 Conclusion
**GBC Shield** is a practical demonstration of integrating **privacy & security features** into a lightweight Chrome Extension.  
It delivers measurable blocking results, highlights the benefits of combining rule-based filtering with ML phishing detection, and showcases the real-world application of cybersecurity concepts in a Capstone Project.

**Developed by:** *Rupesh Dahal & Team (Progressive_Rupesh_Misba_ADL)*  

---

## 📂 Repository Structure
