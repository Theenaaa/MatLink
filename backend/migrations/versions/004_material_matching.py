"""create material matching tables: material_embeddings, material_matches

Revision ID: 004_material_matching
Revises: 003_material_dna_norm
Create Date: 2026-09-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = '004_material_matching'
down_revision: Union[str, None] = '003_material_dna_norm'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Safely check if pgvector extension is available on the server before attempting creation
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
                CREATE EXTENSION IF NOT EXISTS vector;
            END IF;
        END $$;
    """)

    # 2. Create material_embeddings table
    op.create_table(
        'material_embeddings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('embedding', JSONB(), nullable=False),
        sa.Column('model_name', sa.String(length=100), server_default='sentence-transformers/all-MiniLM-L6-v2', nullable=False),
        sa.Column('embedding_version', sa.String(length=50), server_default='v1.0', nullable=False),
        sa.Column('source_text_hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('material_id', name='uq_material_embeddings_material_id'),
    )
    op.create_index(op.f('ix_material_embeddings_id'), 'material_embeddings', ['id'], unique=False)
    op.create_index(op.f('ix_material_embeddings_material_id'), 'material_embeddings', ['material_id'], unique=True)
    op.create_index(op.f('ix_material_embeddings_source_text_hash'), 'material_embeddings', ['source_text_hash'], unique=False)

    # 3. Create material_matches table
    op.create_table(
        'material_matches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('material_a_id', sa.Integer(), nullable=False),
        sa.Column('material_b_id', sa.Integer(), nullable=False),
        sa.Column('semantic_score', sa.Float(), nullable=False),
        sa.Column('attribute_score', sa.Float(), nullable=False),
        sa.Column('rule_score', sa.Float(), nullable=False),
        sa.Column('classification_score', sa.Float(), nullable=False),
        sa.Column('final_score', sa.Float(), nullable=False),
        sa.Column('relationship_type', sa.String(length=50), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('comparison_details', JSONB(), nullable=False),
        sa.Column('hard_blocked', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='PENDING', nullable=False),
        sa.Column('reviewed_by', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['material_a_id'], ['materials.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['material_b_id'], ['materials.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('material_a_id', 'material_b_id', name='uq_material_pair'),
    )
    op.create_index(op.f('ix_material_matches_id'), 'material_matches', ['id'], unique=False)
    op.create_index(op.f('ix_material_matches_material_a_id'), 'material_matches', ['material_a_id'], unique=False)
    op.create_index(op.f('ix_material_matches_material_b_id'), 'material_matches', ['material_b_id'], unique=False)
    op.create_index(op.f('ix_material_matches_final_score'), 'material_matches', ['final_score'], unique=False)
    op.create_index(op.f('ix_material_matches_relationship_type'), 'material_matches', ['relationship_type'], unique=False)
    op.create_index(op.f('ix_material_matches_status'), 'material_matches', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_material_matches_status'), table_name='material_matches')
    op.drop_index(op.f('ix_material_matches_relationship_type'), table_name='material_matches')
    op.drop_index(op.f('ix_material_matches_final_score'), table_name='material_matches')
    op.drop_index(op.f('ix_material_matches_material_b_id'), table_name='material_matches')
    op.drop_index(op.f('ix_material_matches_material_a_id'), table_name='material_matches')
    op.drop_index(op.f('ix_material_matches_id'), table_name='material_matches')
    op.drop_table('material_matches')

    op.drop_index(op.f('ix_material_embeddings_source_text_hash'), table_name='material_embeddings')
    op.drop_index(op.f('ix_material_embeddings_material_id'), table_name='material_embeddings')
    op.drop_index(op.f('ix_material_embeddings_id'), table_name='material_embeddings')
    op.drop_table('material_embeddings')
