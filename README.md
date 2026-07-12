# Typeform Clone

A full-stack Typeform clone built with Next.js and FastAPI. Create beautiful conversational forms, collect responses one question at a time, and analyze results — all with a polished UI inspired by Typeform.

## Live Demo

- **Frontend:** Deploy to Vercel (see Deployment section)
- **Backend:** Deploy to Render/Railway (see Deployment section)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Framer Motion, @dnd-kit |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite |

## Features

### Form Builder
- Create forms with title and ordered questions
- 8 question types: short text, long text, multiple choice, dropdown, email, number, yes/no, rating
- Drag-and-drop reordering
- Per-question settings (required toggle, description/help text)
- Live preview panel
- Publish/unpublish with shareable links

### Respondent Flow
- One-question-at-a-time conversational experience
- Smooth animated transitions (Framer Motion)
- Keyboard navigation (Enter to advance, arrows to navigate)
- Progress indicator
- Client + server validation
- Customizable thank-you screen

### Results & Analytics
- Per-form response list
- Individual response detail view
- Summary statistics with distribution charts
- Response counts per question

### Form Management
- List all forms with status and response counts
- Create, rename, duplicate, delete forms
- Draft/published status management

## Project Structure

```
form-type/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── database.py      # SQLAlchemy setup
│   │   ├── models.py        # Database models
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── routers/
│   │       ├── forms.py     # Form CRUD + questions
│   │       ├── public.py    # Public form fill endpoints
│   │       └── responses.py # Response viewing
│   ├── seed.py              # Database seeder
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx                    # Dashboard (forms list)
│       │   ├── forms/[id]/build/page.tsx   # Form builder
│       │   ├── forms/[id]/results/page.tsx # Results view
│       │   └── to/[slug]/page.tsx          # Public respondent flow
│       ├── components/
│       │   ├── builder/       # Builder components
│       │   ├── Modal.tsx
│       │   └── Toast.tsx
│       └── lib/
│           ├── api.ts         # API client
│           └── types.ts       # TypeScript types
└── README.md
```

## Database Schema

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│    forms    │       │  questions   │       │  responses   │
├─────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)     │──┐    │ id (PK)      │    ┌──│ id (PK)      │
│ title       │  ├───>│ form_id (FK) │    │  │ form_id (FK) │
│ description │  │    │ type         │    │  │ submitted_at │
│ status      │  │    │ title        │    │  └──────────────┘
│ share_slug  │  │    │ description  │    │         │
│ thank_you_* │  │    │ required     │    │         │
│ created_at  │  │    │ order        │    │         ▼
│ updated_at  │  │    │ options(JSON)│    │  ┌──────────────┐
└─────────────┘  │    │ settings(JSON)│   │  │   answers    │
                 │    └──────────────┘    │  ├──────────────┤
                 │           │            └──│ response_id  │
                 └───────────────────────────│ question_id  │
                                             │ value        │
                                             └──────────────┘
```

**Relationships:**
- `forms` 1:N `questions` (cascade delete)
- `forms` 1:N `responses` (cascade delete)
- `responses` 1:N `answers` (cascade delete)
- `questions` 1:N `answers`

## API Overview

### Forms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forms` | List all forms |
| POST | `/api/forms` | Create form |
| GET | `/api/forms/:id` | Get form with questions |
| PUT | `/api/forms/:id` | Update form |
| DELETE | `/api/forms/:id` | Delete form |
| POST | `/api/forms/:id/duplicate` | Duplicate form |
| PATCH | `/api/forms/:id/publish` | Publish/unpublish |
| GET | `/api/forms/:id/stats` | Get summary statistics |

### Questions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/forms/:id/questions` | Add question |
| PUT | `/api/forms/:id/questions/:qid` | Update question |
| DELETE | `/api/forms/:id/questions/:qid` | Delete question |
| PUT | `/api/forms/:id/questions/reorder` | Reorder questions |

### Public (no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/forms/:slug` | Get published form |
| POST | `/api/public/forms/:slug/responses` | Submit response |

### Responses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forms/:id/responses` | List responses |
| GET | `/api/forms/:id/responses/:rid` | Get response detail |

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed.py          # Seed sample data
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at: http://localhost:3000

### Sample Data

The seed script creates:
1. **Customer Feedback Survey** (published) — `/to/feedback2024` — 4 responses
2. **Tech Conference 2024 Registration** (draft)
3. **Quick Team Lunch Poll** (published) — `/to/lunchpoll` — 7 responses

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import project in Vercel, set root to `frontend/`
3. Set env var: `NEXT_PUBLIC_API_URL=https://your-backend-url.com`

### Backend (Render/Railway)
1. Set root to `backend/`
2. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Run `python seed.py` after first deploy

## Assumptions

- **Authentication:** Simplified — assumes a single default creator (no login required for builder)
- **Theming:** Placeholder for custom themes (Coming Soon)
- **Logic jumps:** Placeholder (Coming Soon)
- **CSV Export:** Placeholder (Coming Soon)
- **Integrations:** Placeholder (Coming Soon)

## Architecture Decisions

1. **SQLite** for simplicity and zero-config local development; easily swappable to PostgreSQL
2. **Share slug** instead of UUID in public URLs for cleaner shareable links
3. **JSON columns** for question options/settings for flexibility without schema migrations
4. **Client-side animations** with Framer Motion for the signature Typeform feel
5. **@dnd-kit** for accessible drag-and-drop in the builder
6. **Optimistic UI updates** in the builder for snappy editing experience
