from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app.routes.forms import router as forms_router
from app.routes.options import router as options_router
from app.routes.questions import router as questions_router
from app.routes.responses import router as responses_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Typeform API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms_router)
app.include_router(questions_router)
app.include_router(options_router)
app.include_router(responses_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Typeform Backend"
    }


@app.get("/health")
def health():
    return {
        "status": "Backend is running"
    }