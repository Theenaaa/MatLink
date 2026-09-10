"""create normalization and material dna tables: material_attributes, materials additions, processing_jobs updates

Revision ID: 003_material_dna_norm
Revises: 002_create_material_tables
Create Date: 2026-09-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_material_dna_norm'
down_revision: Union[str, None] = '002_create_material_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add Phase 3 columns to materials table
    op.add_column('materials', sa.Column('normalized_description', sa.Text(), nullable=True))
    op.add_column('materials', sa.Column('canonical_description', sa.Text(), nullable=True))
    op.add_column('materials', sa.Column('material_type', sa.String(length=100), nullable=True))
    op.add_column('materials', sa.Column('material_group', sa.String(length=100), nullable=True))
    op.add_column('materials', sa.Column('material_dna', sa.JSON(), nullable=True))
    op.add_column('materials', sa.Column('normalization_status', sa.String(length=50), server_default='RAW', nullable=False))
    op.add_column('materials', sa.Column('normalized_at', sa.DateTime(timezone=True), nullable=True))

    op.create_index(op.f('ix_materials_material_type'), 'materials', ['material_type'], unique=False)
    op.create_index(op.f('ix_materials_material_group'), 'materials', ['material_group'], unique=False)
    op.create_index(op.f('ix_materials_normalization_status'), 'materials', ['normalization_status'], unique=False)

    # 2. Create material_attributes table
    op.create_table(
        'material_attributes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('attribute_name', sa.String(length=100), nullable=False),
        sa.Column('raw_value', sa.String(length=255), nullable=True),
        sa.Column('normalized_value', sa.String(length=255), nullable=True),
        sa.Column('normalized_unit', sa.String(length=50), nullable=True),
        sa.Column('confidence_score', sa.Float(), server_default='1.0', nullable=False),
        sa.Column('extraction_method', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_material_attributes_id'), 'material_attributes', ['id'], unique=False)
    op.create_index(op.f('ix_material_attributes_material_id'), 'material_attributes', ['material_id'], unique=False)
    op.create_index(op.f('ix_material_attributes_attribute_name'), 'material_attributes', ['attribute_name'], unique=False)
    op.create_index('ix_material_attributes_mat_attr', 'material_attributes', ['material_id', 'attribute_name'], unique=False)

    # 3. Update processing_jobs table to allow nullable uploaded_file_id and add successful_records
    op.alter_column('processing_jobs', 'uploaded_file_id', existing_type=sa.Integer(), nullable=True)
    op.add_column('processing_jobs', sa.Column('successful_records', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('processing_jobs', 'successful_records')
    op.alter_column('processing_jobs', 'uploaded_file_id', existing_type=sa.Integer(), nullable=False)

    op.drop_index('ix_material_attributes_mat_attr', table_name='material_attributes')
    op.drop_index(op.f('ix_material_attributes_attribute_name'), table_name='material_attributes')
    op.drop_index(op.f('ix_material_attributes_material_id'), table_name='material_attributes')
    op.drop_index(op.f('ix_material_attributes_id'), table_name='material_attributes')
    op.drop_table('material_attributes')

    op.drop_index(op.f('ix_materials_normalization_status'), table_name='materials')
    op.drop_index(op.f('ix_materials_material_group'), table_name='materials')
    op.drop_index(op.f('ix_materials_material_type'), table_name='materials')
    op.drop_column('materials', 'normalized_at')
    op.drop_column('materials', 'normalization_status')
    op.drop_column('materials', 'material_dna')
    op.drop_column('materials', 'material_group')
    op.drop_column('materials', 'material_type')
    op.drop_column('materials', 'canonical_description')
    op.drop_column('materials', 'normalized_description')
