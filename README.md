# 🌾 AgriGuard — AI-Powered Farming Assistant

![React](https://img.shields.io/badge/React.js-20232A?style=flat&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat&logo=google&logoColor=white)
![NVIDIA](https://img.shields.io/badge/NVIDIA_NIM-76B900?style=flat&logo=nvidia&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

> An AI-powered farming assistant for rural Indian farmers — crop disease detection, live mandi prices, hyperlocal weather, government schemes, and an NVIDIA-powered multi-agent advisor, all in one app.

🔗 **Live Demo:** [agri-guard-steel.vercel.app](https://agri-guard-steel.vercel.app)

---

## ✨ Features

### 🤖 AI Farm Advisor — NVIDIA NIM + Multi-Agent Pipeline
The flagship feature. Ask any farming question via text, voice, or photo upload. Four specialized agents run and feed into NVIDIA Nemotron for a single unified recommendation.

- **Disease Agent** — Gemini Vision analyzes crop photo or text symptoms
- **Weather Agent** — Live 3-day forecast from WeatherAPI.com
- **Market Agent** — Real-time mandi prices from AGMARKNET (data.gov.in)
- **Schemes Agent** — Relevant govt schemes matched to the query
- **NVIDIA Nemotron-70B** synthesizes all 4 outputs into one actionable recommendation
- Voice input via Web Speech API (en-IN locale, no API key needed)
- Photo upload / camera capture for visual disease detection
- One-click translation to Hindi, Kannada, Tamil, Telugu

### 🔬 AI Disease Detector
- Upload or capture a crop/leaf photo using device camera
- Gemini 2.5 Flash Vision analyzes the image
- Returns: Disease name · Symptoms · Root cause · Treatment options · Prevention tips
- Works offline-first with low-connectivity optimization

### 🌦️ Smart Weather Forecaster
- Live 5-day forecast via WeatherAPI.com
- Gemini interprets raw weather data as an agricultural expert
- Actionable farming advice e.g. "Heavy rain Tuesday — delay pesticide spray"
- Location-aware forecasting

### 📈 Market Tracker — Live Mandi Prices
- Real-time commodity prices from AGMARKNET API (data.gov.in)
- Shows min / max / modal price per quintal across multiple mandis
- Filter by crop name and state
- Gemini AI market analysis on top of real price data
- Selling recommendations based on current market trends

### 🌱 Farming Guide & Planting Scheduler
- AI chatbot for any farming Q&A (crops, soil, pests, fertilizers)
- Personalized planting schedules from sowing to harvest
- Seasonal crop recommendations

### 🏛️ Government Schemes Portal
- PM-KISAN · PMFBY · KCC · PM-KUSUM · e-NAM
- Eligibility info and direct links to official portals
- AI-powered scheme matching based on farmer's situation

### 🌐 Multilingual Support
- One-click translation of all AI outputs
- Supports Hindi, Kannada, Tamil, Telugu, Marathi
- Custom `TranslatableText` React component with slide-to-translate UI
- Powered by Gemini translation API
- Makes the app accessible to non-English-speaking rural farmers

### 🔐 Authentication
- Email / Password login
- Google OAuth
- Anonymous (Guest) login
- Firebase Authentication + Cloud Firestore for user data

---

## 🏗️ Architecture

```
Farmer Input (Text / Voice / Photo)
            │
            ▼
    ┌─────────────────────────────────────┐
    │          AI Farm Advisor            │
    │                                     │
    │  ┌──────────┐   ┌──────────┐       │
    │  │ Disease  │   │ Weather  │       │
    │  │  Agent   │   │  Agent   │       │
    │  │ (Gemini) │   │(WeatherAPI)      │
    │  └──────────┘   └──────────┘       │
    │  ┌──────────┐   ┌──────────┐       │
    │  │  Market  │   │ Schemes  │       │
    │  │  Agent   │   │  Agent   │       │
    │  │(AGMARKNET)   │ (Gemini) │       │
    │  └──────────┘   └──────────┘       │
    │               │                    │
    │               ▼                    │
    │   NVIDIA Nemotron-70B (NIM)        │
    │   Synthesis & Recommendation       │
    └─────────────────────────────────────┘
            │
            ▼
    Unified Farmer Recommendation
    (Multilingual via Gemini)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (SPA), Tailwind CSS, Lucide React |
| Auth + Database | Firebase Authentication + Cloud Firestore |
| AI — Vision + NLP + Translation | Google Gemini 2.5 Flash |
| AI — Multi-Agent Synthesis | NVIDIA NIM (llama-3.3-nemotron-super-49b-v1.5) |
| Market Data | AGMARKNET API via data.gov.in |
| Weather | WeatherAPI.com |
| Voice Input | Web Speech API (browser-native, no API key) |
| Backend Proxy | Vercel Serverless Functions (Node.js) |
| Deployment | Vercel |
| Resilience | Exponential backoff retry (`fetchWithRetry`) |

---

## 🚀 Getting Started



Create a `.env` file in the root:

```env
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_key
VITE_WEATHER_API_KEY=your_weatherapi_key
VITE_AGMARKNET_API_KEY=your_data_gov_in_key
```

For NVIDIA NIM — add to Vercel environment variables (server-side only, never expose in frontend):
```
NIM_API_KEY=your_nvidia_nim_key
```

---

## 👩‍💻 Author

**Keerthi H** · B.Tech CSE, CMR University, Bengaluru (2024–2028)
📧 keerthih1503@gmail.com · [LinkedIn](https://www.linkedin.com/in/keerthi-h-a2b1aa32a) · [Portfolio](https://keerthih.netlify.app)

---

