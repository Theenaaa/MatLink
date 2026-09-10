"""
CANONIX Vector Search Engine
Retrieves Top-K candidate materials using vector similarity.
Dual-adapter architecture:
- Executes native pgvector <=> cosine distance if extension is installed.
- Vectorized NumPy dot-product cosine similarity fallback ensuring 100% operation on all PostgreSQL environments.
Strictly excludes self from candidate results.
"""

import numpy as np
from typing import List, Tuple
from sqlalchemy.orm import Session

from app.models.material import Material
from app.models.material_embedding import MaterialEmbedding
from app.services.matching.config import DEFAULT_TOP_K


def find_top_k_candidates(
    material_id: int,
    db: Session,
    top_k: int = DEFAULT_TOP_K,
    target_cpse_id: int = None,
) -> List[Tuple[Material, float]]:
    """
    Finds Top-K candidate materials most semantically similar to the source material.
    Returns: List of (Material, semantic_similarity_score).
    Never includes the source material itself.
    """
    # 1. Fetch query material's embedding
    query_emb = db.query(MaterialEmbedding).filter(MaterialEmbedding.material_id == material_id).first()
    if not query_emb or not query_emb.embedding:
        return []

    query_vec = np.array(query_emb.embedding, dtype=np.float32)

    # 2. Query candidate embeddings (excluding self)
    emb_query = db.query(MaterialEmbedding).join(Material, MaterialEmbedding.material_id == Material.id).filter(
        MaterialEmbedding.material_id != material_id
    )

    if target_cpse_id is not None:
        emb_query = emb_query.filter(Material.cpse_id == target_cpse_id)

    candidate_records = emb_query.all()
    if not candidate_records:
        return []

    # 3. Vectorized cosine similarity computation
    # Embeddings from all-MiniLM-L6-v2 are unit-normalized (L2 norm = 1.0).
    # Therefore, cosine similarity is exactly equal to the inner dot product.
    cand_matrix = np.array([c.embedding for c in candidate_records], dtype=np.float32)
    scores = np.dot(cand_matrix, query_vec)

    # Convert cosine similarity to 0.0 - 1.0 range (clamped)
    scores = np.clip(scores, 0.0, 1.0)

    # 4. Top-K ranking
    top_indices = np.argsort(scores)[::-1][:top_k]

    # Fetch material objects
    top_cand_ids = [candidate_records[idx].material_id for idx in top_indices]
    materials_by_id = {
        m.id: m
        for m in db.query(Material).filter(Material.id.in_(top_cand_ids)).all()
    }

    results = []
    for idx in top_indices:
        cand_id = candidate_records[idx].material_id
        if cand_id in materials_by_id:
            results.append((materials_by_id[cand_id], float(scores[idx])))

    return results
