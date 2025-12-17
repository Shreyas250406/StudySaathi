from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from typing import List, Optional
from dotenv import load_dotenv
from datetime import datetime
import os
import random

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

# --------------------------------------------------
# CORS
# --------------------------------------------------
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
# DISTRIBUTION LOGIC
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
# TEACHER ANALYSIS
# --------------------------------------------------
def sync_teacher_student_analysis(student_id, teacher_id, score):
    if not teacher_id:
        return

    if score < 40:
        sb.table("teacher_student_analysis").upsert({
            "student_id": student_id,
            "teacher_id": teacher_id,
            "current_level": score,
            "ai_focus_required": True,
            "ai_analysis": f"Score dropped to {score}",
            "last_updated": datetime.utcnow().isoformat()
        }).execute()
    else:
        sb.table("teacher_student_analysis") \
            .delete() \
            .eq("student_id", student_id) \
            .eq("teacher_id", teacher_id) \
            .execute()

# --------------------------------------------------
# QUESTION SELECTION (FIXED + RANDOMIZED)
# --------------------------------------------------
def select_questions(student_id, grade, language, distribution):
    selected = []

    # already asked questions
    asked = sb.table("question_history") \
        .select("question_id") \
        .eq("student_id", student_id) \
        .execute().data or []

    asked_ids = [q["question_id"] for q in asked]

    for difficulty, count in distribution.items():

        res = sb.table("questions_bank") \
            .select("*") \
            .eq("difficulty_level", difficulty) \
            .eq("grade", int(grade)) \
            .ilike("language", f"%{language}%") \
            .not_.in_("question_id", asked_ids) \
            .execute()

        qs = res.data or []

        # 🔀 randomize (ORDER BY random equivalent)
        random.shuffle(qs)

        # take only required count (safe)
        selected.extend(qs[:min(count, len(qs))])

    if not selected:
        raise HTTPException(404, "No questions available")

    # save history
    for q in selected:
        sb.table("question_history").insert({
            "student_id": student_id,
            "question_id": q["question_id"],
            "created_at": datetime.utcnow().isoformat()
        }).execute()

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

    sync_teacher_student_analysis(
        payload.student_id,
        payload.teacher_id,
        new_score
    )

    distribution = get_distribution(new_score)

    questions = select_questions(
        payload.student_id,
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
