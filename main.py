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
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# IN-MEMORY QUESTION POOL
# --------------------------------------------------
QUESTION_POOL = {}

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
def update_score(current, answers):
    score = current
    for a in answers:
        if a.correct:
            score += {"easy": 1, "medium": 3, "hard": 5}[a.difficulty]
        else:
            score -= {"easy": 5, "medium": 3, "hard": 1}[a.difficulty]
    return max(0, min(100, score))

# --------------------------------------------------
# DISTRIBUTION
# --------------------------------------------------
def get_distribution(score):
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
# BUILD QUESTION POOL (FETCH ALL ONCE)
# --------------------------------------------------
def build_pool(grade, subject, language):
    res = sb.table("questions_bank") \
        .select("*") \
        .eq("grade", int(grade)) \
        .eq("subject", subject) \
        .eq("language", language) \
        .execute()

    data = res.data or []
    if not data:
        raise HTTPException(404, "No questions in DB")

    easy = [q for q in data if q["difficulty_level"] == "easy"]
    medium = [q for q in data if q["difficulty_level"] == "medium"]
    hard = [q for q in data if q["difficulty_level"] == "hard"]

    random.shuffle(easy)
    random.shuffle(medium)
    random.shuffle(hard)

    return {"easy": easy, "medium": medium, "hard": hard}

# --------------------------------------------------
# GET QUESTIONS (NO REPEAT)
# --------------------------------------------------
def draw_questions(pool, distribution):
    selected = []

    for diff, count in distribution.items():
        for _ in range(count):
            if pool[diff]:
                selected.append(pool[diff].pop())

    return selected

# --------------------------------------------------
# MAIN ENDPOINT
# --------------------------------------------------
@app.post("/ai/next-set")
def ai_next_set(payload: RequestPayload):

    # 1️⃣ get current score
    res = sb.table("users") \
        .select("difficulty_score") \
        .eq("id", payload.student_id) \
        .execute()

    if not res.data:
        raise HTTPException(404, "Student not found")

    current_score = res.data[0]["difficulty_score"]

    # 2️⃣ update score
    new_score = update_score(current_score, payload.answers)

    sb.table("users") \
        .update({"difficulty_score": new_score}) \
        .eq("id", payload.student_id) \
        .execute()

    distribution = get_distribution(new_score)

    # 3️⃣ pool key
    key = (
        payload.student_id,
        payload.grade,
        "Language",
        payload.language.lower()
    )

    # 4️⃣ create / refresh pool
    if key not in QUESTION_POOL or all(
        len(QUESTION_POOL[key][d]) == 0 for d in ["easy", "medium", "hard"]
    ):
        QUESTION_POOL[key] = build_pool(
            payload.grade,
            "Language",
            payload.language.lower()
        )

    pool = QUESTION_POOL[key]

    # 5️⃣ draw questions
    questions = draw_questions(pool, distribution)

    # 6️⃣ force refresh if insufficient
    if len(questions) < sum(distribution.values()):
        QUESTION_POOL[key] = build_pool(
            payload.grade,
            "Language",
            payload.language.lower()
        )
        questions = draw_questions(
            QUESTION_POOL[key],
            distribution
        )

    if not questions:
        raise HTTPException(404, "No questions available")

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
