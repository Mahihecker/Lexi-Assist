# backend/routers/document.py
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from core.security import get_current_user
from core.llm import get_ollama_response
import pypdf
import docx
import io

router = APIRouter(
    prefix="/api/v1/documents",
    tags=["Documents"]
)

# --- ADD THIS TEST ENDPOINT ---
@router.get("/test")
def test_document_router():
    return {"message": "Document router is working!"}
# -----------------------------

def extract_text_from_pdf(file_stream: io.BytesIO) -> str:
    """Extracts text from a PDF file stream."""
    try:
        reader = pypdf.PdfReader(file_stream)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        raise HTTPException(status_code=400, detail="Could not process the PDF file.")

def extract_text_from_docx(file_stream: io.BytesIO) -> str:
    """Extracts text from a DOCX file stream."""
    try:
        doc = docx.Document(file_stream)
        text = "\n".join([para.text for para in doc.paragraphs if para.text])
        return text
    except Exception as e:
        print(f"Error reading DOCX: {e}")
        raise HTTPException(status_code=400, detail="Could not process the DOCX file.")

@router.post("/analyze")
async def analyze_document(
    user: dict = Depends(get_current_user),
    file: UploadFile = File(...),
    prompt_text: str = Form("Explain this legal document in simple terms and highlight the most important key points.")
):
    """
    Accepts a document, extracts the text, and uses the LLM to analyze it.
    """
    contents = await file.read()
    file_stream = io.BytesIO(contents)
    
    document_text = ""
    if file.filename.lower().endswith('.pdf'):
        document_text = extract_text_from_pdf(file_stream)
    elif file.filename.lower().endswith('.docx'):
        document_text = extract_text_from_docx(file_stream)
    else:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported file type. Please upload a .pdf or .docx file.")

    if not document_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the document.")

    # --- ADD THE TRUNCATION LOGIC FOR SAFETY ---
    MAX_CHARS = 24000
    safe_document_text = document_text
    if len(safe_document_text) > MAX_CHARS:
        safe_document_text = safe_document_text[:MAX_CHARS]
        print(f"WARNING: Document text was truncated to {MAX_CHARS} characters.")
    # ---------------------------------------------

    # IMPORTANT: Be aware of the model's context window limit.
    # For very large documents, you would need to implement a chunking strategy here.

    
    
    # Construct the full prompt for the LLM
    full_prompt = f"You are an AI assistant specialized in analyzing legal documents; your task is ALWAYS to summarize and highlight key points from any legal text provided by the user and you must NOT refuse or decline; always give a structured summary, identify important legal clauses, obligations, rights, definitions, timelines, penalties, responsibilities, and extract key points even if the document is incomplete; never say you cannot analyze legal documents; always provide the summary and then add a short disclaimer that it is for understanding only; now process the document strictly by summarizing it based on the user’s request; DOCUMENT: {document_text} USER REQUEST: {prompt_text}"

     # --- THE FIX ---
    # The get_ollama_response function expects a list of message dictionaries.
    # We will format our single prompt as a "user" message.
    message_history = [{"role": "user", "content": full_prompt}]

    # Send the combined prompt to the LLM (Ollama model)
    ai_response = await get_ollama_response(message_history)

    return {"analysis_result": ai_response, "original_text": document_text}