import os
import json
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from app.config import settings

class HashEmbeddings(Embeddings):
    """
    Lightweight, fast fallback embedding model for local zero-dependency testing.
    Produces deterministic normalized float vectors based on character n-grams.
    """
    def __init__(self, dimension: int = 384):
        self.dimension = dimension

    def _embed_text(self, text: str) -> List[float]:
        vec = np.zeros(self.dimension, dtype=np.float32)
        words = text.lower().split()
        for word in words:
            for char in word:
                idx = ord(char) % self.dimension
                vec[idx] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self._embed_text(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self._embed_text(text)

def get_embeddings_model() -> Embeddings:
    """Returns the appropriate embeddings model based on configuration."""
    provider = settings.LLM_PROVIDER
    if provider == "openai" and settings.OPENAI_API_KEY:
        try:
            from langchain_openai import OpenAIEmbeddings
            return OpenAIEmbeddings(openai_api_key=settings.OPENAI_API_KEY)
        except Exception:
            pass
    elif provider == "google" and settings.GOOGLE_API_KEY:
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            return GoogleGenerativeAIEmbeddings(google_api_key=settings.GOOGLE_API_KEY, model="models/embedding-001")
        except Exception:
            pass
    
    # Try HuggingFace sentence-transformers if available
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    except Exception:
        # Fast fallback
        return HashEmbeddings()

class VectorStoreManager:
    def __init__(self):
        self.embeddings = get_embeddings_model()
        self.registry_file = settings.VECTORSTORE_DIR / "documents.json"
        self.chunks_file = settings.VECTORSTORE_DIR / "chunks.json"
        self.doc_registry: Dict[str, Dict[str, Any]] = {}
        self.chunks: List[Dict[str, Any]] = []  # list of chunk dicts {doc_id, content, metadata, vector}
        self._load_storage()

    def _load_storage(self):
        settings.ensure_directories()
        if self.registry_file.exists():
            try:
                with open(self.registry_file, "r", encoding="utf-8") as f:
                    self.doc_registry = json.load(f)
            except Exception:
                self.doc_registry = {}

        if self.chunks_file.exists():
            try:
                with open(self.chunks_file, "r", encoding="utf-8") as f:
                    self.chunks = json.load(f)
            except Exception:
                self.chunks = []

    def _save_storage(self):
        settings.ensure_directories()
        with open(self.registry_file, "w", encoding="utf-8") as f:
            json.dump(self.doc_registry, f, indent=2)
        with open(self.chunks_file, "w", encoding="utf-8") as f:
            json.dump(self.chunks, f, indent=2)

    def add_document(self, doc_id: str, filename: str, documents: List[Document], page_count: int, file_size: int, upload_time: str):
        if not documents:
            return

        texts = [doc.page_content for doc in documents]
        vectors = self.embeddings.embed_documents(texts)

        for doc, vec in zip(documents, vectors):
            chunk_data = {
                "doc_id": doc_id,
                "content": doc.page_content,
                "metadata": doc.metadata,
                "vector": vec
            }
            self.chunks.append(chunk_data)

        self.doc_registry[doc_id] = {
            "id": doc_id,
            "filename": filename,
            "upload_time": upload_time,
            "chunk_count": len(documents),
            "page_count": page_count,
            "file_size_bytes": file_size
        }
        self._save_storage()

    def similarity_search(self, query: str, top_k: int = settings.TOP_K_RETRIEVAL, doc_id_filter: Optional[str] = None) -> List[Tuple[Document, float]]:
        if not self.chunks:
            return []

        query_vec = np.array(self.embeddings.embed_query(query), dtype=np.float32)

        candidate_chunks = self.chunks
        if doc_id_filter:
            candidate_chunks = [c for c in self.chunks if c["doc_id"] == doc_id_filter]

        if not candidate_chunks:
            return []

        results = []
        for c in candidate_chunks:
            c_vec = np.array(c["vector"], dtype=np.float32)
            # cosine similarity
            norm_q = np.linalg.norm(query_vec)
            norm_c = np.linalg.norm(c_vec)
            if norm_q > 0 and norm_c > 0:
                sim = float(np.dot(query_vec, c_vec) / (norm_q * norm_c))
            else:
                sim = 0.0
            
            doc = Document(page_content=c["content"], metadata=c["metadata"])
            results.append((doc, sim))

        # Sort by similarity score descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    def delete_document(self, doc_id: str) -> bool:
        if doc_id in self.doc_registry:
            del self.doc_registry[doc_id]
            self.chunks = [c for c in self.chunks if c["doc_id"] != doc_id]
            self._save_storage()
            return True
        return False

    def list_documents(self) -> List[Dict[str, Any]]:
        return list(self.doc_registry.values())

    def get_total_chunks(self) -> int:
        return len(self.chunks)

vector_store_manager = VectorStoreManager()
