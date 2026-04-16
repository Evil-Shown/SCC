from fastapi import FastAPI, File, UploadFile, Form
from typing import List, Optional
import json
import re  
import fitz  # PyMuPDF
import os
import io
from PIL import Image
import pytesseract # Tesseract OCR
from dotenv import load_dotenv

import langchain_nvidia_ai_endpoints
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

app = FastAPI(title="SCC Exam Plan AI Microservice")

# Windows Tesseract Path 
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# ==========================================
# 1. AI MODEL SETUP - EXAM PLANNER
# ==========================================
llm_planner = langchain_nvidia_ai_endpoints.ChatNVIDIA(
    model="nvidia/nemotron-3-super-120b-a12b",
    api_key=os.getenv("NVIDIA_API_KEY"), 
    temperature=1,
    top_p=0.95,
    max_tokens=16384,
)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(min(len(doc), 15)): # first 15 pages
            page = doc[page_num]
            page_text = page.get_text().strip()
            
            if len(page_text) > 50:
                text += page_text + "\n"
            else:
                print(f"Page {page_num + 1} appears to be a scanned image. Running OCR...")
                pix = page.get_pixmap(dpi=150) 
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                ocr_text = pytesseract.image_to_string(img)
                text += ocr_text + "\n"
                
    except Exception as e:
        print(f"Error reading PDF: {e}")
    return text

# ------------------------------------------
# ROUTE 1: Generate Study Plan
# ------------------------------------------
@app.post("/api/generate-plan")
async def generate_study_plan(
    systemPrompt: str = Form(...), 
    planCategory: str = Form(...),
    dailyHours: int = Form(...),
    modulesData: str = Form(...),
    outlines: Optional[List[UploadFile]] = File(None)
):
    pdf_contents = {}
    if outlines:
        for file in outlines:
            file_bytes = await file.read()
            pdf_contents[file.filename] = extract_text_from_pdf(file_bytes)

    user_message = f"""
    [EXTRACTED PDF OUTLINES / SYLLABUS TEXT]
    {str(pdf_contents)[:5000]}
    
    Please generate the study plan based on the above PDF context and the provided rules.
    """
    messages = [SystemMessage(content=systemPrompt), HumanMessage(content=user_message)]
    
    # JsonOutputParser 
    chain = llm_planner | JsonOutputParser()

    try:
        result = await chain.ainvoke(messages) 
        return {"success": True, "data": result}
    except Exception as e:
        print("Plan Generation Error:", e)
        return {"success": False, "message": str(e)}

# ------------------------------------------
# ROUTE 2: Study Pilot Functions
# ------------------------------------------
@app.post("/api/study-pilot")
async def generate_study_pilot_materials(
    actionType: str = Form(...),
    chatPrompt: str = Form(""),
    outlines: Optional[List[UploadFile]] = File(None)
):
    pdf_text = ""
    if outlines:
        for file in outlines:
            file_bytes = await file.read()
            extracted = extract_text_from_pdf(file_bytes)
            pdf_text += extracted

    if not pdf_text.strip():
        return {"success": False, "message": "Uncleared PDF. Please upload a clear PDF"}

    system_rules = ""
    
    if actionType == "Summary":
        system_rules = (
            'You are an expert tutor. Create a highly detailed summary suitable for absolute beginners. '
            'Deeply explain all key concepts, formulas, and necessary parts found in the text(If have). '
            'Do NOT just list bullet point, write full, descriptive explanations for each point so someone reading it for the first time can learn it completely.'
            'Output ONLY valid JSON in this exact format:'
            '{"summaryTitle": "Main Title", "keyPoints": [{"title": "Concept Name", "description": "Very detailed deep explanation..."}], "detailedSummary": "Overall conclusion"}'
        )
    elif actionType == "Flashcards":
        system_rules = (
            'Create highly effective flashcards based on the text. '
             'every key concept, formula, and necessary part should be included in a flashcard.'
            'Output ONLY a valid JSON array of objects: [{"front": "Question or Term", "back": "Detailed Answer"}]'
        )
    elif actionType == "Quiz" or "quiz" in chatPrompt.lower() or "mcq" in chatPrompt.lower():
        system_rules = (
            f'User request: "{chatPrompt}". You are an exam creator. Create a multiple choice quiz based on the provided text. '
            'RULES: 1. If the user requested a specific number of questions in their prompt, generate exactly that many (Maximum 50). '
            'If no number is specified, generate between 5 and 20 questions depending on the length of the text. '
            '2. EVERY question MUST have EXACTLY 4 options. '
            '3. Multiple correct answers are allowed (e.g., ["Option A", "Option C"]). '
            '4. You MUST provide a brief explanation for EVERY option (why it is correct or incorrect). '
            '5. Each question Corrected answere/ers  show as"Correct answere is/are (e.g., ["Option A", "Option C"]) with brief explanation '
            'Output ONLY a valid JSON array matching this exact format: '
            '[{"question": "Question text?", "options": {"A": "First option", "B": "Second option", "C": "Third option", "D": "Fourth option"}, "correctAnswers": ["A", "C"], "explanations": {"A": "Reason A", "B": "Reason B", "C": "Reason C", "D": "Reason D"}}]'
        )
    elif actionType == "Mindmap":
         system_rules = """
You are an expert knowledge architect.

Generate a highly structured, hierarchical mind map for the topic: "{chatPrompt}".

Rules:
1. Identify a single central root node.
2. Create primary branches (level 1), then expand into level 2 and level 3 where relevant.
3. Maintain strict hierarchy (parent → child relationships).
4. Avoid duplication and ensure full topic coverage.
5. Use concise labels (max 3–5 words per node).
6. Include examples/use-cases as leaf nodes where applicable.
7. Keep balanced depth across branches.
8. Ensure logical grouping and clear semantic relationships.

Output STRICTLY in this JSON format (no extra text):

{
  "nodes": [
    {"id": "1", "data": {"label": "Main Topic"}},
    {"id": "2", "data": {"label": "Branch 1"}},
    {"id": "3", "data": {"label": "Sub-branch 1.1"}}
  ],
  "edges": [
    {"id": "e1-2", "source": "1", "target": "2"},
    {"id": "e2-3", "source": "2", "target": "3"}
  ]
}

Constraints:
- Root node must always have id "1".
- IDs must be unique strings.
- Edges must correctly represent hierarchy (parent → child).
- Do NOT output explanations, only JSON.

Create a knowledge map. Output ONLY valid JSON: {"nodes": [{"id": "1", "data": {"label": "Topic"}}], "edges": [{"id": "e1", "source": "1", "target": "2"}]}
""".replace("{chatPrompt}", chatPrompt)

    else:
        system_rules = f'Act as Study Pilot. User asked: "{chatPrompt}". Output ONLY valid JSON.'

    user_message = f"""
    [SOURCE DOCUMENT TEXT]
    {pdf_text[:8000]}  

    CRITICAL INSTRUCTION:
    1. Output strictly valid JSON.
    2. Do NOT include greetings, explanations, or any text outside of the JSON object/array.
    3. Keys MUST be enclosed in double quotes. Do NOT leave trailing commas.
    """

    messages = [
        SystemMessage(content=system_rules), 
        HumanMessage(content=user_message)
    ]

    try:
        # JsonOutputParser 
        parser = JsonOutputParser()
        chain = llm_planner | parser
        
        parsed_data = await chain.ainvoke(messages)

        # --- AUTO-CORRECT AI NESTING ---
        if actionType in ["Flashcards", "Quiz"] or "quiz" in chatPrompt.lower() or "mcq" in chatPrompt.lower():
            if isinstance(parsed_data, dict):
                for val in parsed_data.values():
                    if isinstance(val, list):
                        parsed_data = val
                        break

        return {"success": True, "data": parsed_data}
        
    except Exception as e:
        print(f"Pilot Generation Error ({actionType}):", e)
        return {"success": False, "message": "Failed to parse AI response. Please try again."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)