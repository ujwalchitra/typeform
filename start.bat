@echo off
echo Starting Typeform Clone Backend...
cd backend
start cmd /k "uvicorn app.main:app --reload --port 8000"
echo Starting Typeform Clone Frontend...
cd ..\frontend
start cmd /k "npm run dev"
echo Both servers starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
