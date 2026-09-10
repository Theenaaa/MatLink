"""
CANONIX Embedding Service
Generates local 384-dimensional Sentence Transformer embeddings from deterministic, structured Material DNA text.
Embeds canonical understanding, not merely raw descriptions.
Uses SHA-256 hashing to track stale embeddings.
"""

import hashlib
import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.material import Material
from app.models.material_embedding import MaterialEmbedding
from app.services.matching.config import EMBEDDING_MODEL, EMBEDDING_DIMENSION, EMBEDDING_VERSION

logger = logging.getLogger(__name__)

# Singleton SentenceTransformer model instance
_model_instance = None


def get_embedding_model():
    """
    Loads SentenceTransformer model as a singleton once per worker process.
    """
    global _model_instance
    if _model_instance is None:
        logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
        from sentence_transformers import SentenceTransformer
        _model_instance = SentenceTransformer(EMBEDDING_MODEL)
    return _model_instance


def generate_deterministic_embedding_text(material: Material) -> str:
    """
    Constructs a deterministic, rich text representation from structured Material DNA and Canonical Description.
    Guarantees consistent semantic encoding across catalogs.
    """
    dna: Dict[str, Any] = material.material_dna or {}
    lines = []

    # 1. Classification
    m_type = material.material_type or dna.get("material_type") or "OTHER"
    m_group = material.material_group or dna.get("material_group") or "GENERAL"
    lines.append(f"Material Type: {m_type}")
    lines.append(f"Material Group: {m_group}")

    # 2. Key Attributes from DNA
    if dna.get("size"):
        sz = dna["size"]
        if isinstance(sz, dict) and sz.get("value") is not None:
            lines.append(f"Size: {sz['value']} {sz.get('unit', 'MM')}")
        elif sz is not None:
            lines.append(f"Size: {sz}")

    if dna.get("construction"):
        lines.append(f"Construction: {dna['construction']}")

    if dna.get("material_family"):
        lines.append(f"Material Family: {dna['material_family']}")

    if dna.get("body_material"):
        lines.append(f"Body Material: {dna['body_material']}")

    if dna.get("material_grade"):
        lines.append(f"Material Grade: {dna['material_grade']}")

    if dna.get("pump_type"):
        lines.append(f"Pump Type: {dna['pump_type']}")

    if dna.get("valve_type"):
        lines.append(f"Valve Type: {dna['valve_type']}")

    if dna.get("flange_type"):
        lines.append(f"Flange Type: {dna['flange_type']}")

    if dna.get("flow_rate"):
        fr = dna["flow_rate"]
        if isinstance(fr, dict) and fr.get("value") is not None:
            lines.append(f"Flow Rate: {fr['value']} {fr.get('unit', 'M3/HR')}")

    if dna.get("schedule"):
        lines.append(f"Schedule: {dna['schedule']}")

    if dna.get("pressure_class"):
        lines.append(f"Pressure Class: {dna['pressure_class']}")

    if dna.get("end_type"):
        lines.append(f"End Type: {dna['end_type']}")

    if dna.get("standard"):
        lines.append(f"Standard: {dna['standard']}")

    # 3. Canonical Description
    canon = material.canonical_description or material.raw_description
    lines.append(f"Canonical Description: {canon}")

    return "\n".join(lines)


def compute_source_text_hash(text: str) -> str:
    """
    Computes SHA-256 hash of deterministic source text for change detection.
    """
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def embed_text(text: str) -> List[float]:
    """
    Generates 384-dimensional dense vector for input text.
    """
    model = get_embedding_model()
    embedding = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
    return [float(x) for x in embedding.tolist()]


def embed_material(material: Material, db: Session, force_regenerate: bool = False) -> MaterialEmbedding:
    """
    Generates or refreshes embedding for a single material.
    Skips re-computation if embedding is up-to-date and not stale.
    """
    if material.normalization_status != "NORMALIZED":
        raise ValueError("Cannot generate embedding for unnormalized material.")

    source_text = generate_deterministic_embedding_text(material)
    text_hash = compute_source_text_hash(source_text)

    # Check existing embedding
    existing = db.query(MaterialEmbedding).filter(MaterialEmbedding.material_id == material.id).first()
    if existing and not force_regenerate:
        if existing.source_text_hash == text_hash and existing.embedding_version == EMBEDDING_VERSION:
            return existing  # Fresh

    # Generate embedding vector
    vector = embed_text(source_text)

    if existing:
        existing.embedding = vector
        existing.source_text_hash = text_hash
        existing.model_name = EMBEDDING_MODEL
        existing.embedding_version = EMBEDDING_VERSION
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_emb = MaterialEmbedding(
            material_id=material.id,
            embedding=vector,
            model_name=EMBEDDING_MODEL,
            embedding_version=EMBEDDING_VERSION,
            source_text_hash=text_hash,
        )
        db.add(new_emb)
        db.commit()
        db.refresh(new_emb)
        return new_emb


def batch_embed_materials(materials: List[Material], db: Session, batch_size: int = 64) -> int:
    """
    Generates embeddings for a batch of materials, skipping up-to-date records.
    Scales to arbitrary catalog sizes.
    """
    if not materials:
        return 0

    model = get_embedding_model()
    to_embed = []
    metadata = []

    # Filter out materials that already have up-to-date embeddings
    mat_ids = [m.id for m in materials]
    existing_map = {
        e.material_id: e
        for e in db.query(MaterialEmbedding).filter(MaterialEmbedding.material_id.in_(mat_ids)).all()
    }

    for m in materials:
        source_text = generate_deterministic_embedding_text(m)
        text_hash = compute_source_text_hash(source_text)
        ex = existing_map.get(m.id)
        if ex and ex.source_text_hash == text_hash and ex.embedding_version == EMBEDDING_VERSION:
            continue
        to_embed.append(source_text)
        metadata.append((m.id, text_hash, ex))

    if not to_embed:
        return 0

    logger.info(f"Generating embeddings for {len(to_embed)} materials in chunks of {batch_size}...")

    # Process in chunks
    for i in range(0, len(to_embed), batch_size):
        chunk_texts = to_embed[i : i + batch_size]
        chunk_meta = metadata[i : i + batch_size]

        chunk_vectors = model.encode(chunk_texts, batch_size=batch_size, convert_to_numpy=True, normalize_embeddings=True)

        for j, (m_id, text_hash, ex) in enumerate(chunk_meta):
            vec = [float(x) for x in chunk_vectors[j].tolist()]
            if ex:
                ex.embedding = vec
                ex.source_text_hash = text_hash
                ex.model_name = EMBEDDING_MODEL
                ex.embedding_version = EMBEDDING_VERSION
            else:
                db.add(
                    MaterialEmbedding(
                        material_id=m_id,
                        embedding=vec,
                        model_name=EMBEDDING_MODEL,
                        embedding_version=EMBEDDING_VERSION,
                        source_text_hash=text_hash,
                    )
                )

        db.commit()

    return len(to_embed)
