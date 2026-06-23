import json
import re
import google.generativeai as genai
from app.config import settings

NOTES_PROMPT = """You are an educational assistant. Convert the following lecture transcript into structured notes.

Return ONLY valid JSON with no markdown, no code fences, no explanations. Output nothing except the JSON object.

Required format:
{{
  "overview": "A 2-3 sentence summary of the lecture",
  "key_concepts": ["concept 1", "concept 2", "concept 3"],
  "definitions": ["Term: its definition", "Term: its definition"],
  "important_points": ["point 1", "point 2", "point 3"],
  "exam_notes": ["exam tip 1", "exam tip 2", "exam tip 3"]
}}

All array values must be plain strings.

Transcript:
{transcript}"""

FLASHCARDS_PROMPT = """You are an educational assistant. Generate exactly 10 flashcards from the following lecture transcript.

Return ONLY a valid JSON array with no markdown, no code fences, no explanations. Output nothing except the JSON array.

Required format:
[
  {{"question": "...", "answer": "..."}},
  {{"question": "...", "answer": "..."}}
]

Transcript:
{transcript}"""

QUIZ_PROMPT = """You are an educational assistant. Generate exactly 10 multiple-choice questions from the following lecture transcript.

Return ONLY a valid JSON array with no markdown, no code fences, no explanations. Output nothing except the JSON array.

Required format:
[
  {{
    "question": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A"
  }}
]

correct_answer must be exactly one of: "A", "B", "C", or "D".

Transcript:
{transcript}"""


def _get_model():
    print("GEMINI KEY:", settings.gemini_api_key[:10])
    print("MODEL:", settings.gemini_model)

    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(settings.gemini_model)


def _clean_json(raw: str) -> str:
    raw = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
    raw = re.sub(r"\s*```$", "", raw.strip())
    return raw.strip()


def generate_notes(transcript: str) -> dict:
    model = _get_model()
    prompt = NOTES_PROMPT.format(transcript=transcript)
    response = model.generate_content(prompt)
    raw = _clean_json(response.text)
    data = json.loads(raw)
    for field in ("key_concepts", "definitions", "important_points", "exam_notes"):
        if field not in data:
            data[field] = []
    if "overview" not in data:
        data["overview"] = ""
    return data


def generate_flashcards(transcript: str) -> list:
    model = _get_model()
    prompt = FLASHCARDS_PROMPT.format(transcript=transcript)
    response = model.generate_content(prompt)
    raw = _clean_json(response.text)
    items = json.loads(raw)
    return [{"question": str(fc["question"]), "answer": str(fc["answer"])} for fc in items]


def generate_quiz(transcript: str) -> list:
    model = _get_model()
    prompt = QUIZ_PROMPT.format(transcript=transcript)
    response = model.generate_content(prompt)
    raw = _clean_json(response.text)
    items = json.loads(raw)

    cleaned = []
    for q in items:
        raw_answer = str(q.get("correct_answer", "A")).strip().upper()
        correct = raw_answer[0] if raw_answer and raw_answer[0] in "ABCD" else "A"
        cleaned.append({
            "question": str(q["question"]),
            "option_a": str(q["option_a"]),
            "option_b": str(q["option_b"]),
            "option_c": str(q["option_c"]),
            "option_d": str(q["option_d"]),
            "correct_answer": correct,
        })
    return cleaned
