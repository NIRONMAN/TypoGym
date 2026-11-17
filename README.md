<div align="center">

# ⌨️ TypoGym

**A precision touch-typing trainer and weakness-conditioning workbench.**

[![Next.js](https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript%205-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS%204-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand%205-443e38?style=for-the-badge&logo=react&logoColor=white)](https://zustand-demo.pmnd.rs/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

<br />

[**Explore Features**](#-key-features) • [**Live Preview**](#-live-preview--deployment) • [**Architecture**](#-architecture--tech-stack) • [**Getting Started**](#-getting-started--local-development) • [**Keyboard Shortcuts**](#-keyboard-shortcuts)

</div>

---

## 📖 Overview

**TypoGym** is not just another typing speed test—it is a **diagnostic typing gymnasium** engineered to isolate and eliminate mechanical friction in your typing. While standard typing tests only evaluate aggregate Words Per Minute (WPM), TypoGym tracks character-level reaction times, error clusters, and finger strain patterns.

Built with Next.js 15 App Router, React 19, and Tailwind CSS 4, TypoGym combines an ultra-clean, distraction-free terminal interface with an analytical telemetry suite that runs completely client-side.

```
┌────────────────────────────────────────────────────────────────────────┐
│  mode: normal [targeted]   time: 15s [30s] 60s 120s    🔥 7d streak     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   the quick brown fox jumps over the lazy dog                          │
│   ^                                                                    │
│   accuracy: 98.4%  •  net wpm: 92.5  •  reaction: 182ms                │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  ⚡ Weakness Detected: 'Q' (78% acc) — [ Train Single ] [ Train Cluster ]│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🌐 Live Preview & Deployment

| Environment | Link | Description |
| :--- | :--- | :--- |
| **Production Demo** | Self-hostable via `NEXT_PUBLIC_SITE_URL` | Live production deployment |
| **Local Workbench** | `http://localhost:3000` | Default local development instance |

> **Deploy to Vercel in 1-Click:**
> 
> [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNIRONMAN%2FTypoGym)

---

## ✨ Key Features

### ⚡ Distraction-Free Terminal Arena
- **Sliding Line Window:** Displays an ergonomic 3-line view with smooth vertical shifts, keeping your eye focus anchored at the center of the viewport.
- **Immediate First-Key Activation:** Start typing any key from idle to trigger sessions instantly—no clicks required.
- **Visual Feedback System:** Real-time character color transitions, blinking block cursor, and clear error highlights.
- **Responsive Layout:** Adaptive line lengths and font sizing optimized for desktops, laptops, and tablets.

### 🎯 Precision Targeted Practice
- **Single Letter Isolation:** Focus relentlessly on a specific key until mechanical hesitation drops to zero.
- **Custom Letter Clusters:** Select multi-character combinations (e.g., `[Q, X, Z]` or `[C, V, B]`) to condition difficult chord transitions.
- **Anatomical Finger Drills:** Target keys mapped directly to anatomical finger groupings (Left/Right Pinky, Ring, Middle, and Index fingers).
- **Adaptive Auto-Balance:** Generates practice prompts that automatically inject your highest-friction letters into balanced English vocabulary.

### 🧠 Weakness Engine & Mastery Analytics
- **Confidence-Weighted Scoring:** Prioritizes letters based on error rate, consecutive mistake streaks, and sample size:
  $$\text{Score} = (0.65 \times \text{ErrorRate} + 0.35 \times \text{StreakPenalty}) \times \text{Confidence}$$
- **Sub-Millisecond Latency Tracking:** Measures exact key reaction intervals (`avgReactionMs`) from prompt focus to keystroke.
- **4 Mastery Tiers:**
  - 🥉 **Novice:** `< 5` attempts
  - 🥈 **Apprentice:** `≥ 5` attempts, `≥ 75%` accuracy
  - 🥇 **Proficient:** `≥ 10` attempts, `≥ 88%` accuracy
  - 💎 **Master:** `≥ 15` attempts, `≥ 95%` accuracy
- **Spaced Retention & Decay Tracking:** Alerts you when mastered letters have degraded due to inactivity (`Fresh` < 7 days, `Needs-Review` 7–13 days, `Rusty` ≥ 14 days).

### 📊 Comprehensive Telemetry Dashboard
- **Consistency Heatmap:** 12-week GitHub-style activity contribution calendar logging sessions and total characters typed.
- **Interactive QWERTY Heatmap:** Full keyboard visualization color-coded by accuracy and mistake concentration.
- **Personal Bests Matrix:** High-score records automatically categorized across standard test durations (`15s`, `30s`, `60s`, `120s`).
- **Rolling 7-Session Deltas:** Real-time calculation of WPM and accuracy progression compared to your previous rolling window.
- **Chronological Trajectory Log:** Detailed history table of completed sessions with mode tags and net speeds.

### 🔒 100% Client-Side Privacy & Data Portability
- **Zero Cloud Tracking:** All telemetry, metrics, and session histories are stored locally on your device via Zustand and `localStorage`.
- **One-Click Backup & Restore:** Export your complete training profile to structured JSON or restore it on any new browser or device.
- **Instant Data Reset:** Clear your local session cache with a single confirmation.

### 🚀 Production-Grade Web Standards & PWA
- **Next.js 15 App Router:** Server-rendered structure paired with high-performance client leaf components.
- **SEO & Social Cards:** Comprehensive Open Graph, Twitter Cards, dynamic `robots.txt`, `sitemap.xml`, and web manifest (`manifest.webmanifest`).
- **Hardened HTTP Headers:** Preconfigured with `nosniff`, `DENY` framing, `strict-origin-when-cross-origin`, and restrictive permissions policies.

---

## ⌨️ Keyboard Shortcuts

Speed and efficiency are core to TypoGym. The entire workbench can be operated without touching a mouse:

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `[Any Key]` | Idle State | Immediately begins session with the pressed character |
| `Tab` | Running Session | Quick restart current session |
| `Tab` | Ended Session | Open deep Analytics & Weakness Dashboard |
| `Enter` | Idle / Ended | Start or restart session |
| `Esc` | Running Session | Abort/stop active session |
| `Esc` | Modal Open | Close Analytics modal and return to arena |
| `Backspace` | Running Session | Correct previous character or clear current error |

---

## 🏗️ Architecture & Tech Stack

```
TypoGym Architecture
┌────────────────────────────────────────────────────────┐
│                      Next.js 15                        │
│                 (App Router & Metadata)                │
└───────────────────────────┬────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌──────────────────────┐             ┌─────────────────────┐
│    Presentation      │             │    Engine & State   │
│  React 19 Components │             │  Zustand Store v5   │
│   Tailwind CSS v4    │             │  typingEngine.ts    │
└──────────┬───────────┘             └──────────┬──────────┘
           │                                    │
           │       localStorage (Offline-First) │
           └─────────────────►◄─────────────────┘
```

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) | `^16.1.6` (Next 15 spec) | App Router, Server Metadata, PWA generation, static optimization |
| **Library** | [React](https://react.dev/) | `^19.2.4` | Modern component architecture, React 19 hooks and compiler readiness |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `^5.x` | Strict end-to-end type safety, interfaces, and domain definitions |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^4.x` | Next-gen lightning-fast CSS styling, dark-mode terminal aesthetics |
| **State Store** | [Zustand](https://zustand-demo.pmnd.rs/) | `^5.0.11` | Reactive, lightweight state management with local persistence |
| **Testing** | Node.js Test Runner | Native (`node:test`) | Ultra-fast unit testing of typing algorithms and prompt engines |
| **Linting** | ESLint | `^9.x` | Strict flat-config static code quality and formatting checks |

---

## 📂 Project Structure

```text
TypoGym/
├── app/
│   ├── favicon.ico              # Browser icon
│   ├── globals.css              # Tailwind CSS 4 theme and terminal styles
│   ├── layout.tsx               # Root layout, HTML skeleton & SEO metadata
│   ├── manifest.ts              # Web Application Manifest generator (PWA)
│   ├── page.tsx                 # Main workstation view
│   ├── robots.ts                # Dynamic robots.txt configuration
│   ├── sitemap.ts               # Dynamic sitemap.xml generator
│   └── viewport.ts              # Responsive viewport & theme-color definition
├── components/
│   ├── AlphabetGrid.tsx         # Targeted practice control bar (letter, cluster, finger)
│   ├── Analytics.tsx            # In-arena telemetry display
│   ├── AnalyticsDashboard.tsx   # Comprehensive analytics modal (heatmap, charts, engine)
│   ├── ModeControls.tsx         # Top & bottom control strips (time, mode, streak)
│   └── Terminal.tsx             # Central sliding 3-line typing workstation
├── lib/
│   ├── apiClient.ts             # Client API helpers
│   ├── site.ts                  # Centralized site URL and SEO configuration
│   └── typingEngine.ts          # Core engine (metrics, prompt builder, scoring, decay)
├── public/
│   ├── artificialWords.json     # Curated phonetic corpora for letter targeting
│   └── words.json               # Primary English vocabulary dictionary
├── store/
│   └── index.ts                 # Zustand store, action creators & localStorage sync
├── tests/
│   └── typingEngine.test.ts     # Comprehensive unit tests for typingEngine
├── eslint.config.mjs            # ESLint 9 flat configuration
├── next.config.ts               # Security headers & Next.js compiler settings
├── package.json                 # Project dependencies & scripts
├── postcss.config.mjs           # PostCSS configuration for Tailwind 4
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 🚀 Getting Started & Local Development

### Prerequisites

- **Node.js**: `v20.x` or later (LTS recommended)
- **Package Manager**: `npm`, `pnpm`, or `yarn`

### 1. Clone the Repository

```bash
git clone https://github.com/NIRONMAN/TypoGym.git
cd TypoGym
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure Environment Variables (Optional)

Create a `.env.local` file to set your canonical domain:

```bash
# Optional: Set your production or custom development domain
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app will reload automatically as you modify files.

### 5. Run Unit Tests

Execute the native Node.js test suite to verify typing algorithms and scoring formulas:

```bash
npm run test
```

### 6. Run Code Linter

```bash
npm run lint
```

---

## 📦 Production Build & Deployment

### Build Locally

Compile the optimized production bundle:

```bash
npm run build
npm run start
```

### Production Deployment Checklist

1. **Environment Setup:** Set `NEXT_PUBLIC_SITE_URL` to your production URL in your deployment provider (e.g., your custom domain or localhost).
2. **Quality Gates:** Verify that both `npm run lint` and `npm run test` pass cleanly.
3. **PWA & Search Assets:** Confirm that `/robots.txt`, `/sitemap.xml`, and `/manifest.webmanifest` are served with correct headers.
4. **Deploy:** Deploy seamlessly to [Vercel](https://vercel.com/), [Railway](https://railway.app/), [Render](https://render.com/), or any containerized Node.js environment.

---

## 📊 Telemetry Data Model

All telemetry is serialized into human-readable JSON under the `typogym-progress-v1` key in `localStorage`:

```json
{
  "sessionHistory": [
    {
      "startedAt": 1731932400000,
      "endedAt": 1731932460000,
      "grossWpm": 95.4,
      "netWpm": 91.2,
      "accuracy": 98.2,
      "charsTyped": 320,
      "errors": 4,
      "modeMeta": {
        "mode": "targeted",
        "targetType": "cluster",
        "targetLetters": ["q", "x", "z"]
      }
    }
  ],
  "letterStats": {
    "q": {
      "letter": "q",
      "attempts": 48,
      "errors": 3,
      "successes": 45,
      "accuracy": 93.75,
      "avgReactionMs": 215.4,
      "streakError": 0,
      "lastSeenAt": 1731932460000
    }
  }
}
```

---

## 👨‍💻 Author & Credits

Crafted with care by **Niranjan Dabhade**:

- 🌐 **Portfolio:** [nironman.com](https://nironman.com)
- 🐙 **GitHub:** [@NIRONMAN](https://github.com/NIRONMAN)
- 💼 **LinkedIn:** [Niranjan Dabhade](https://www.linkedin.com/in/niranjan-dabhade/)

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE). Feel free to fork, customize, and build upon it!
