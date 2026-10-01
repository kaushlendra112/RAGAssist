from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class DocumentInfo(BaseModel):
    id: str
    filename: str
    upload_time: str
    chunk_count: int
    page_count: int
    file_size_bytes: int

class UploadResponse(BaseModel):
    message: str
    document: DocumentInfo

class SourceCitation(BaseModel):
    doc_id: str
    filename: str
    page_number: int
    content: str
    score: Optional[float] = None

class ChatRequest(BaseModel):
    query: str = Field(..., description="User question or prompt")
    doc_id: Optional[str] = Field(None, description="Optional doc_id filter; if none, searches all docs")
    top_k: Optional[int] = Field(None, description="Number of context chunks to retrieve")

class ChatResponse(BaseModel):
    query: str
    answer: str
    sources: List[SourceCitation]
    llm_provider: str

class DocumentListResponse(BaseModel):
    documents: List[DocumentInfo]
    total_chunks: int

class DeleteResponse(BaseModel):
    message: str
    doc_id: str
