from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from typing import List, Optional
from dotenv import load_dotenv
import os
import random

# --------------------------------------------------
# ENV
# --------------------------------------------------
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

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
    difficulty: str
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
def update_score(score: int, answers: List[Answer]) -> int:
    for a in answers:
        if a.correct:
            score += {"easy": 1, "medium": 3, "hard": 5}.get(a.difficulty, 0)
        else:
            score -= {"easy": 5, "medium": 3, "hard": 1}.get(a.difficulty, 0)
    return max(0, min(100, score))

# --------------------------------------------------
# DISTRIBUTION
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
# SAFE RANDOM QUESTION SELECTION
# --------------------------------------------------
def select_questions_safe(grade: str, language: str, distribution):
    grade_int = int(grade)
    lang = language.strip().lower()

    selected = []

    for difficulty, count in distribution.items():

        # 1️⃣ strict match
        res = sb.table("questions_bank") \
            .select("*") \
            .eq("grade", grade_int) \
            .eq("difficulty_level", difficulty) \
            .execute()

        qs = res.data or []

        # 2️⃣ fallback: ignore difficulty
        if not qs:
            qs = sb.table("questions_bank") \
                .select("*") \
                .eq("grade", grade_int) \
                .execute().data or []

        # 3️⃣ fallback: ignore grade
        if not qs:
            qs = sb.table("questions_bank") \
                .select("*") \
                .execute().data or []

        random.shuffle(qs)
        selected.extend(qs[:count])

    # 4️⃣ absolute fallback (table not empty)
    if not selected:
        all_qs = sb.table("questions_bank").select("*").execute().data or []
        if not all_qs:
            raise HTTPException(500, "questions_bank is empty")
        random.shuffle(all_qs)
        selected = all_qs[:5]

    return selected

# --------------------------------------------------
# MAIN ENDPOINT
# --------------------------------------------------
@app.post("/ai/next-set")
def ai_next_set(payload: RequestPayload):

    res = sb.table("users") \
        .select("difficulty_score") \
        .eq("id", payload.student_id) \
        .execute()

    if not res.data:
        raise HTTPException(404, "Student not found")

    current_score = res.data[0]["difficulty_score"]
    new_score = update_score(current_score, payload.answers)

    sb.table("users") \
        .update({"difficulty_score": new_score}) \
        .eq("id", payload.student_id) \
        .execute()

    distribution = get_distribution(new_score)

    questions = select_questions_safe(
        payload.grade,
        payload.language,
        distribution
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
