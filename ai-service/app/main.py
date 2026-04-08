from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import random

app = FastAPI(title="CuziCam AI Service")

class ToxicityRequest(BaseModel):
    text: string

class IcebreakerRequest(BaseModel):
    interests_a: List[str]
    interests_b: List[str]

# Mock Toxicity Model (MVP)
# In production, use HuggingFace (e.g. unitary/toxic-bert) or OpenAI Moderation API
@app.post("/toxicity")
async def check_toxicity(req: ToxicityRequest):
    text = req.text.lower()
    toxic_words = ['hate', 'kill', 'stupid', 'ugly', 'die', 'bitch']
    
    score = 0.0
    for word in toxic_words:
        if word in text:
            score += 0.3
            
    # Cap score at 1.0
    score = min(score, 1.0)
    
    return {"score": score}

# Mock Icebreaker Generator (MVP)
# In production, use an LLM (e.g. OpenAI GPT-4o-mini or local Llama)
@app.post("/icebreaker")
async def generate_icebreaker(req: IcebreakerRequest):
    shared = set(req.interests_a).intersection(req.interests_b)
    
    if shared:
        interest = list(shared)[0]
        prompts = [
            f"Since you both like {interest}, what's your favorite thing about it? 💬",
            f"A hot take on {interest} — go! 🔥",
            f"If you could do one thing related to {interest} right now, what would it be? 🌟"
        ]
        return {"icebreaker": random.choice(prompts)}
    else:
        prompts = [
            "If you could drop everything and travel anywhere right now, where would it be? ✈️",
            "What's the most random fact you know? 🤔",
            "What's your most unpopular opinion? 🌶️",
            "If you had to teach a class on any subject, what would it be? 📚"
        ]
        return {"icebreaker": random.choice(prompts)}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
