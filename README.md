# OmniBiz AI - Self-Building Automated Business Management System

OmniBiz AI is a self-building, custom-tailored SaaS application designed to automate operations, marketing, customer support, and local visibility for small-to-large businesses. Upon onboarding, the application customizes its own visual appearance, layout styles, databases, and core AI behaviors based on key inputs provided by the user.

---

## 🌟 Core System Vision

When a new business client logs into OmniBiz:
1. **Onboarding Questionnaire**: Captures company details, target audience, business goals, staff directories, and UI aesthetic preferences.
2. **Self-Building UI**: Instantly compiles CSS tokens to alter the dashboard's design system (e.g., Cyber SaaS, Ocean Wellness, Rose Boutique).
3. **Tailored AI Recepcionists**: Configures autonomous AI agents (via Gemini API) that know the company's employee names, service scope, and location, providing human-like website webchat and SMS interactions.
4. **Subscription Tiering**: Operates under strict service capabilities tied to Free, Starter, and Professional plans.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), CSS Custom Variables (Vanilla CSS design system), Lucide React (Icons).
- **Backend**: Node.js Serverless Functions (designed for Vercel/Firebase Functions hosting).
- **Database & Auth**: Google Firebase (Authentication, Cloud Firestore database logs, rule sets).
- **Telephony & Messaging**: Twilio SMS REST API, Twilio status callbacks, TwiML messaging webhooks.
- **Artificial Intelligence**: Gemini 2.5 Flash API (invoked for text generation, JSON structured campaigns, search grounding, and semantic reasoning).

---

## 📁 Repository Directory Structure

```text
├── api/                            # Backend Serverless Functions (Node.js)
│   ├── discover-leads.js           # Multi-source local prospect lead finder
│   ├── generate-ad.js              # Custom marketing campaign copy generator
│   ├── generate-contract.js        # Dynamic SLA/NDA contract draft generator
│   ├── generate-draft.js           # Smart text-draft editor
│   ├── send-email.js               # Resend API outbound email client
│   ├── send-sms.js                 # Twilio REST API outbound text dispatcher
│   ├── seo-audit.js                # Local search keyword & SEO optimizer
│   ├── twilio-missed-call.js       # Missed call automated textback responder
│   ├── twilio-sms-reply.js         # Conversational SMS receptionist responder
│   └── webchat-message.js          # Grounded live website webchat responder
├── src/
│   ├── main.jsx                    # Application entry point
│   ├── App.jsx                     # Core router, global state, & self-building CSS engine
│   ├── firebase.js                 # Firebase SDK initialize & Firestore mappings
│   ├── index.css                   # Global styling system & custom variable rules
│   └── components/
│       ├── Sidebar.jsx             # Left hand sidebar view selector
│       ├── Onboarding.jsx          # Setup flow with theme presets and staff directory
│       └── views/
│           ├── CommandCenter.jsx   # Operations dashboard, persona directives & sandbox
│           ├── AutomationSuite.jsx # Live logs for webchat, email, and voicemail
│           ├── LeadGen.jsx         # Live map geocoder & search prospect tool
│           ├── SEOManager.jsx      # Website crawler & SEO checklist scanner
│           ├── AdManager.jsx       # Google/Facebook campaign copy generator
│           ├── ContractManager.jsx # Legal document hub with cursives digital signing
│           ├── SettingsManager.jsx # Twilio configuration & team editor
│           └── BillingManager.jsx  # SaaS subscription tier management
├── firestore.rules                 # Security rules for Firestore databases
├── vercel.json                     # Vercel Serverless routing rules
└── vite.config.js                  # Frontend bundle manager config
```

---

## 📡 Backend API Endpoints Reference

All endpoints accept JSON payloads via HTTP POST, configure CORS headers, and integrate fail-safe fallbacks.

| Endpoint | Input Payload | Output Format | Description |
| :--- | :--- | :--- | :--- |
| `POST /api/discover-leads` | `category`, `location` | JSON Array | Uses OSM Nominatim geocoding & Gemini 2.5 Flash to discover, score, and evaluate real target businesses. |
| `POST /api/seo-audit` | `url`, `category` | JSON Object | Evaluates page titles, loading curves, crawl-ready tags, and outputs optimized recommendations. |
| `POST /api/generate-ad` | `businessData`, `platform`, `budget`, `objective` | JSON Object | Builds target keywords, demographics, and copy optimized for Google, Facebook, or Instagram ads. |
| `POST /api/generate-contract` | `template`, `clientName`, `businessData` | JSON Object | Compiles formal legal agreements (SLA/NDAs) matching specific company characteristics. |
| `POST /api/send-sms` | `to`, `body` | JSON Object | Dispatches standard outbound SMS using saved Twilio REST credentials. |
| `POST /api/twilio-missed-call` | Twilio Callback Parameters | Twilio XML | Triggers on call failure to send an immediate automated textback to the caller. |
| `POST /api/twilio-sms-reply` | Twilio Webhook Form | TwiML Response | Contextual SMS conversational receptionist responding utilizing previous message memory. |
| `POST /api/webchat-message` | `message`, `history`, `businessData` | JSON Object | Computes live chat responses matching the business's custom personnel profile. |

---

## 🎨 Self-Building UI & Themes

Theme presets map to specific CSS color configurations dynamically seeded during onboarding:

- **Cyber SaaS**: Cyber Cyan (`#06b6d4`) & Electric Purple (`#8b5cf6`).
- **Rugged Services**: Safety Orange (`#f97316`) & Emerald Green (`#10b981`).
- **Rose Boutique**: Blush Pink (`#ec4899`) & Rose Gold (`#f43f5e`).
- **Warm Cafe**: Espresso Stone (`#78350f`) & Caramel Gold (`#d97706`).
- **Ocean Wellness**: Mint Green (`#14b8a6`) & Forest Teal (`#0d9488`).
- **Navy Corporate**: Navy Blue (`#1d4ed8`) & Royal Steel (`#3b82f6`).

Adjusting the `themePreset` writes local styles directly to `--accent-purple` and `--accent-cyan` variables on the page element, dynamically updates onboarding mockups, and shapes matching text presets.

---

## 🚀 Getting Started & Local Development

### 1. Prerequisite Installations
Ensure Node.js is installed locally.

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a local `.env` (or set environment variables on your server):
```env
GEMINI_API_KEY="your-google-gemini-key"
RESEND_API_KEY="your-resend-email-key"
```

### 4. Running the App
Start the local development server:
```bash
npm run dev
```

### 5. Running Production Compilations
```bash
npm run build
```
This builds files inside `/dist`, prepared to be served from any CDN or static hosting platform.
