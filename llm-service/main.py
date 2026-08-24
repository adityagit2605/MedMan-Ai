"""
Healthcare LLM Microservice — FastAPI

Endpoints:
  POST /api/llm/pre-visit-summary   → symptom triage (urgency + chief complaint + questions)
  POST /api/llm/post-visit-summary  → patient-friendly clinical notes summary
  GET  /health                      → service health check

Uses Google Gemini free tier (gemini-1.5-flash).
Set GEMINI_API_KEY in .env or environment variables.
"""

import os
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

from llm_client import GeminiClient
from prompts import PRE_VISIT_PROMPT, POST_VISIT_PROMPT

# Load environment
load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

# ── Global LLM client ─────────────────────────────────────────────────────
llm_client: Optional[GeminiClient] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the Gemini client on startup."""
    global llm_client
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not set — LLM endpoints will return fallback responses")
    else:
        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        llm_client = GeminiClient(api_key=api_key, model_name=model_name)
        logger.info(f"Gemini client ready (model={model_name})")
    yield
    logger.info("LLM service shutting down")


app = FastAPI(
    title="Healthcare LLM Service",
    description="Pre-visit and post-visit AI summaries using Google Gemini",
    version="1.0.0",
    lifespan=lifespan,
)


# ── Request/Response models ───────────────────────────────────────────────

class SymptomsInput(BaseModel):
    symptoms: str = Field(..., min_length=5, description="Patient's self-reported symptoms")


class PreVisitResponse(BaseModel):
    urgency_level: str = Field(description="LOW, MEDIUM, or HIGH")
    chief_complaint: str = Field(description="Single-sentence summary of primary issue")
    suggested_questions: List[str] = Field(description="3 questions for the doctor to ask")
    llm_status: str = Field(description="SUCCESS or FAILED")


class ClinicalNotesInput(BaseModel):
    notes: str = Field(..., min_length=5, description="Doctor's clinical notes")


class PostVisitResponse(BaseModel):
    patient_summary: str = Field(description="Patient-friendly summary of the visit")
    llm_status: str = Field(description="SUCCESS or FAILED")


# ── Endpoints ─────────────────────────────────────────────────────────────

@app.post("/api/llm/pre-visit-summary", response_model=PreVisitResponse)
async def generate_pre_visit_summary(data: SymptomsInput):
    """
    Analyse patient symptoms and return urgency, chief complaint, and
    suggested questions for the doctor.

    If LLM is unavailable or fails, returns a fallback with llm_status=FAILED
    so the Java backend can show raw symptoms to the doctor.
    """
    if llm_client is None:
        logger.warning("LLM client not initialized — returning fallback")
        return PreVisitResponse(
            urgency_level="PENDING",
            chief_complaint="AI summary unavailable — review raw symptoms",
            suggested_questions=[],
            llm_status="FAILED",
        )

    prompt = PRE_VISIT_PROMPT.format(symptoms=data.symptoms)
    result = llm_client.generate_json(prompt)

    if result is None:
        return PreVisitResponse(
            urgency_level="PENDING",
            chief_complaint="AI summary unavailable — review raw symptoms",
            suggested_questions=[],
            llm_status="FAILED",
        )

    # Validate and normalize the response
    urgency = result.get("urgency_level", "MEDIUM").upper()
    if urgency not in ("LOW", "MEDIUM", "HIGH"):
        urgency = "MEDIUM"

    chief = result.get("chief_complaint", "See raw symptoms")
    questions = result.get("suggested_questions", [])
    if not isinstance(questions, list):
        questions = []

    return PreVisitResponse(
        urgency_level=urgency,
        chief_complaint=chief,
        suggested_questions=questions[:5],  # cap at 5
        llm_status="SUCCESS",
    )


@app.post("/api/llm/post-visit-summary", response_model=PostVisitResponse)
async def generate_post_visit_summary(data: ClinicalNotesInput):
    """
    Convert clinical notes into a patient-friendly summary.

    If LLM fails, returns llm_status=FAILED and the Java backend
    stores the raw clinical notes without a patient summary.
    """
    if llm_client is None:
        logger.warning("LLM client not initialized — returning fallback")
        return PostVisitResponse(
            patient_summary="AI summary unavailable — contact your doctor for details",
            llm_status="FAILED",
        )

    prompt = POST_VISIT_PROMPT.format(notes=data.notes)
    result = llm_client.generate_json(prompt)

    if result is None:
        return PostVisitResponse(
            patient_summary="AI summary unavailable — contact your doctor for details",
            llm_status="FAILED",
        )

    summary = result.get("patient_summary", "Summary generation failed")

    return PostVisitResponse(
        patient_summary=summary,
        llm_status="SUCCESS",
    )


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "llm_available": llm_client is not None,
        "model": os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
    }


# ── Run ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
