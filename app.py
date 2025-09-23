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
import json
import csv
import xml.etree.ElementTree as ET

# Import aimakerspace components for RAG functionality
import sys
from pathlib import Path
# Add the project root directory to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from aimakerspace.openai_utils.embedding import EmbeddingModel
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.text_utils import PDFLoader, CharacterTextSplitter, TextFileLoader

# Add Together AI import
try:
    from together import Together
    TOGETHER_AVAILABLE = True
except ImportError:
    TOGETHER_AVAILABLE = False

# Custom loaders for different file types
class CSVLoader:
    """Extract text from CSV files by converting to structured text."""
    
    def __init__(self, path: str):
        self.path = Path(path)
        self.documents: List[str] = []
    
    def load_file(self) -> None:
        """Load a single CSV file and convert to text format."""
        with open(self.path, 'r', encoding='utf-8') as file:
            # Try to detect delimiter
            sample = file.read(1024)
            file.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            reader = csv.DictReader(file, delimiter=delimiter)
            
            # Convert CSV to structured text
            rows = []
            for i, row in enumerate(reader):
                row_text = f"Row {i+1}:\n"
                for key, value in row.items():
                    row_text += f"  {key}: {value}\n"
                rows.append(row_text)
            
            self.documents = ["\n".join(rows)]


class JSONLoader:
    """Extract text from JSON files by flattening structure."""
    
    def __init__(self, path: str):
        self.path = Path(path)
        self.documents: List[str] = []
    
    def load_file(self) -> None:
        """Load a single JSON file and convert to text format."""
        with open(self.path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            
        # Convert JSON to readable text
        text_content = self._json_to_text(data)
        self.documents = [text_content]
    
    def _json_to_text(self, obj, prefix="") -> str:
        """Recursively convert JSON object to readable text."""
        result = []
        
        if isinstance(obj, dict):
            for key, value in obj.items():
                new_prefix = f"{prefix}.{key}" if prefix else key
                if isinstance(value, (dict, list)):
                    result.append(f"{new_prefix}:")
                    result.append(self._json_to_text(value, new_prefix))
                else:
                    result.append(f"{new_prefix}: {value}")
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                new_prefix = f"{prefix}[{i}]" if prefix else f"Item {i+1}"
                if isinstance(item, (dict, list)):
                    result.append(f"{new_prefix}:")
                    result.append(self._json_to_text(item, new_prefix))
                else:
                    result.append(f"{new_prefix}: {item}")
        else:
            return str(obj)
        
        return "\n".join(result)


class XMLLoader:
    """Extract text from XML files by parsing structure."""
    
    def __init__(self, path: str):
        self.path = Path(path)
        self.documents: List[str] = []
    
    def load_file(self) -> None:
        """Load a single XML file and convert to text format."""
        tree = ET.parse(self.path)
        root = tree.getroot()
        
        # Convert XML to readable text
        text_content = self._xml_to_text(root)
        self.documents = [text_content]
    
    def _xml_to_text(self, element, prefix="") -> str:
        """Recursively convert XML element to readable text."""
        result = []
        
        # Add element name and attributes
        element_info = element.tag
        if element.attrib:
            attrs = ", ".join([f"{k}={v}" for k, v in element.attrib.items()])
            element_info += f" ({attrs})"
        
        current_prefix = f"{prefix}.{element_info}" if prefix else element_info
        
        # Add element text content if present
        if element.text and element.text.strip():
            result.append(f"{current_prefix}: {element.text.strip()}")
        
        # Process child elements
        for child in element:
            child_text = self._xml_to_text(child, current_prefix)
            if child_text:
                result.append(child_text)
        
        return "\n".join(result)


def get_file_loader(file_path: str, file_extension: str):
    """Factory function to get appropriate loader based on file extension."""
    loaders = {
        '.pdf': PDFLoader,
        '.txt': TextFileLoader,
        '.csv': CSVLoader,
        '.json': JSONLoader,
        '.xml': XMLLoader
    }
    
    loader_class = loaders.get(file_extension.lower())
    if not loader_class:
        raise ValueError(f"Unsupported file type: {file_extension}")
    
    return loader_class(file_path)


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
file_contents: Dict[str, Dict[str, str]] = {}  # Store full file contents per API key

# Define the data model for individual messages
class ChatMessage(BaseModel):
    role: str      # "system", "user", or "assistant"
    content: str   # The message content

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    messages: List[ChatMessage]  # Full conversation history
    developer_message: str       # System message for context
    user_message: str           # Current user message (for backward compatibility)
    model: Optional[str] = "gpt-4o-mini"  # Optional model selection with default
    api_key: str                # OpenAI API key for authentication
    use_rag: bool = False       # Whether to use RAG (context from uploaded PDFs)
    # Add engineering analysis specific fields
    provider: Optional[str] = "openai"  # "openai" or "together"    use_engineering_mode: bool = False  # Enable engineering-specific features

# Define data model for RAG responses
class RAGResponse(BaseModel):
    answer: str
    context_used: List[str]
    confidence: float

# Define data model for file analysis requests
class FileAnalysisRequest(BaseModel):
    api_key: str
    filename_or_index: str  # Can be filename like "doc.pdf" or index like "1"
    provider: str = "openai"
    model: Optional[str] = "gpt-4o-mini"

# Engineering model mappings for Together AI
ENGINEERING_MODELS = {
    "together": {
        "general": "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        "advanced": "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", 
        "research": "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
        "code": "meta-llama/CodeLlama-70b-Instruct-hf",  # Specialized for code analysis
    },
    "openai": {
        "general": "gpt-4o-mini",
        "advanced": "gpt-4o",
        "research": "gpt-4-turbo",
    }
}

def get_engineering_client(provider: str, api_key: str):
    """Get the appropriate client based on provider"""
    if provider == "together":
        if not TOGETHER_AVAILABLE:
            raise HTTPException(status_code=400, detail="Together AI not available. Install with: pip install together")
        return Together(api_key=api_key)
    else:
        return OpenAI(api_key=api_key)

def get_engineering_model(provider: str, complexity: str = "general") -> str:
    """Get appropriate model for engineering analysis based on complexity"""
    models = ENGINEERING_MODELS.get(provider, ENGINEERING_MODELS["openai"])
    return models.get(complexity, models["general"])


@app.post("/api/upload-files")
async def upload_files(
    files: List[UploadFile] = File(...),
    api_key: str = Form(...)
):
    """
    Upload one or more documents (PDF, TXT, CSV, JSON, XML) and process them for RAG.
    
    This endpoint:
    1. Saves uploaded files temporarily
    2. Extracts text using appropriate loader based on file type
    3. Splits text into chunks using CharacterTextSplitter
    4. Creates embeddings using EmbeddingModel
    5. Stores vectors in VectorDatabase for similarity search
    
    Supported file types:
    - PDF: Uses PyPDF2 for text extraction
    - TXT: Plain text files
    - CSV: Converts tabular data to structured text
    - JSON: Flattens structure to readable text
    - XML: Parses elements and attributes to text
    """
    try:
        # Validate API key by testing OpenAI connection
        try:
            client = OpenAI(api_key=api_key)
            # Test the API key with a minimal request
            client.models.list()
        except Exception as e:
            raise HTTPException(status_code=401, detail="Invalid OpenAI API key")
        
        # Initialize or get existing vector database for this API key
        if api_key not in vector_databases:
            # Create new embedding model and vector database
            # EmbeddingModel handles OpenAI text-embedding-3-small API calls
            embedding_model = EmbeddingModel(api_key=api_key)
            vector_databases[api_key] = VectorDatabase(embedding_model=embedding_model)
            uploaded_files[api_key] = []
            file_contents[api_key] = {}
        
        vector_db = vector_databases[api_key]
        processed_files = []
        
        for file in files:
            # Get file extension to determine appropriate loader
            file_extension = Path(file.filename).suffix.lower()
            
            # Validate file type - support multiple formats
            supported_extensions = ['.pdf', '.txt', '.csv', '.json', '.xml']
            if file_extension not in supported_extensions:
                continue  # Skip unsupported files
                
            # Save uploaded file temporarily with correct extension
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_file_path = temp_file.name
            
            try:
                # Use appropriate loader based on file type
                file_loader = get_file_loader(temp_file_path, file_extension)
                file_loader.load_file()
                
                if not file_loader.documents:
                    continue
                
                # Store the full document content for analysis
                full_text = "\n".join(file_loader.documents)
                file_contents[api_key][file.filename] = full_text
                
                # Split the extracted text into chunks
                # CharacterTextSplitter creates overlapping chunks for better context
                # chunk_size=500: Each chunk is ~1000 characters
                # chunk_overlap=100: Adjacent chunks share 200 characters for continuity
                text_splitter = CharacterTextSplitter(
                    chunk_size=500,
                    chunk_overlap=100
                )
                
                chunks = []
                for doc in file_loader.documents:
                    doc_chunks = text_splitter.split(doc)
                    # Add filename and file type context to each chunk for better retrieval
                    file_type = file_extension.upper().replace('.', '')
                    for i, chunk in enumerate(doc_chunks):
                        chunk_with_metadata = f"[{file.filename} ({file_type}) - Chunk {i+1}]\n{chunk}"
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
        print(f"Error in upload_pdf: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/api/analyze-file")
async def analyze_file(request: FileAnalysisRequest):
    """
    Analyze a specific file and generate suggested questions and summary.
    
    This endpoint:
    1. Identifies the requested file by name or index
    2. Uses the full document content to generate analysis
    3. Creates 5 suggested questions about the content
    4. Provides a 2-paragraph summary/abstract
    """
    try:
        # Check if user has uploaded files
        if request.api_key not in file_contents or not file_contents[request.api_key]:
            raise HTTPException(
                status_code=400,
                detail="No files uploaded. Please upload PDFs first."
            )
        
        files_list = list(file_contents[request.api_key].keys())
        filename = None
        
        # Determine if input is filename or index
        if request.filename_or_index.isdigit():
            # It's an index
            index = int(request.filename_or_index) - 1  # Convert to 0-based index
            if 0 <= index < len(files_list):
                filename = files_list[index]
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file index. Available files: 1-{len(files_list)}"
                )
        else:
            # It's a filename
            if request.filename_or_index in file_contents[request.api_key]:
                filename = request.filename_or_index
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"File '{request.filename_or_index}' not found. Available files: {', '.join(files_list)}"
                )
        
        # Get the full content of the requested file
        content = file_contents[request.api_key][filename]
        
        # Truncate content if too long (keep first 4000 chars for analysis)
        if len(content) > 4000:
            analysis_content = content[:4000] + "..."
        else:
            analysis_content = content
        
        # Create analysis prompt
        analysis_prompt = f"""Analyze the following document content and provide:

1. SUMMARY: Provide a concise 2-paragraph summary/abstract that gives an overview of what this document contains and its main topics.

2. SUGGESTED QUESTIONS: Create 10 specific, insightful questions that someone could ask about this document. These should be questions that can be answered using the document's content. Make each question unique and cover different aspects of the document.

Document: {filename}
Content: {analysis_content}

Format your response as:

## SUMMARY

[First paragraph of summary]

[Second paragraph of summary]

## SUGGESTED QUESTIONS

1. [Question 1]
2. [Question 2]
3. [Question 3]
4. [Question 4]
5. [Question 5]
6. [Question 6]
7. [Question 7]
8. [Question 8]
9. [Question 9]
10. [Question 10]"""
        
        # Use OpenAI to analyze the content
        client = get_engineering_client(request.provider, request.api_key)
        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that analyzes documents and creates suggested questions and summaries."},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.7
        )
        
        analysis_result = response.choices[0].message.content
        
        return {
            "filename": filename,
            "analysis": analysis_result,
            "content_length": len(content)
        }
        
    except Exception as e:
        print(f"Error in analyze_file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing file: {str(e)}")

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
        
        # Construct RAG system prompt with context
        # This is the key to RAG - we provide relevant document context to the LLM
        context_text = "\n\n".join(relevant_chunks)
        
        rag_system_prompt = f"""You are a helpful assistant that answers questions based ONLY on the provided context from uploaded PDF documents.

CONTEXT FROM DOCUMENTS:
{context_text}

INSTRUCTIONS:
- Answer questions using ONLY the information provided in the context above
- If the context doesn't contain information to answer a question, respond with "I don't have enough information in the uploaded documents to answer that question."
- Be specific and cite the relevant parts of the context when possible
- Do not make up information that isn't in the context
- Maintain conversation context and refer to previous messages when relevant"""
        
        # Initialize OpenAI client with user's API key
        client = get_engineering_client(request.provider, request.api_key)
        
        # Build conversation messages with RAG context
        conversation_messages = []
        
        # Add the RAG system message
        conversation_messages.append({"role": "system", "content": rag_system_prompt})
        
        # Add conversation history (skip any existing system messages to avoid conflicts)
        for msg in request.messages:
            if msg.role != "system":  # Skip system messages from conversation history
                conversation_messages.append({"role": msg.role, "content": msg.content})
        
        # Create streaming response using full conversation with RAG context
        async def generate():
            # Create a streaming chat completion request with full conversation + RAG context
            stream = client.chat.completions.create(
                model=request.model,
                messages=conversation_messages,
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
        
        # Otherwise, use regular chat with full conversation history
        client = get_engineering_client(request.provider, request.api_key)
        
        # Build conversation messages for regular chat
        conversation_messages = []
        
        # Add the developer system message
        conversation_messages.append({"role": "system", "content": request.developer_message})
        
        # Add conversation history (skip any existing system messages to avoid conflicts)
        for msg in request.messages:
            if msg.role != "system":  # Skip system messages from conversation history
                conversation_messages.append({"role": msg.role, "content": msg.content})
        
        async def generate():
            # Create a streaming chat completion request with full conversation history
            stream = client.chat.completions.create(
                model=request.model,
                messages=conversation_messages,
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
    if api_key in file_contents:
        del file_contents[api_key]
    
    return {"message": "All files cleared successfully"}

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "features": ["regular_chat", "pdf_upload", "rag_chat", "file_analysis"]}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
