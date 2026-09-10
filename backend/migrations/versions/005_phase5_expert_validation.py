"""create Phase 5 tables: national_materials, material_mappings, review_actions, audit_logs and correct role scopes

Revision ID: 005_phase5_expert_validation
Revises: 004_material_matching
Create Date: 2026-09-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = '005_phase5_expert_validation'
down_revision: Union[str, None] = '004_material_matching'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create national_materials table
    op.create_table(
        'national_materials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('national_material_code', sa.String(length=100), nullable=False),
        sa.Column('canonical_description', sa.Text(), nullable=False),
        sa.Column('material_type', sa.String(length=100), nullable=False),
        sa.Column('material_group', sa.String(length=100), nullable=False),
        sa.Column('material_dna', JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='PENDING_APPROVAL', nullable=False),
        sa.Column('originating_match_id', sa.Integer(), nullable=True),
        sa.Column('ai_evidence', JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['originating_match_id'], ['material_matches.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('national_material_code', name='uq_national_material_code')
    )
    op.create_index('ix_national_materials_code', 'national_materials', ['national_material_code'], unique=True)
    op.create_index('ix_national_materials_type', 'national_materials', ['material_type'], unique=False)
    op.create_index('ix_national_materials_group', 'national_materials', ['material_group'], unique=False)
    op.create_index('ix_national_materials_status', 'national_materials', ['status'], unique=False)

    # 2. Create material_mappings table
    op.create_table(
        'material_mappings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('national_material_id', sa.Integer(), nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('cpse_id', sa.Integer(), nullable=False),
        sa.Column('mapping_type', sa.String(length=50), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='PENDING', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['cpse_id'], ['cpse.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['national_material_id'], ['national_materials.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('national_material_id', 'material_id', name='uq_national_material_mapping'),
        sa.UniqueConstraint('material_id', name='uq_material_single_national_mapping')
    )
    op.create_index('ix_material_mappings_nat_id', 'material_mappings', ['national_material_id'], unique=False)
    op.create_index('ix_material_mappings_mat_id', 'material_mappings', ['material_id'], unique=False)
    op.create_index('ix_material_mappings_cpse_id', 'material_mappings', ['cpse_id'], unique=False)
    op.create_index('ix_material_mappings_status', 'material_mappings', ['status'], unique=False)

    # 3. Create review_actions table
    op.create_table(
        'review_actions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('match_id', sa.Integer(), nullable=False),
        sa.Column('reviewer_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('previous_status', sa.String(length=50), nullable=True),
        sa.Column('new_status', sa.String(length=50), nullable=False),
        sa.Column('previous_relationship', sa.String(length=50), nullable=True),
        sa.Column('new_relationship', sa.String(length=50), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('modified_data', JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['match_id'], ['material_matches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_review_actions_match_id', 'review_actions', ['match_id'], unique=False)
    op.create_index('ix_review_actions_reviewer_id', 'review_actions', ['reviewer_id'], unique=False)

    # 4. Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('old_values', JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('new_values', JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'], unique=False)
    op.create_index('ix_audit_logs_entity', 'audit_logs', ['entity_type', 'entity_id'], unique=False)
    op.create_index('ix_audit_logs_created_at', 'audit_logs', ['created_at'], unique=False)

    # 5. Role scope correction: MATERIAL_EXPERT and PROCUREMENT_ANALYST must have national scope (cpse_id = NULL)
    op.execute("""
        UPDATE users 
        SET cpse_id = NULL 
        WHERE role_id IN (
            SELECT id FROM roles WHERE name IN ('MATERIAL_EXPERT', 'PROCUREMENT_ANALYST', 'SUPER_ADMIN')
        );
    """)


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('review_actions')
    op.drop_table('material_mappings')
    op.drop_table('national_materials')
