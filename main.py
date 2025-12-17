from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from typing import List, Optional
from dotenv import load_dotenv
from datetime import datetime
import os

# --------------------------------------------------
# Load environment variables (.env at root)
# --------------------------------------------------
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# --------------------------------------------------
# FastAPI app
# --------------------------------------------------
app = FastAPI()

# --------------------------------------------------
# CORS CONFIG (REQUIRED FOR VERCEL)
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://studysaathi.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Request Models
# --------------------------------------------------
class Answer(BaseModel):
    question_id: str
    difficulty: str  # "easy" | "medium" | "hard"
    correct: bool

class RequestPayload(BaseModel):
    student_id: str
    teacher_id: Optional[str] = None
    answers: List[Answer]
    grade: str
    language: str

# --------------------------------------------------
# Score Update Logic
# --------------------------------------------------
def update_score(current_score: int, answers: List[Answer]) -> int:
    score = current_score

    for a in answers:
        if a.correct:
            if a.difficulty == "hard":
                score += 5
            elif a.difficulty == "medium":
                score += 3
            else:
                score += 1
        else:
            if a.difficulty == "hard":
                score -= 1
            elif a.difficulty == "medium":
                score -= 3
            else:
                score -= 5

    return max(0, min(100, score))

# --------------------------------------------------
# Difficulty Distribution Logic
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
# Teacher ↔ Student Analysis
# --------------------------------------------------
def sync_teacher_student_analysis(
    student_id: str,
    teacher_id: Optional[str],
    score: int
):
    if not teacher_id:
        return

    if score < 40:
        sb.table("teacher_student_analysis").upsert({
            "student_id": student_id,
            "teacher_id": teacher_id,
            "current_level": score,
            "ai_focus_required": True,
            "ai_analysis": f"Student needs attention. Current score: {score}",
            "last_updated": datetime.utcnow().isoformat()
        }).execute()
    else:
        sb.table("teacher_student_analysis") \
            .delete() \
            .eq("student_id", student_id) \
            .eq("teacher_id", teacher_id) \
            .execute()

# --------------------------------------------------
# Question Selection (avoid last 15 questions)
# --------------------------------------------------
def select_questions(student_id, grade, language, distribution):
    recent = (
        sb.table("question_history")
        .select("question_id")
        .eq("student_id", student_id)
        .order("created_at", desc=True)
        .limit(15)
        .execute()
        .data
    )

    exclude_ids = [q["question_id"] for q in recent] or [
        "00000000-0000-0000-0000-000000000000"
    ]

    selected = []

    for difficulty, count in distribution.items():
        qs = (
            sb.table("questions_bank")
            .select("*")
            .eq("difficulty", difficulty)
            .eq("grade", grade)
            .eq("language", language)
            .not_("id", "in", exclude_ids)
            .limit(count)
            .execute()
            .data
        )
        selected.extend(qs)

    for q in selected:
        sb.table("question_history").insert({
            "student_id": student_id,
            "question_id": q["id"],
            "created_at": datetime.utcnow().isoformat()
        }).execute()

    return selected

# --------------------------------------------------
# MAIN AI ENDPOINT
# --------------------------------------------------
@app.post("/ai/next-set")
def ai_next_set(payload: RequestPayload):

    student = (
        sb.table("users")
        .select("difficulty_score")
        .eq("id", payload.student_id)
        .single()
        .execute()
        .data
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    current_score = student["difficulty_score"]

    new_score = update_score(current_score, payload.answers)

    sb.table("users").update({
        "difficulty_score": new_score
    }).eq("id", payload.student_id).execute()

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
# HEALTH CHECK (OPTIONAL BUT NICE)
# --------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok"}
