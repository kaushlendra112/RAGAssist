from typing import TypedDict, List, Dict, Any, Optional
from langchain_core.documents import Document
from langgraph.graph import StateGraph, END
from app.config import settings
from app.services.vector_store import vector_store_manager

class RAGState(TypedDict):
    query: str
    doc_id_filter: Optional[str]
    top_k: int
    retrieved_docs: List[Any]  # List of (Document, score)
    answer: str
    sources: List[Dict[str, Any]]
    provider_used: str

def retrieve_node(state: RAGState) -> Dict[str, Any]:
    """
    StateGraph Node: Retrieves context chunks from the vector store based on semantic query similarity.
    """
    query = state["query"]
    doc_id_filter = state.get("doc_id_filter")
    top_k = state.get("top_k") or settings.TOP_K_RETRIEVAL

    results = vector_store_manager.similarity_search(
        query=query,
        top_k=top_k,
        doc_id_filter=doc_id_filter
    )

    sources = []
    for doc, score in results:
        meta = doc.metadata
        sources.append({
            "doc_id": meta.get("doc_id", "unknown"),
            "filename": meta.get("filename", "document.pdf"),
            "page_number": meta.get("page_number", 1),
            "content": doc.page_content,
            "score": round(float(score), 4) if score is not None else None
        })

    return {
        "retrieved_docs": results,
        "sources": sources
    }

def generate_node(state: RAGState) -> Dict[str, Any]:
    """
    StateGraph Node: Generates a natural-language response using LLM or structured RAG synthesis.
    """
    query = state["query"]
    sources = state.get("sources", [])
    provider = settings.LLM_PROVIDER.lower()
    
    context_text = "\n\n".join(
        [f"[Doc: {s['filename']} | Page: {s['page_number']}]\n{s['content']}" for s in sources]
    )

    if not sources:
        answer = "I could not find any relevant information in the uploaded PDF documents to answer your query. Please upload a relevant document or refine your query."
        return {"answer": answer, "provider_used": "system"}

    answer = None
    provider_used = provider

    # Try live LLMs if keys are available
    if provider == "openai" and settings.OPENAI_API_KEY:
        try:
            from langchain_openai import ChatOpenAI
            from langchain_core.messages import SystemMessage, HumanMessage
            
            llm = ChatOpenAI(model_name="gpt-4o-mini", openai_api_key=settings.OPENAI_API_KEY, temperature=0.2)
            sys_msg = SystemMessage(content=(
                "You are an expert RAG assistant answering user questions based STRICTLY on the provided PDF context snippets. "
                "Always cite page numbers and source documents when referring to facts."
            ))
            user_msg = HumanMessage(content=f"Context:\n{context_text}\n\nUser Question: {query}")
            response = llm.invoke([sys_msg, user_msg])
            answer = response.content
        except Exception as e:
            provider_used = f"mock (OpenAI error fallback: {str(e)})"

    elif provider == "google" and settings.GOOGLE_API_KEY:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import SystemMessage, HumanMessage
            
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=settings.GOOGLE_API_KEY, temperature=0.2)
            sys_msg = SystemMessage(content=(
                "You are an expert RAG assistant answering user questions based STRICTLY on the provided PDF context snippets. "
                "Always cite page numbers and source documents when referring to facts."
            ))
            user_msg = HumanMessage(content=f"Context:\n{context_text}\n\nUser Question: {query}")
            response = llm.invoke([sys_msg, user_msg])
            answer = response.content
        except Exception as e:
            provider_used = f"mock (Google error fallback: {str(e)})"

    # Contextual synthesis generator fallback (if mock or API call failed)
    if not answer:
        provider_used = "RAG-Synthesizer (local)"
        bullets = []
        for idx, s in enumerate(sources, 1):
            bullets.append(f"• **Source {idx} ({s['filename']}, Page {s['page_number']})**: {s['content'][:300]}...")
        
        answer = (
            f"Based on the retrieved context from your document(s), here is what I found regarding **'{query}'**:\n\n"
            + "\n\n".join(bullets)
            + f"\n\n*Summary*: The document provides relevant passages on page(s) {', '.join(set(str(s['page_number']) for s in sources))}. "
            "You can review the full context in the Source Citations below."
        )

    return {
        "answer": answer,
        "provider_used": provider_used
    }

# Build LangGraph StateGraph
def build_rag_graph():
    workflow = StateGraph(RAGState)
    
    # Add nodes
    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("generate", generate_node)
    
    # Set workflow entry and edges
    workflow.set_entry_point("retrieve")
    workflow.add_edge("retrieve", "generate")
    workflow.add_edge("generate", END)
    
    return workflow.compile()

rag_executor = build_rag_graph()
