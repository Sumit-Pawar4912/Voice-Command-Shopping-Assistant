# 🎙️ Voice Command Shopping Assistant

A voice-controlled shopping list application that lets users manage their shopping list using natural language — spoken or typed. Speech is transcribed in the browser, interpreted by Google Gemini into structured JSON, and applied to a persistent SQLite-backed shopping list.

---

## 📖 Project Overview

Say "Add two bottles of milk" and watch it appear on your list. Say "Remove bread" and it's gone. The app combines the browser's native Web Speech API with a FastAPI backend that uses Gemini purely as a natural-language-understanding layer — Gemini never touches the database directly, it only converts speech into a small structured JSON object which the backend then validates and executes.

## ✨ Features

- **Voice input** via the Web Speech API — real-time transcription, English/Hindi/Marathi support
- **AI-powered NLP** — Gemini converts natural language into structured `{action, item, quantity, ...}` JSON; a rule-based fallback keeps things working even without an API key
- **Shopping list management** — add, remove, update, clear, auto-categorization (Dairy, Produce, Bakery, Grocery, Snacks, Beverage, Personal Care, Household)
- **Smart suggestions**
  - Frequently purchased items
  - Seasonal recommendations (summer / monsoon / winter)
  - Substitute product suggestions (e.g. Milk → Almond Milk, Soy Milk)
- **Product search** — mock catalog with brand, price range, category, and organic filters
- **Multilingual** — browser speech recognition in English, Hindi, and Marathi; Gemini normalizes everything to English JSON
- **Polished UI** — dashboard with mic button + listening animation, toast notifications, loading states, dark mode
- **Bonus features** — recent command history, shopping list export, offline mode via local storage cache

## 🧱 Tech Stack

**Frontend:** React 19 (Vite), Tailwind CSS, Axios, React Icons, React Router, Context API, Web Speech API
**Backend:** Python 3.12+, FastAPI, SQLAlchemy, SQLite, Pydantic, Uvicorn
**AI:** Google Gemini API (`gemini-1.5-flash`, free tier) — NLU only, never touches the database
**Deployment:** Vercel (frontend), Render (backend)

## 📂 Project Structure

```
voice-shopping-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI app entrypoint
│   │   ├── database.py     # SQLAlchemy engine/session
│   │   ├── models.py       # ORM models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── crud.py         # Database operations
│   │   ├── ai_service.py   # Gemini NLU integration + fallback parser
│   │   ├── routes.py       # API endpoints
│   │   ├── utils.py        # Categorization, catalog, recommendations
│   │   └── config.py       # Environment configuration
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Dashboard page
    │   ├── hooks/          # useSpeechRecognition
    │   ├── context/        # ShoppingContext (global state)
    │   ├── services/       # Axios API client
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── .env.example
```


## 🔑 Environment Variables

**backend/.env**
```
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///./shopping.db
ALLOWED_ORIGINS=http://localhost:5173
```

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:8000/api
```

## ▶️ Run Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # then add your GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

## ▶️ Run Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App available at `http://localhost:5173`. Use Chrome or Edge for the best Web Speech API support.

## 📡 API Documentation

| Method | Endpoint | Description |
|--------|----------|--------------|
| POST | `/api/process-command` | Interpret a voice/text command and apply it |
| GET | `/api/items` | Get the full shopping list |
| POST | `/api/items` | Manually add an item |
| PUT | `/api/items/{id}` | Update an item |
| DELETE | `/api/items/{id}` | Delete an item |
| DELETE | `/api/items` | Clear the entire list |
| GET | `/api/recommendations` | Get frequent/seasonal/substitute suggestions |
| GET | `/api/search` | Search the mock product catalog |
| GET | `/api/history` | Get recent voice commands |

Interactive Swagger docs are auto-generated at `/docs` when the backend is running.

## 🖼️ Screenshots

_Add screenshots of the dashboard, listening state, and shopping list here._

`docs/screenshot-dashboard.png`
`docs/screenshot-listening.png`

## 🔮 Future Improvements

- Persist user accounts and multi-user shopping lists
- Push notifications for price drops on wishlisted products
- Real e-commerce catalog integration (replace mock catalog)
- Voice-based checkout confirmation
- PWA support for true offline-first experience

---

Built as a full-stack technical demonstration project.
