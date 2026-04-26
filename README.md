# CampusConnect — AI-Powered Campus Ambassador Management Platform

> Built for AICore Connect Hackathon by UnsaidTalks Education · April 26, 2026

## Demo Video

<!-- Add your screen recording link here after recording -->
📹 **[Watch Demo Video](#)** ← Replace with your actual recording link

---

## Problem Statement

Campus Ambassador programs fail silently — not because of poor intent, but because organizations rely on spreadsheets, WhatsApp groups, and manual forms. Ambassadors disengage when they lack clarity, recognition, and structure. Managers lose visibility and can't scale.

## Solution

**CampusConnect** is a full-stack AI-powered platform that centralizes ambassador management:

- **Ambassadors** get a personal dashboard with tasks, points, badges, streaks, and a live leaderboard
- **Admins** get a control panel to assign tasks, track performance, and generate AI-powered insights
- **Gemini 2.0 Flash** auto-scores task submissions, generates engagement nudges, and writes program health reports

---

## Features

### Ambassador View
- Personal dashboard — real-time points, rank, streak tracker, progress bar
- Task list with proof-of-work submission form
- **AI task scoring** — submit proof → Gemini scores (0–100) + gives feedback instantly
- Badge system: First Step, On Fire 🔥, Century Club 💯, Event Host 🎪, Content King 👑, Top Referrer 🚀
- Live leaderboard with podium view

### Admin View
- Program overview with key metrics (ambassadors, points, referrals, pending reviews)
- Full ambassador roster with activity status
- Task management — create tasks, assign to all ambassadors, approve submissions
- **AI Nudge Generator** — select ambassador → Gemini writes personalized re-engagement message
- **AI Program Report** — one-click health report from live program data

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS + inline CSS |
| Fonts | Bebas Neue, Space Grotesk |
| AI | Google Gemini 2.0 Flash API |
| Storage | localStorage (no backend required) |
| Language | TypeScript |

---

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/campusconnect.git
cd campusconnect
```

### 2. Install dependencies
```bash
npm install
```

### 3. Add your Gemini API key
Create `.env.local` in the project root:
```
GEMINI_API_KEY=your_gemini_api_key_here
```
Get a free key at [aistudio.google.com](https://aistudio.google.com)

### 4. Run the app
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## How to Use

1. **Landing page** — Select Ambassador or Admin
2. **As Ambassador** — Pick a profile → see your dashboard → go to Tasks → write proof → submit for AI scoring
3. **As Admin** — Enter dashboard → Overview stats → Create tasks under Tasks tab → Use AI Tools for nudges and reports

---

## AI Features (Gemini 2.0 Flash)

| Feature | How it works |
|---|---|
| Task Auto-Scoring | Ambassador submits proof → Gemini scores 0–100 → points awarded proportionally |
| Nudge Generator | Admin picks ambassador → Gemini writes personalized re-engagement WhatsApp message |
| Program Report | Admin clicks generate → Gemini writes 4–5 sentence health summary with recommendations |

---

## Project Structure

```
campusconnect/
├── app/
│   ├── page.tsx              ← Landing page
│   ├── ambassador/page.tsx   ← Ambassador dashboard
│   ├── admin/page.tsx        ← Admin panel
│   └── api/ai/route.ts       ← Gemini API route
├── lib/
│   ├── data.ts               ← Data models + localStorage
│   └── gemini.ts             ← Gemini API client
└── .env.local                ← API key (not committed)
```

---

Built by **Maithalee Vishe** | AICore Connect Hackathon | UnsaidTalks Education
