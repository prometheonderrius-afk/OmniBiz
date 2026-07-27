# 🌐 OmniBiz-AI Static Public Assets (`public/`)

The `public/` directory contains static media assets, vector icons, SVG symbols, and embeddable live chat widget scripts for **OmniBiz-AI** (`omnibiz-ai.me`).

---

## 📁 File Inventory & Purpose

```text
public/
├── favicon.svg    # High-resolution vector favicon featuring the OmniBiz (Ω) brand logo
├── icons.svg      # Unified SVG sprite sheet for high-performance UI iconography
└── widget.html    # Standalone 24/7 AI Receptionist live chat embed snippet for client websites
```

---

## 💬 Live AI Receptionist Embed Code (`widget.html`)

Clients can embed the 24/7 AI Receptionist directly into their existing WordPress, Squarespace, Wix, or Shopify website by placing this iframe snippet before the closing `</body>` tag:

```html
<!-- OmniBiz-AI 24/7 Chatbot Embed -->
<iframe 
  src="https://omnibiz-ai.me/public/widget.html?businessId=YOUR_BUSINESS_ID" 
  style="position: fixed; bottom: 20px; right: 20px; width: 380px; height: 600px; border: none; z-index: 999999;"
  allow="microphone"
></iframe>
```

---

## 🎨 Vector Assets (`favicon.svg` & `icons.svg`)

- Assets served from `public/` are directly accessible from the root domain (`https://omnibiz-ai.me/favicon.svg`).
- SVGs are optimized for zero layout shift and dark glassmorphic backgrounds.
