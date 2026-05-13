from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List
import random
import re

try:
    from better_profanity import profanity
    profanity.load_censor_words()
except Exception:
    profanity = None

app = FastAPI(title="CuziCam AI Service")


class ModerationRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class IcebreakerRequest(BaseModel):
    interests_a: List[str]
    interests_b: List[str]


STATIC_ICEBREAKERS = [
    "What is the best thing that happened on campus this week?",
    "What class has surprised you the most?",
    "What is your current favorite study spot?",
    "What is one app you could not survive college without?",
    "What is a small campus tradition you like?",
    "What is your go-to late night snack?",
    "What is the most useful thing you learned this semester?",
    "What is a song you have had on repeat lately?",
    "What is one club you would recommend joining?",
    "What is your ideal weekend plan?",
    "What is a movie you can rewatch anytime?",
    "What is the most underrated place near campus?",
    "What is one skill you want to learn this year?",
    "What is a harmless hot take you stand by?",
    "What is your favorite way to reset after exams?",
    "What is the best advice you got as a student?",
    "What is a project you want to build someday?",
    "What is one thing you wish freshmen knew?",
    "What is your favorite campus memory so far?",
    "What is a topic you could talk about for hours?",
]

TOXIC_PATTERNS = [
    re.compile(r"\b(kill yourself|kys|go die)\b", re.IGNORECASE),
    re.compile(r"\b(slur|hate you|worthless)\b", re.IGNORECASE),
]


@app.post("/moderate")
async def moderate(req: ModerationRequest):
    message = req.message
    matched_pattern = any(pattern.search(message) for pattern in TOXIC_PATTERNS)
    profanity_hit = bool(profanity and profanity.contains_profanity(message))
    is_toxic = matched_pattern or profanity_hit
    confidence = 0.92 if matched_pattern else 0.85 if profanity_hit else 0.05
    return {"is_toxic": is_toxic, "confidence": confidence}


@app.post("/icebreaker")
async def generate_icebreaker(req: IcebreakerRequest):
    normalized_a = {interest.strip() for interest in req.interests_a if interest.strip()}
    normalized_b = {interest.strip() for interest in req.interests_b if interest.strip()}
    shared = sorted(normalized_a.intersection(normalized_b))

    if shared:
        interest = shared[0]
        return {"icebreaker": f"You both like {interest}. What got you into it?"}

    return {"icebreaker": random.choice(STATIC_ICEBREAKERS)}


@app.get("/health")
async def health_check():
    return {"status": "ok"}
