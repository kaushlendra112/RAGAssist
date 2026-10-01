import shutil
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.schemas.api import (
    UploadResponse, DocumentInfo, ChatRequest, ChatResponse,
    SourceCitation, DocumentListResponse, DeleteResponse
)
from app.services.pdf_loader import pdf_processor
from app.services.vector_store import vector_store_manager
from app.services.rag_graph import rag_executor, RAGState

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Modular RAG API powered by LangChain and LangGraph"
)

# Enable CORS for React frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "llm_provider": settings.LLM_PROVIDER,
        "total_documents": len(vector_store_manager.list_documents()),
        "total_chunks": vector_store_manager.get_total_chunks()
    }

@app.post("/api/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files (.pdf) are supported."
        )

    settings.ensure_directories()
    file_path = settings.UPLOADS_DIR / file.filename

    # Save uploaded file locally
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {str(e)}")

    file_size = file_path.stat().st_size
    upload_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Process and split PDF into chunk Documents
    try:
        doc_id, chunks, page_count = pdf_processor.process_pdf(file_path, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing PDF document: {str(e)}")

    # Add chunks to VectorStoreManager
    vector_store_manager.add_document(
        doc_id=doc_id,
        filename=file.filename,
        documents=chunks,
        page_count=page_count,
        file_size=file_size,
        upload_time=upload_time
    )

    doc_info = DocumentInfo(
        id=doc_id,
        filename=file.filename,
        upload_time=upload_time,
        chunk_count=len(chunks),
        page_count=page_count,
        file_size_bytes=file_size
    )

    return UploadResponse(
        message=f"Document '{file.filename}' processed successfully into {len(chunks)} chunks.",
        document=doc_info
    )

@app.post("/api/chat", response_model=ChatResponse)
async def chat_query(req: ChatRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    initial_state: RAGState = {
        "query": req.query,
        "doc_id_filter": req.doc_id,
        "top_k": req.top_k or settings.TOP_K_RETRIEVAL,
        "retrieved_docs": [],
        "answer": "",
        "sources": [],
        "provider_used": ""
    }

    # Execute LangGraph Workflow
    try:
        final_state = rag_executor.invoke(initial_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LangGraph execution error: {str(e)}")

    sources_citations = [
        SourceCitation(
            doc_id=s["doc_id"],
            filename=s["filename"],
            page_number=s["page_number"],
            content=s["content"],
            score=s.get("score")
        )
        for s in final_state.get("sources", [])
    ]

    return ChatResponse(
        query=req.query,
        answer=final_state.get("answer", "No answer generated."),
        sources=sources_citations,
        llm_provider=final_state.get("provider_used", "unknown")
    )

@app.get("/api/documents", response_model=DocumentListResponse)
async def get_documents():
    docs_data = vector_store_manager.list_documents()
    doc_infos = [DocumentInfo(**d) for d in docs_data]
    return DocumentListResponse(
        documents=doc_infos,
        total_chunks=vector_store_manager.get_total_chunks()
    )

@app.delete("/api/documents/{doc_id}", response_model=DeleteResponse)
async def delete_document(doc_id: str):
    success = vector_store_manager.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Document with ID '{doc_id}' not found.")
    
    return DeleteResponse(
        message=f"Document '{doc_id}' and all associated vector chunks removed.",
        doc_id=doc_id
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
