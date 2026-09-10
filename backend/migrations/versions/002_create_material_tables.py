"""create ingestion and material tables: uploaded_files, materials, validation_errors, processing_jobs

Revision ID: 002_create_material_tables
Revises: 001_create_rbac_tables
Create Date: 2026-09-10

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_create_material_tables'
down_revision: Union[str, None] = '001_create_rbac_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create uploaded_files table
    op.create_table(
        'uploaded_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cpse_id', sa.Integer(), nullable=False),
        sa.Column('uploaded_by', sa.Integer(), nullable=True),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_type', sa.String(length=50), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('data_type', sa.String(length=50), server_default='MATERIAL_MASTER', nullable=False),
        sa.Column('total_rows', sa.Integer(), server_default='0', nullable=False),
        sa.Column('valid_rows', sa.Integer(), server_default='0', nullable=False),
        sa.Column('invalid_rows', sa.Integer(), server_default='0', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='UPLOADED', nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['cpse_id'], ['cpse.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_uploaded_files_id'), 'uploaded_files', ['id'], unique=False)
    op.create_index(op.f('ix_uploaded_files_cpse_id'), 'uploaded_files', ['cpse_id'], unique=False)

    # 2. Create materials table (RAW SOURCE-OF-TRUTH layer)
    op.create_table(
        'materials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cpse_id', sa.Integer(), nullable=False),
        sa.Column('uploaded_file_id', sa.Integer(), nullable=True),
        sa.Column('source_row_number', sa.Integer(), nullable=True),
        sa.Column('material_code', sa.String(length=100), nullable=False),
        sa.Column('raw_description', sa.Text(), nullable=False),
        sa.Column('order_qty', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('uom', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='ACTIVE', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['cpse_id'], ['cpse.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_file_id'], ['uploaded_files.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cpse_id', 'material_code', name='uq_materials_cpse_material_code')
    )
    op.create_index(op.f('ix_materials_id'), 'materials', ['id'], unique=False)
    op.create_index(op.f('ix_materials_cpse_id'), 'materials', ['cpse_id'], unique=False)
    op.create_index(op.f('ix_materials_uploaded_file_id'), 'materials', ['uploaded_file_id'], unique=False)
    op.create_index(op.f('ix_materials_material_code'), 'materials', ['material_code'], unique=False)

    # 3. Create validation_errors table
    op.create_table(
        'validation_errors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uploaded_file_id', sa.Integer(), nullable=False),
        sa.Column('row_number', sa.Integer(), nullable=False),
        sa.Column('column_name', sa.String(length=100), nullable=False),
        sa.Column('error_type', sa.String(length=100), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=False),
        sa.Column('raw_value', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['uploaded_file_id'], ['uploaded_files.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_validation_errors_id'), 'validation_errors', ['id'], unique=False)
    op.create_index(op.f('ix_validation_errors_uploaded_file_id'), 'validation_errors', ['uploaded_file_id'], unique=False)

    # 4. Create processing_jobs table
    op.create_table(
        'processing_jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('uploaded_file_id', sa.Integer(), nullable=False),
        sa.Column('job_type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='QUEUED', nullable=False),
        sa.Column('total_records', sa.Integer(), server_default='0', nullable=False),
        sa.Column('processed_records', sa.Integer(), server_default='0', nullable=False),
        sa.Column('failed_records', sa.Integer(), server_default='0', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['uploaded_file_id'], ['uploaded_files.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_processing_jobs_id'), 'processing_jobs', ['id'], unique=False)
    op.create_index(op.f('ix_processing_jobs_uploaded_file_id'), 'processing_jobs', ['uploaded_file_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_processing_jobs_uploaded_file_id'), table_name='processing_jobs')
    op.drop_index(op.f('ix_processing_jobs_id'), table_name='processing_jobs')
    op.drop_table('processing_jobs')

    op.drop_index(op.f('ix_validation_errors_uploaded_file_id'), table_name='validation_errors')
    op.drop_index(op.f('ix_validation_errors_id'), table_name='validation_errors')
    op.drop_table('validation_errors')

    op.drop_index(op.f('ix_materials_material_code'), table_name='materials')
    op.drop_index(op.f('ix_materials_uploaded_file_id'), table_name='materials')
    op.drop_index(op.f('ix_materials_cpse_id'), table_name='materials')
    op.drop_index(op.f('ix_materials_id'), table_name='materials')
    op.drop_table('materials')

    op.drop_index(op.f('ix_uploaded_files_cpse_id'), table_name='uploaded_files')
    op.drop_index(op.f('ix_uploaded_files_id'), table_name='uploaded_files')
    op.drop_table('uploaded_files')
