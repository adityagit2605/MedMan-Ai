"""
Google Gemini LLM client with retry logic and JSON validation.

Uses the free Gemini API (gemini-1.5-flash):
  - 15 requests/minute
  - 1 million tokens/day
  - No credit card required

Get your free API key: https://aistudio.google.com/app/apikey
"""

import json
import time
import logging
import google.generativeai as genai
from typing import Optional

logger = logging.getLogger(__name__)


class GeminiClient:
    """Wrapper around Google Gemini API with retry and JSON parsing."""

    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        self.model_name = model_name
        logger.info(f"Gemini client initialized with model: {model_name}")

    def generate_json(self, prompt: str, max_retries: int = 1,
                      timeout: float = 15.0) -> Optional[dict]:
        """
        Send prompt to Gemini and parse the response as JSON.

        Retry strategy (from LLD §2.5):
          - One retry with 2s backoff on failure
          - On parse failure, treat as LLM failure (not a crash)
          - Returns None on failure (caller sets llm_status=FAILED)

        Args:
            prompt: The formatted prompt string
            max_retries: Number of retries on failure (default: 1)
            timeout: Request timeout in seconds

        Returns:
            Parsed JSON dict on success, None on failure
        """
        last_error = None

        for attempt in range(1 + max_retries):
            try:
                if attempt > 0:
                    backoff = 2 * attempt  # 2s, 4s, ...
                    logger.info(f"Retry attempt {attempt} after {backoff}s backoff")
                    time.sleep(backoff)

                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.3,      # low temp for consistent structured output
                        max_output_tokens=1024,
                    ),
                    request_options={"timeout": timeout}
                )

                # Extract text from response
                text = response.text.strip()

                # Strip markdown code fences if the model wraps output
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()

                # Parse JSON
                result = json.loads(text)
                logger.info(f"LLM response parsed successfully on attempt {attempt + 1}")
                return result

            except json.JSONDecodeError as e:
                last_error = f"JSON parse error: {e}"
                logger.warning(f"Attempt {attempt + 1}: {last_error}. Raw text: {text[:200]}")

            except Exception as e:
                last_error = f"LLM API error: {type(e).__name__}: {e}"
                logger.warning(f"Attempt {attempt + 1}: {last_error}")

        logger.error(f"LLM call failed after {1 + max_retries} attempts. Last error: {last_error}")
        return None
