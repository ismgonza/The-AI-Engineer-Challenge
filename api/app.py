# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import tempfile
import asyncio
from typing import Optional, List, Dict, Any
from pathlib import Path

# Import aimakerspace components for RAG functionality
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from aimakerspace.openai_utils.embedding import EmbeddingModel
from aimakerspace.openai_utils.chatmodel import ChatOpenAI
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter

# Initialize FastAPI application with a title
app = FastAPI(title="PDF RAG Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Global storage for vector databases (in production, you'd use persistent storage)
# Each API key gets its own vector database to keep user data separate
vector_databases: Dict[str, VectorDatabase] = {}
uploaded_files: Dict[str, List[str]] = {}  # Track uploaded files per API key

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication
    use_rag: bool = False  # Whether to use RAG (context from uploaded PDFs)

# Define data model for RAG responses
class RAGResponse(BaseModel):
    answer: str
    context_used: List[str]
    confidence: float

@app.post("/api/upload-pdf")
async def upload_pdf(
    files: List[UploadFile] = File(...),
    api_key: str = Form(...)
):
    """
    Upload one or more PDF files and process them for RAG.
    
    This endpoint:
    1. Saves uploaded PDF files temporarily
    2. Extracts text using PDFLoader from aimakerspace
    3. Splits text into chunks using CharacterTextSplitter
    4. Creates embeddings using EmbeddingModel
    5. Stores vectors in VectorDatabase for similarity search
    """
    try:
        # Validate API key by testing OpenAI connection
        try:
            client = OpenAI(api_key=api_key)
            # Test the API key with a minimal request
            client.models.list()
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid OpenAI API key")
        
        # Initialize or get existing vector database for this API key
        if api_key not in vector_databases:
            # Create new embedding model and vector database
            # EmbeddingModel handles OpenAI text-embedding-3-small API calls
            embedding_model = EmbeddingModel()
            vector_databases[api_key] = VectorDatabase(embedding_model=embedding_model)
            uploaded_files[api_key] = []
        
        vector_db = vector_databases[api_key]
        processed_files = []
        
        for file in files:
            # Validate file type
            if not file.filename.lower().endswith('.pdf'):
                continue
                
            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_file_path = temp_file.name
            
            try:
                # Use PDFLoader to extract text from PDF
                # PDFLoader uses PyPDF2 under the hood to read PDF content
                pdf_loader = PDFLoader(temp_file_path)
                pdf_loader.load_file()
                
                if not pdf_loader.documents:
                    continue
                
                # Split the extracted text into chunks
                # CharacterTextSplitter creates overlapping chunks for better context
                # chunk_size=1000: Each chunk is ~1000 characters
                # chunk_overlap=200: Adjacent chunks share 200 characters for continuity
                text_splitter = CharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200
                )
                
                chunks = []
                for doc in pdf_loader.documents:
                    doc_chunks = text_splitter.split(doc)
                    # Add filename context to each chunk for better retrieval
                    for i, chunk in enumerate(doc_chunks):
                        chunk_with_metadata = f"[{file.filename} - Chunk {i+1}]\n{chunk}"
                        chunks.append(chunk_with_metadata)
                
                # Build vector database asynchronously
                # This creates embeddings for all chunks and stores them
                await vector_db.abuild_from_list(chunks)
                
                processed_files.append(file.filename)
                uploaded_files[api_key].append(file.filename)
                
            finally:
                # Clean up temporary file
                os.unlink(temp_file_path)
        
        return {
            "message": f"Successfully processed {len(processed_files)} PDF files",
            "processed_files": processed_files,
            "total_files": len(uploaded_files[api_key])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/api/rag-chat")
async def rag_chat(request: ChatRequest):
    """
    Chat endpoint that uses RAG (Retrieval Augmented Generation).
    
    This endpoint:
    1. Takes a user question
    2. Searches the vector database for relevant context
    3. Constructs a prompt with the context
    4. Generates an answer using OpenAI's chat completion
    5. Returns the answer with confidence and context information
    """
    try:
        # Check if user has uploaded PDFs and vector database exists
        if request.api_key not in vector_databases:
            raise HTTPException(
                status_code=400, 
                detail="No PDFs uploaded. Please upload PDFs first using /api/upload-pdf"
            )
        
        vector_db = vector_databases[request.api_key]
        
        # If no vectors in database, return error
        if not vector_db.vectors:
            raise HTTPException(
                status_code=400,
                detail="No documents indexed. Please upload and process PDFs first."
            )
        
        # Search for relevant context using vector similarity
        # k=3 means we get the top 3 most similar text chunks
        # The search uses cosine similarity between question and document embeddings
        relevant_chunks = vector_db.search_by_text(
            request.user_message, 
            k=3,  # Number of most relevant chunks to retrieve
            return_as_text=True
        )
        
        if not relevant_chunks:
            # If no relevant context found, return "I don't know" response
            async def generate():
                yield "I don't have information about that topic in the uploaded documents. Please ask a question related to the content of your PDFs."
            
            return StreamingResponse(generate(), media_type="text/plain")
        
        # Construct RAG prompt with context
        # This is the key to RAG - we provide relevant document context to the LLM
        context_text = "\n\n".join(relevant_chunks)
        
        rag_prompt = f"""You are a helpful assistant that answers questions based ONLY on the provided context from uploaded PDF documents.

CONTEXT FROM DOCUMENTS:
{context_text}

INSTRUCTIONS:
- Answer the user's question using ONLY the information provided in the context above
- If the context doesn't contain information to answer the question, respond with "I don't have enough information in the uploaded documents to answer that question."
- Be specific and cite the relevant parts of the context when possible
- Do not make up information that isn't in the context

USER QUESTION: {request.user_message}

ANSWER:"""
        
        # Initialize OpenAI client with user's API key
        client = OpenAI(api_key=request.api_key)
        
        # Create streaming response using RAG prompt
        async def generate():
            # Create a streaming chat completion request with RAG context
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "system", "content": rag_prompt},
                ],
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced chat endpoint that can switch between regular chat and RAG
@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Enhanced chat endpoint that supports both regular chat and RAG.
    
    If use_rag=True and PDFs are uploaded, uses RAG functionality.
    Otherwise, uses regular chat completion.
    """
    try:
        # If RAG is requested and vector database exists, use RAG
        if request.use_rag and request.api_key in vector_databases:
            return await rag_chat(request)
        
        # Otherwise, use regular chat (original functionality)
        client = OpenAI(api_key=request.api_key)
        
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "system", "content": request.developer_message},
                    {"role": "user", "content": request.user_message}
                ],
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files")
async def get_uploaded_files(api_key: str):
    """
    Get list of uploaded files for a specific API key.
    
    This helps the frontend show users what PDFs they've uploaded.
    """
    if api_key not in uploaded_files:
        return {"files": []}
    
    return {"files": uploaded_files[api_key]}

@app.delete("/api/files")
async def clear_uploaded_files(api_key: str = Form(...)):
    """
    Clear all uploaded files and reset vector database for an API key.
    
    This allows users to start fresh with new PDFs.
    """
    if api_key in vector_databases:
        del vector_databases[api_key]
    if api_key in uploaded_files:
        del uploaded_files[api_key]
    
    return {"message": "All files cleared successfully"}

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "features": ["regular_chat", "pdf_upload", "rag_chat"]}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
