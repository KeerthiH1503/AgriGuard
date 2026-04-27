# AgriGuard
An AI-powered web application that helps farmers with crop disease detection, market analysis, and personalised guidance. Built with Firebase and Gemini.
# 🌾 AgriGuard — AI-Powered Farming Assistant

![React](https://img.shields.io/badge/React.js-20232A?style=flat&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat&logo=google&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

> An AI-powered web application that empowers farmers with crop disease detection, smart weather forecasting, market insights, and personalised farming guidance — all accessible in their native language.

---

## ✨ Features

### 🔬 AI Disease Detector (Computer Vision)
- Upload or capture a leaf/plant photo using your device camera (WebRTC)
- Image sent to **Gemini 2.5 Flash Vision AI** for multimodal analysis
- Returns structured JSON: Disease Name · Symptoms · Root Cause · Treatment Options

### 🌦️ Smart Weather Forecaster
- Fetches live 5-day forecast via **WeatherAPI.com**
- Gemini AI interprets the data as an agricultural expert
- Gives actionable advice e.g. *"Heavy rain Tuesday — delay pesticide application"*

### 📈 Market Insights Tracker
- Input any crop name + region
- AI generates concise market analysis with price trends and key factors

### 🤖 Farming Guide & Planting Scheduler
- AI chatbot for farming Q&A (ask anything about crops/soil/pests)
- Personalized planting schedules from sowing to harvest

### 🏛️ Government Schemes Portal
- Curated info on PM-KISAN, PMFBY, KCC and more
- Direct links to official government portals

### 🌐 Universal AI Translator
- One-click translation of all AI outputs into user's preferred regional language
- Built using a custom `TranslatableText` React component + Gemini language API
- Makes the app fully accessible to rural, non-English-speaking farmers

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (SPA), Tailwind CSS, Lucide React, HTML5 WebRTC |
| Backend (BaaS) | Google Firebase (Auth + Cloud Firestore) |
| AI Engine | Google Gemini API (gemini-2.5-flash) — Vision + NLP + Translation |
| Weather | WeatherAPI.com |
| State Management | React Context API (AppContext) |
| Resilience | Exponential Backoff retry (`fetchWithRetry`) |

---

## 🚀 Getting Started

```bash
git clone https://github.com/Keerthi-H/agriguard.git
cd agriguard
npm install
npm run dev
```

Create a `.env` file in the root:

```env
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_WEATHER_API_KEY=your_weatherapi_key
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Authentication

Supports three login methods:
- Email / Password
- Google OAuth
- Anonymous (Guest) login

---

## 🏗️ Architecture Highlights

- **Real-time sync** — Firebase `onSnapshot` updates the UI globally without page refresh
- **Multimodal AI** — Combines Computer Vision (image) + NLP (text) in a single pipeline
- **Resilient networking** — Exponential backoff retries for poor rural internet connections
- **Contextual intelligence** — Weather isn't just displayed; it's interpreted for farming decisions

---

## 👩‍💻 Author

**Keerthi H** · B.Tech CSE, CMR University, Bengaluru (2024–2028)
📧 keerthih1503@gmail.com · [LinkedIn](https://www.linkedin.com/in/keerthi-h-a2b1aa32a)
