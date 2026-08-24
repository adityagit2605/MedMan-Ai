"""
LLM Prompt templates for Healthcare Appointment Manager.

Each prompt enforces strict JSON output so the caller can parse reliably.
On any parse failure the Java backend treats it as an LLM failure and
falls back to showing raw input to the doctor/patient.
"""

PRE_VISIT_PROMPT = """You are a medical triage assistant. Analyse the patient's self-reported symptoms below and return a JSON object with exactly these keys:

1. "urgency_level" — one of "LOW", "MEDIUM", or "HIGH"
2. "chief_complaint" — a single sentence summarizing the primary issue
3. "suggested_questions" — an array of exactly 3 questions the doctor should ask during the visit

Patient symptoms:
\"\"\"
{symptoms}
\"\"\"

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation, no code fences.
Example format:
{{"urgency_level": "MEDIUM", "chief_complaint": "Persistent headache with visual disturbance", "suggested_questions": ["How long have you experienced this?", "Any recent head trauma?", "Are you on any medication?"]}}
"""

POST_VISIT_PROMPT = """You are a medical communications specialist. Convert the doctor's clinical notes below into a patient-friendly summary.

Return a JSON object with exactly these keys:

1. "patient_summary" — a clear, jargon-free summary (3-5 sentences) that includes:
   - What was diagnosed
   - What medications were prescribed and how to take them
   - Any follow-up steps or warning signs to watch for

Clinical notes:
\"\"\"
{notes}
\"\"\"

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation, no code fences.
Example format:
{{"patient_summary": "You were diagnosed with... Your doctor prescribed... Please follow up in..."}}
"""
