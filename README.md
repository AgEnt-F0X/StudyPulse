# StudyPulse 🎓

> **An AI-powered academic companion & study system built for students.**  
> Features real-time AI study coaching, CBSE-aligned exam preparation, step-by-step doubt solving, subjective answer grading, magic note enhancement, formula extraction, syllabus PDF import, and spaced repetition — powered by free, ultra-fast AI models.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Phosphor Icons](https://img.shields.io/badge/Icons-Phosphor%20%2B%20Lucide-059669)](https://phosphoricons.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B%20(~300%20t/s)-F05A28?logo=groq&logoColor=white)](https://groq.com)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-4285F4?logo=google&logoColor=white)](https://aistudio.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Netlify Ready](https://img.shields.io/badge/Deploy-Netlify%20Ready-00C7B7?logo=netlify&logoColor=white)](https://app.netlify.com/drop)

---

## ✨ Features

### 🤖 Intelligent AI Study Assistant
* **⚡ Multi-Provider AI Engine:** Direct client-side integration supporting:
  * **Groq Cloud:** `llama-3.3-70b-versatile` & `deepseek-r1-distill-llama-70b` at blazing inference speeds (~300 tokens/sec).
  * **Google Gemini:** `gemini-2.0-flash`.
  * **OpenRouter:** Free-tier open models.
  * *Auto-detects provider instantly based on API key prefix (`gsk_...`, `AIza...`, `sk-or-...`).*
* **🎓 Conversational AI Study Coach (`/assistant`):** Natural language study assistant capable of explaining complex topics, resolving doubts, generating study plans, and executing in-app tasks directly from chat.
* **🧮 Step-by-Step Doubt & Numerical Solver:** Comprehensive breakdowns for derivations, scientific concepts, and mathematical problems with structured stages (`Given → Formula → Substitution → Final Answer with SI Units`).
* **✅ CBSE Subjective Answer Evaluator:** Submit handwritten or typed answers to receive CBSE marking scheme grading (score out of 5), point-by-point breakdown of covered vs. missed concepts, and model answers.
* **🧠 Daily AI Morning Brief:** Automatically synthesizes a personalized morning briefing on your dashboard analyzing upcoming deadlines, focus streaks, and daily high-priority tasks.
* **📐 Formula & Key Points Extractor:** Automatically extracts core formulas, physical constants, definitions, and theorems into clean reference cards with LaTeX math notation.

---

### 📝 Notes & Knowledge Management
* **✍️ Rich Markdown & LaTeX Math Editor:** Full formatting support for headings, bold/italic text, bulleted lists, numbered sequences, task checklists, blockquotes, code blocks, and inline/block math equations.
* **✨ Magic Notes (AI Note Enhancer):** Transform raw lecture notes into structured, exam-ready study guides with one click.
* **🗂️ Instant Deck & Quiz Generation:** Convert any note into a spaced repetition flashcard deck or an interactive practice quiz automatically.
* **💾 Local Persistence & Export:** All notes are persisted offline and can be exported for studying anytime.

---

### 📚 Curriculum, Revision & Exam Prep
* **📄 PDF Syllabus Importer (`/import`):** Upload CBSE, school, or university syllabus PDFs to automatically parse chapters, extract sub-topics, and populate organized assignment schedules using client-side `pdfjs-dist`.
* **🧩 Interactive AI Quiz Generator (`/quiz`):** Generate customized multiple-choice practice tests by topic or from uploaded notes with instant scoring, timer modes, and detailed answer explanations.
* **🗂️ Spaced Repetition Flashcards (`/flashcards`):** Active recall flashcard system categorized by difficulty levels (Foundation to Olympic tier) with mastery tracking and review intervals.

---

### ⏱️ Academic Productivity & Habit Building
* **📅 Assignment & Task Manager:** Organize homework, projects, and lab reports with natural language date parsing, priority flags, and subject categorizations.
* **⏱️ Pomodoro Focus Mode (`/focus`):** Dedicated focus sessions with customizable study and break intervals (25/5, 50/10, 90/20) and integrated task tracking.
* **🔥 Habit Tracker (`/habits`):** Daily streak counters and weekly completion grids to cultivate consistent study routines.
* **📈 Academic Analytics & Performance Tracker (`/analytics`):** Track total study time, assignment completion rates, weekly subject distribution, and projected GPA.
* **🏆 Gamified XP & Study Levels (`/leaderboard`):** Earn experience points (XP), build continuous study streaks, unlock achievement badges, and level up your student profile.
* **🔍 Global Command Palette (`⌘K` / `Ctrl+K`):** Jump to any course, tool, note, or action instantly via keyboard search.

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/AgEnt-F0X/StudyPulse.git
cd StudyPulse

# Install client dependencies
cd client
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Add Free AI API Key
1. Go to **Settings** (`/settings`) in the app.
2. In the **AI Intelligence & API Key** section, paste any free API key:
   * **[Groq Cloud (Recommended — Ultra Fast ~300 t/s)](https://console.groq.com/keys)** (`gsk_...`)
   * **[Google AI Studio](https://aistudio.google.com/apikey)** (`AIza...`)
   * **[OpenRouter](https://openrouter.ai/keys)** (`sk-or-...`)
3. Click **Save Key**. The app will immediately activate AI generation across all features!

---

## 🌐 Deployment

### Option A: Netlify (Recommended)

The app includes pre-configured `_redirects` and `netlify.toml` for Single Page Application (SPA) routing.

#### 1. Instant Drag-and-Drop (30 Seconds — No Git Required)
1. Build the production client:
   ```bash
   cd client
   npm run build
   ```
2. Open **[Netlify Drop](https://app.netlify.com/drop)** in your browser.
3. Drag and drop the `client/dist` folder into the upload box.
4. Your app is immediately live with a free HTTPS URL!

#### 2. Connect via GitHub
1. Push your repository to GitHub.
2. In [Netlify](https://app.netlify.com), select **Add new site** → **Import an existing project** → **GitHub**.
3. Netlify automatically detects the root configuration:
   * **Base directory:** `client`
   * **Build command:** `npm run build`
   * **Publish directory:** `dist`
4. Click **Deploy Site**.

---

### Option B: School Computer / USB Pen Drive (Offline / Portable)

Because modern browsers restrict JavaScript modules (`<script type="module">`) from loading over `file:///` protocols, you can run the app portably on school computers using a 1-click script:

1. Copy the `dist` folder to your USB drive.
2. Next to `dist`, create a file named `Start_StudyPulse.bat`:
   ```cmd
   @echo off
   cd dist
   start http://localhost:8000
   python -m http.server 8000
   ```
3. Double-click `Start_StudyPulse.bat` on any computer with Python installed to run the app locally.

---

## 📁 Project Structure

```
StudyPulse/
├── client/                     # Frontend React + Vite SPA
│   ├── public/                 # Static assets & Netlify _redirects
│   ├── src/
│   │   ├── components/         # Reusable components (AIChat, PomodoroTimer, etc.)
│   │   ├── pages/              # Application feature views
│   │   │   ├── AIAssistant.jsx # Conversational AI Study Coach
│   │   │   ├── Home.jsx        # Dashboard with AI Daily Brief & stats
│   │   │   ├── Notes.jsx       # Notes editor with AI Magic enhancer
│   │   │   ├── Quiz.jsx        # Interactive quiz generator
│   │   │   ├── Flashcards.jsx  # Spaced repetition flashcard decks
│   │   │   ├── Habits.jsx      # Daily habit tracker
│   │   │   ├── FocusMode.jsx   # Pomodoro focus timer
│   │   │   ├── Analytics.jsx   # Performance & GPA metrics
│   │   │   ├── Settings.jsx    # Multi-provider API key management
│   │   │   └── ...
│   │   ├── stores/             # Zustand state stores (localStorage sync)
│   │   └── utils/
│   │       ├── aiActions.js    # Intent parser, doubt solver & answer grader
│   │       ├── gemini.js       # Multi-provider unified LLM client
│   │       ├── pdfParser.js    # Client-side PDF extractor (pdfjs-dist)
│   │       └── theme.js        # Design tokens & color palette
│   ├── netlify.toml            # Netlify deployment configuration
│   ├── package.json            # Client dependencies
│   └── vite.config.js          # Vite build & chunking configuration
├── netlify.toml                # Monorepo root Netlify configuration
└── package.json                # Root package configuration
```

---

## 🛠️ Tech Stack

* **Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
* **State Management:** [Zustand](https://github.com/pmndrs/zustand) (with offline `localStorage` persistence)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Animations:** [Framer Motion](https://www.framer.com/motion/)
* **PDF Processing:** [pdfjs-dist](https://mozilla.github.io/pdf.js/)
* **AI Providers:**
  * [Groq Cloud](https://groq.com/) (Llama 3.3 70B, DeepSeek R1)
  * [Google Gemini](https://ai.google.dev/) (Gemini 2.0 Flash)
  * [OpenRouter](https://openrouter.ai/)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
