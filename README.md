# 🛡️ Learn Arena: Make Learning Addictive

---

### The Mission

Traditional study apps can be boring. They can feel like digital textbooks. **Learn Arena** changes the game. We've coded an adrenaline-pumping study tool that treats studying and quizzes like a series of missions. No dull moment necessary — just a direct, addictive interface designed for students who need to stay in the zone.

### The Tech Stack

- **Build Tool:** Vite (Ultra-fast HMR)
- **Framework:** React + TypeScript
- **Persistence:** Dexie.js (IndexedDB) — *Your data stays in your "blind corner," not on a server.*
- **Styling:** Tailwind CSS (Tactical utility classes)
- **Intelligence:** Gemini 1.5 Flash (Vision AI for "Snap to Study" JSON generation)
- **Deployment:** GitHub Pages (Static hosting)

### 🛰️ Core Features

- **A Lobby/Home Page:** Real-time XP tracking, Gem rewards, and "completed" status stamps on quest cards.
- **Snap to Study:** Uses Vision AI to OCR textbook photos and instantly generate interactive mission-based quizzes and study material.
- **Telemetry (Local Persistence):** We use a local login and Dexie.js. Your rank, XP, and gems are saved locally on your device. Even if you lose signal, the arena stays active.
- **Quest Uploads:** A localized hub for uploading quests (quizzes) locally.

### 🚀 Developer Setup

If you want to run this tool:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 🛡️ Privacy & Data Sovereignty

This app is built on a **Local-First** philosophy. We don't upload your credentials or study data to a central database. Everything lives in the browser's IndexedDB, ensuring 100% data sovereignty.

---

**"Wait, be patient, and get to work. Quests await you."**
