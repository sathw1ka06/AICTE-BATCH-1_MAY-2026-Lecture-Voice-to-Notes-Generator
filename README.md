# Edu AI

AI-powered lecture transcription and study material generator. Upload an audio file and get a full transcript, structured notes, flashcards, and a quiz — automatically.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18+ |
| Python | 3.10+ |
| PostgreSQL | 14+ |
| ffmpeg | any (required by Whisper) |

Install ffmpeg on Windows:
```
winget install ffmpeg
```

---

## First-time setup

### 1. Install root launcher
```
npm install
```

### 2. Install frontend dependencies
```
cd frontend
npm install
cd ..
```

### 3. Install backend dependencies
```
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Configure environment
```
copy backend\.env.example backend\.env
```
Open `backend\.env` and fill in:
- `DATABASE_URL` — your PostgreSQL connection string
- `SECRET_KEY` — any long random string
- `GEMINI_API_KEY` — from https://aistudio.google.com/app/apikey

### 5. Create the database
```
psql -U postgres -c "CREATE DATABASE eduscribe;"
```
Tables are created automatically on first backend startup.

---

## Running the app

### Start everything (recommended)
```
npm run dev
```
Starts the FastAPI backend and Next.js frontend in one terminal with color-coded output. If either process crashes, both are stopped.

### Start individually
```
npm run backend     # FastAPI on http://localhost:8000
npm run frontend    # Next.js on http://localhost:3000
```

Open http://localhost:3000 in your browser.

---

## API docs

FastAPI auto-generates interactive docs while the backend is running:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
