import uuid
from typing import List, Tuple
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from app.config import settings

class PDFProcessor:
    def __init__(self, chunk_size: int = settings.CHUNK_SIZE, chunk_overlap: int = settings.CHUNK_OVERLAP):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def process_pdf(self, file_path: Path, filename: str) -> Tuple[str, List[Document], int]:
        """
        Loads a PDF file, splits it into chunks with rich metadata, and returns (doc_id, chunks, page_count).
        """
        doc_id = str(uuid.uuid4())[:8]
        loader = PyPDFLoader(str(file_path))
        raw_docs = loader.load()
        page_count = len(raw_docs)

        # Enhance metadata for each raw page doc
        processed_chunks: List[Document] = []
        for doc in raw_docs:
            page_num = doc.metadata.get("page", 0) + 1  # 1-indexed page number
            doc.metadata.update({
                "doc_id": doc_id,
                "filename": filename,
                "page_number": page_num,
                "source": filename
            })

        # Split into smaller chunk Documents
        chunks = self.text_splitter.split_documents(raw_docs)
        
        # Ensure metadata is preserved across chunks
        for idx, chunk in enumerate(chunks):
            chunk.metadata["chunk_index"] = idx

        return doc_id, chunks, page_count

pdf_processor = PDFProcessor()
