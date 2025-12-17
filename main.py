from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from typing import List, Optional
from dotenv import load_dotenv
import os

# --------------------------------------------------
# ENV
# --------------------------------------------------
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing Supabase credentials")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# --------------------------------------------------
# APP
# --------------------------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# MODELS
# --------------------------------------------------
class Answer(BaseModel):
    question_id: str
    difficulty: str   # easy | medium | hard
    correct: bool

class RequestPayload(BaseModel):
    student_id: str
    teacher_id: Optional[str] = None
    answers: List[Answer]
    grade: str
    language: str

# --------------------------------------------------
# SCORE LOGIC
# --------------------------------------------------
def update_score(current_score: int, answers: List[Answer]) -> int:
    score = current_score

    for a in answers:
        if a.correct:
            score += {"easy": 1, "medium": 3, "hard": 5}[a.difficulty]
        else:
            score -= {"easy": 5, "medium": 3, "hard": 1}[a.difficulty]

    return max(0, min(100, score))

# --------------------------------------------------
# DIFFICULTY DISTRIBUTION
# --------------------------------------------------
def get_distribution(score: int):
    if score >= 90:
        return {"hard": 3, "medium": 1, "easy": 1}
    if score >= 70:
        return {"hard": 2, "medium": 2, "easy": 1}
    if score >= 50:
        return {"hard": 1, "medium": 3, "easy": 1}
    if score >= 30:
        return {"hard": 1, "medium": 2, "easy": 1}
    return {"hard": 1, "medium": 1, "easy": 3}

# --------------------------------------------------
# QUESTION SELECTION (STRICT LANGUAGE)
# --------------------------------------------------
def select_questions(grade: int, language: str, distribution: dict):
    selected = []

    for difficulty, count in distribution.items():
        res = sb.table("questions_bank") \
            .select("*") \
            .eq("grade", grade) \
            .eq("language", language) \
            .eq("difficulty_level", difficulty) \
            .order("created_at", desc=True) \
            .limit(count) \
            .execute()

        qs = res.data or []
        selected.extend(qs)

    if not selected:
        raise HTTPException(
            status_code=404,
            detail=f"No questions available for grade {grade} and language {language}"
        )

    return selected

# --------------------------------------------------
# MAIN ENDPOINT
# --------------------------------------------------
@app.post("/ai/next-set")
def ai_next_set(payload: RequestPayload):

    # convert grade safely
    try:
        grade = int(payload.grade)
    except ValueError:
        raise HTTPException(status_code=400, detail="Grade must be a number")

    # fetch current score
    res = sb.table("users") \
        .select("difficulty_score") \
        .eq("id", payload.student_id) \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Student not found")

    current_score = res.data[0]["difficulty_score"] or 100

    # update score
    new_score = update_score(current_score, payload.answers)

    sb.table("users") \
        .update({"difficulty_score": new_score}) \
        .eq("id", payload.student_id) \
        .execute()

    distribution = get_distribution(new_score)

    questions = select_questions(
        grade=grade,
        language=payload.language,
        distribution=distribution
    )

    return {
        "score": new_score,
        "distribution": distribution,
        "questions": questions
    }

# --------------------------------------------------
# HEALTH
# --------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}
