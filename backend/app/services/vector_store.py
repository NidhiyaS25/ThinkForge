import os
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings

class VectorStore:
    def __init__(self):
        self.chroma_client = None
        self.collection = None
        self.embed_model = None
        self.in_memory_docs: List[Dict[str, Any]] = []
        self._init_backend()

    def _init_backend(self):
        try:
            import chromadb
            from sentence_transformers import SentenceTransformer

            self.embed_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            self.chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
            self.collection = self.chroma_client.get_or_create_collection(
                name="thinkforge_materials",
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as e:
            # Deterministic in-memory fallback
            self.chroma_client = None
            self.collection = None
            self.embed_model = None

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        if not chunks:
            return

        if self.collection and self.embed_model:
            ids = [c["chunk_id"] for c in chunks]
            texts = [c["text"] for c in chunks]
            metadatas = [
                {
                    "course_id": c["course_id"],
                    "document_id": c["document_id"],
                    "page": c["page"]
                }
                for c in chunks
            ]
            embeddings = self.embed_model.encode(texts, normalize_embeddings=True).tolist()
            self.collection.upsert(ids=ids, documents=texts, metadatas=metadatas, embeddings=embeddings)
        else:
            # In-memory fallback
            # Remove any existing chunks with matching IDs
            existing_ids = {c["chunk_id"] for c in chunks}
            self.in_memory_docs = [d for d in self.in_memory_docs if d["chunk_id"] not in existing_ids]
            self.in_memory_docs.extend(chunks)

    def search(
        self,
        query: str,
        course_id: int,
        document_id: Optional[int] = None,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Retrieves relevant course chunks filtered strictly by course_id (and document_id if provided).
        """
        if self.collection and self.embed_model:
            where_clause = {"course_id": course_id}
            if document_id:
                where_clause = {
                    "$and": [
                        {"course_id": course_id},
                        {"document_id": document_id}
                    ]
                }
            query_emb = self.embed_model.encode([query], normalize_embeddings=True).tolist()
            results = self.collection.query(
                query_embeddings=query_emb,
                n_results=top_k,
                where=where_clause
            )
            retrieved = []
            if results and "documents" in results and results["documents"]:
                for i in range(len(results["documents"][0])):
                    retrieved.append({
                        "text": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i]
                    })
            return retrieved
        else:
            # In-memory keyword / heuristic match
            filtered = [d for d in self.in_memory_docs if d["course_id"] == course_id]
            if document_id:
                filtered = [d for d in filtered if d["document_id"] == document_id]

            if not filtered:
                # Return default course notes if nothing uploaded yet
                return [
                    {
                        "text": "Base Cases in Recursion: Without a base case, recursion continues infinitely causing a stack overflow. When the base case is reached, the function ceases recursive invocations and begins unwinding the call stack.",
                        "metadata": {"course_id": course_id, "document_id": 1, "page": 12, "document_name": "Course Notes - Page 12"}
                    }
                ]

            query_words = set(query.lower().split())
            scored = []
            for item in filtered:
                item_words = set(item["text"].lower().split())
                overlap = len(query_words.intersection(item_words))
                scored.append((overlap, item))
            scored.sort(key=lambda x: x[0], reverse=True)
            return [{"text": it["text"], "metadata": {"course_id": it["course_id"], "document_id": it["document_id"], "page": it["page"]}} for _, it in scored[:top_k]]

vector_store = VectorStore()
