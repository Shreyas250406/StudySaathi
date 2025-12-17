from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from typing import List, Optional
from dotenv import load_dotenv
from datetime import datetime
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

# --------------------------------------------------
# CORS (FINAL – no more issues)
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # TEMP / DEMO SAFE
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
    grade: str        # "6" to "10"
    language: str     # "english"

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
# TEACHER ANALYSIS (SAFE)
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
# QUESTION SELECTION (NO SQL CHANGE, NO CRASH)
# --------------------------------------------------
def select_questions(student_id, grade, language, distribution):
    selected = []

    for difficulty, count in distribution.items():

        # 1️⃣ Try grade + language (preferred)
        res = sb.table("questions_bank") \
            .select("*") \
            .eq("difficulty", difficulty) \
            .ilike("grade", f"%{grade}%") \
            .ilike("language", f"%{language}%") \
            .limit(count) \
            .execute()

        qs = res.data or []

        # 2️⃣ Fallback → language only
        if not qs:
            qs = sb.table("questions_bank") \
                .select("*") \
                .eq("difficulty", difficulty) \
                .ilike("language", f"%{language}%") \
                .limit(count) \
                .execute().data or []

        selected.extend(qs)

    # 3️⃣ Absolute safety
    if not selected:
        raise HTTPException(
            status_code=404,
            detail="No questions available yet"
        )

    # 4️⃣ Save history (safe)
    for q in selected:
        sb.table("question_history").insert({
            "student_id": student_id,
            "question_id": q["id"],
            "created_at": datetime.utcnow().isoformat()
        }).execute()

    return selected

# --------------------------------------------------
# MAIN ENDPOINT
# --------------------------------------------------
@app.post("/ai/next-set")
def ai_next_set(payload: RequestPayload):

    # Student lookup (SAFE)
    res = sb.table("users") \
        .select("difficulty_score") \
        .eq("id", payload.student_id) \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Student not found")

    current_score = res.data[0]["difficulty_score"]

    # Update score
    new_score = update_score(current_score, payload.answers)

    sb.table("users") \
        .update({"difficulty_score": new_score}) \
        .eq("id", payload.student_id) \
        .execute()

    # Teacher sync (optional)
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
