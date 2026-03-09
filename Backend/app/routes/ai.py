from fastapi import APIRouter, HTTPException
import os
import json
from google import genai
from pydantic import ValidationError

from app.models import LearningSystemCreate, SystemGenerateRequest

router = APIRouter(prefix="/systems", tags=["ai"])

@router.post("/generate", response_model=LearningSystemCreate)
async def generate_system(request: SystemGenerateRequest):
    """Generate a Learning System curriculum using Google Gemini."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "your_google_api_key_here":
        raise HTTPException(
            status_code=401, 
            detail="Google API key not configured or is using a placeholder. Please set a valid GOOGLE_API_KEY in the .env file."
        )

    try:
        client = genai.Client(api_key=api_key)
        
        system_prompt = """
You are an expert curriculum designer and productivity coach. 
The user will provide a topic, a duration in weeks, and optionally a detailed description/syllabus.
Your task is to generate a comprehensive, highly structured learning system (Protocol) for the user.
You must output ONLY valid JSON that strictly adheres to the schema provided.

The JSON schema must match this exact structure:
{
  "title": "A catchy, motivating title for the system",
  "description": "A brief overview of what this protocol achieves",
  "tags": ["Tag1", "Tag2"],
  "items": [
    {
      "phase": "String: Name of the phase. Mentions focuses (e.g., 'Phase 1: Foundation', 'Phase 2: Data Structures', 'Phase 3: Algorithms & Patterns')",
      "week_number": 1,
      "week_focus": "String: The main heading/topic for this week (e.g., 'Array and Strings')",
      "day_number": 1,
      "title": "String: Highly specific, actionable target for the day (e.g., 'LC:217 - Contains Duplicate')",
      "description": "String: Brief instructions or details (optional)",
      "time_block_start": "HH:MM (optional, e.g., '08:00', use 24h format)",
      "time_block_end": "HH:MM (optional, e.g., '09:00')",
      "resource_link": "URL (optional, MUST include if a specific resource is requested, e.g., 'https://leetcode.com/...')"
    }
  ]
}

Rules:
1. Provide a mix of practical exercises, theoretical learning, and reviews.
2. Group weeks logically into phases, with EXACTLY 3 weeks per phase. 
3. The `phase` name MUST explicitly mention focuses like foundation, data structure, algorithms, pattern, etc.
4. The `week_focus` MUST act as a heading for the week's topic (e.g., 'Arrays and Strings').
5. The `title` for each day MUST clearly and exactly mention the specific target being done (e.g., if it's leetcode, mention 'LC:217-Contains Duplicate', if it's a book, mention the exact chapter).
6. Typically provide 5 to 7 days of tasks per week. Focus on consistency.
7. Ensure `week_number` and `day_number` are integers.
8. Provide realistic, focused `time_block_start` / `time_block_end` if appropriate, otherwise omit.
9. IF a description/syllabus is provided, strictly plan the curriculum based on those exact details and structure.
10. IF the user mentions specific sources (like 'leetcode' or 'DSA code'), you MUST provide relevant links in `resource_link`.
11. CRITICAL: You MUST generate tasks for the FULL duration of weeks requested. If the user requests 12 weeks, you MUST output 12 weeks of data exactly.
"""

        user_prompt = f"Topic: {request.topic}\nDuration: {request.duration_weeks} weeks"
        if request.description:
            user_prompt += f"\nDetailed Description / Syllabus: {request.description}"

        full_prompt = f"{system_prompt}\n\nUser Request:\n{user_prompt}"
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt,
            config={'response_mime_type': 'application/json'}
        )
        
        content = response.text
        if not content:
            raise HTTPException(status_code=500, detail="No content returned from Gemini")

        data = json.loads(content)
        # Validate against the Pydantic schema
        generated_system = LearningSystemCreate(**data)
        return generated_system

    except ValidationError as e:
        print("Validation Error from generated JSON:", e)
        raise HTTPException(status_code=422, detail="Generated system did not match the required schema.")
    except Exception as e:
        print("Error calling Gemini API:", str(e))
        error_msg = str(e)
        if "401" in error_msg or "403" in error_msg:
            raise HTTPException(status_code=401, detail="Invalid API key or insufficient permissions for Google Gemini.")
        raise HTTPException(status_code=500, detail=f"Failed to generate system via AI: {error_msg}")
