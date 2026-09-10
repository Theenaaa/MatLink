import os
import io
import math
import pandas as pd
from datetime import datetime, timezone
from typing import Tuple, List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.uploaded_file import UploadedFile
from app.models.material import Material
from app.models.validation_error import ValidationError
from app.models.processing_job import ProcessingJob

# Directory to safely store uploaded files for historical auditing
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Standardized column mapping variants
HEADER_ALIASES = {
    "material_code": [
        "material code", "material_code", "materialcode", "mat code",
        "item code", "item_code", "material", "matnr", "code"
    ],
    "description": [
        "description", "material description", "material_description",
        "item description", "short description", "maktx", "desc"
    ],
    "order_qty": [
        "order qty", "order_qty", "order quantity", "order_quantity",
        "quantity", "qty", "menge"
    ],
    "uom": [
        "uom", "unit", "unit of measure", "unit_of_measure", "meins"
    ]
}


def normalize_column_name(col: str) -> str:
    cleaned = str(col).strip().lower().replace("-", "_").replace("  ", " ")
    for canonical, aliases in HEADER_ALIASES.items():
        if cleaned in aliases or cleaned.replace(" ", "") in aliases:
            return canonical
    return cleaned


def parse_and_validate_file(
    file_bytes: bytes,
    file_name: str,
    cpse_id: int,
    user_id: Optional[int],
    db: Session,
) -> Tuple[UploadedFile, List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Validates uploaded CSV/XLSX file against the 11 enterprise business rules.
    Returns (UploadedFile, valid_rows, validation_errors_list).
    """
    file_ext = os.path.splitext(file_name)[1].lower()
    if file_ext not in [".csv", ".xlsx", ".xls"]:
        raise ValueError(f"Unsupported file format '{file_ext}'. Only .csv, .xlsx, and .xls are supported.")

    # Read dataframe
    try:
        if file_ext == ".csv":
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), dtype=str, keep_default_na=False)
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(file_bytes), dtype=str, encoding="latin1", keep_default_na=False)
        else:
            df = pd.read_excel(io.BytesIO(file_bytes), dtype=str, keep_default_na=False)
    except Exception as e:
        raise ValueError(f"Failed to read file content: {str(e)}")

    # 1. Header Validation & Mapping
    original_columns = list(df.columns)
    mapped_columns = {col: normalize_column_name(col) for col in original_columns}
    df.rename(columns=mapped_columns, inplace=True)

    required_fields = ["material_code", "description", "order_qty", "uom"]
    missing_headers = [req for req in required_fields if req not in df.columns]

    # Create UploadedFile record in DB
    uploaded_file = UploadedFile(
        cpse_id=cpse_id,
        uploaded_by=user_id,
        file_name=file_name,
        file_type=file_ext.lstrip("."),
        file_size=len(file_bytes),
        data_type="MATERIAL_MASTER",
        status="VALIDATING",
        total_rows=len(df),
        uploaded_at=datetime.now(timezone.utc),
    )
    db.add(uploaded_file)
    db.flush()

    # Save physical copy for audit trail
    stored_path = os.path.join(UPLOAD_DIR, f"{uploaded_file.id}_{file_name}")
    with open(stored_path, "wb") as f:
        f.write(file_bytes)

    # If critical headers missing, record error and return
    if missing_headers:
        err = ValidationError(
            uploaded_file_id=uploaded_file.id,
            row_number=1,
            column_name="HEADERS",
            error_type="MISSING_HEADER",
            error_message=f"Missing required columns: {', '.join(missing_headers)}. Found: {', '.join(original_columns)}",
            raw_value=str(original_columns),
        )
        db.add(err)
        uploaded_file.status = "FAILED"
        uploaded_file.invalid_rows = len(df)
        db.commit()
        db.refresh(uploaded_file)
        return uploaded_file, [], [{"row_number": 1, "column_name": "HEADERS", "error_type": "MISSING_HEADER", "error_message": err.error_message, "raw_value": str(original_columns)}]

    # Pre-fetch existing material codes for this CPSE to check duplicates against database (Rule #7)
    existing_codes = set(
        row[0] for row in db.query(Material.material_code)
        .filter(Material.cpse_id == cpse_id)
        .all()
    )

    batch_codes_seen = set()
    errors_to_insert = []
    valid_rows = []

    # Iterate rows and perform validation
    for idx, row in df.iterrows():
        row_idx = idx[0] if isinstance(idx, tuple) else int(idx)
        row_number = row_idx + 2  # 1-based index including header row
        is_row_valid = True

        raw_code = str(row.get("material_code", "")).strip()
        raw_desc = str(row.get("description", "")).strip()
        raw_qty = str(row.get("order_qty", "")).strip()
        raw_uom = str(row.get("uom", "")).strip()

        # Check empty row
        if not raw_code and not raw_desc and not raw_qty and not raw_uom:
            continue  # ignore blank trailing rows

        # Rule 2: Missing Material Code
        if not raw_code:
            is_row_valid = False
            errors_to_insert.append(ValidationError(
                uploaded_file_id=uploaded_file.id,
                row_number=row_number,
                column_name="Material Code",
                error_type="MISSING_FIELD",
                error_message="Material Code is empty or missing.",
                raw_value="",
            ))
        else:
            # Rule 6: Duplicate Material Code within batch
            if raw_code in batch_codes_seen:
                is_row_valid = False
                errors_to_insert.append(ValidationError(
                    uploaded_file_id=uploaded_file.id,
                    row_number=row_number,
                    column_name="Material Code",
                    error_type="DUPLICATE_IN_BATCH",
                    error_message=f"Duplicate material code '{raw_code}' within the uploaded batch.",
                    raw_value=raw_code,
                ))
            else:
                batch_codes_seen.add(raw_code)

            # Rule 7: Duplicate Material Code against existing records for same CPSE
            if raw_code in existing_codes:
                is_row_valid = False
                errors_to_insert.append(ValidationError(
                    uploaded_file_id=uploaded_file.id,
                    row_number=row_number,
                    column_name="Material Code",
                    error_type="DUPLICATE_IN_CPSE",
                    error_message=f"Material code '{raw_code}' already exists in your organization's catalog.",
                    raw_value=raw_code,
                ))

        # Rule 3: Missing Description
        if not raw_desc:
            is_row_valid = False
            errors_to_insert.append(ValidationError(
                uploaded_file_id=uploaded_file.id,
                row_number=row_number,
                column_name="Description",
                error_type="MISSING_FIELD",
                error_message="Material description is empty or missing.",
                raw_value="",
            ))

        # Rule 4 & 8 & 9: Order Qty validation
        parsed_qty = 0.0
        if not raw_qty:
            is_row_valid = False
            errors_to_insert.append(ValidationError(
                uploaded_file_id=uploaded_file.id,
                row_number=row_number,
                column_name="Order Qty",
                error_type="MISSING_FIELD",
                error_message="Order Quantity is empty or missing.",
                raw_value="",
            ))
        else:
            try:
                # Remove commas, currency symbols, spaces
                clean_qty_str = raw_qty.replace(",", "").replace("$", "").replace("₹", "").strip()
                parsed_qty = float(clean_qty_str)
                if math.isnan(parsed_qty) or math.isinf(parsed_qty):
                    raise ValueError()
                if parsed_qty < 0:
                    is_row_valid = False
                    errors_to_insert.append(ValidationError(
                        uploaded_file_id=uploaded_file.id,
                        row_number=row_number,
                        column_name="Order Qty",
                        error_type="NEGATIVE_VALUE",
                        error_message="Order Quantity must not be negative.",
                        raw_value=raw_qty,
                    ))
            except ValueError:
                is_row_valid = False
                errors_to_insert.append(ValidationError(
                    uploaded_file_id=uploaded_file.id,
                    row_number=row_number,
                    column_name="Order Qty",
                    error_type="INVALID_NUMERIC",
                    error_message="Order Quantity must be a valid number.",
                    raw_value=raw_qty,
                ))

        # Rule 5 & 10: UOM Validation
        if not raw_uom:
            is_row_valid = False
            errors_to_insert.append(ValidationError(
                uploaded_file_id=uploaded_file.id,
                row_number=row_number,
                column_name="UOM",
                error_type="MISSING_FIELD",
                error_message="Unit of Measure (UOM) is empty or missing.",
                raw_value="",
            ))

        if is_row_valid:
            valid_rows.append({
                "source_row_number": row_number,
                "material_code": raw_code,
                "raw_description": raw_desc,
                "order_qty": parsed_qty,
                "uom": raw_uom.upper(),
            })

    # Bulk save validation errors
    if errors_to_insert:
        db.bulk_save_objects(errors_to_insert)

    # Create processing_job record for VALIDATION
    job = ProcessingJob(
        uploaded_file_id=uploaded_file.id,
        job_type="VALIDATION",
        status="COMPLETED",
        total_records=len(df),
        processed_records=len(valid_rows),
        failed_records=len(errors_to_insert),
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
    )
    db.add(job)

    uploaded_file.valid_rows = len(valid_rows)
    uploaded_file.invalid_rows = len(errors_to_insert)
    uploaded_file.status = "VALIDATED" if len(valid_rows) > 0 else "FAILED"
    uploaded_file.processed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(uploaded_file)

    # Format errors for response
    formatted_errors = [
        {
            "row_number": e.row_number,
            "column_name": e.column_name,
            "error_type": e.error_type,
            "error_message": e.error_message,
            "raw_value": e.raw_value,
        }
        for e in errors_to_insert
    ]

    return uploaded_file, valid_rows, formatted_errors


def import_validated_dataset(
    uploaded_file_id: int,
    cpse_id: int,
    db: Session,
) -> int:
    """
    Imports all valid rows from the uploaded file into the RAW materials table.
    Ensures historical traceability via uploaded_file_id and source_row_number.
    """
    uploaded_file = db.query(UploadedFile).filter(
        UploadedFile.id == uploaded_file_id,
        UploadedFile.cpse_id == cpse_id,
    ).first()

    if not uploaded_file:
        raise ValueError("Dataset not found or access denied.")

    if uploaded_file.status == "COMPLETED":
        raise ValueError("Dataset has already been imported.")

    # Locate saved file
    stored_path = os.path.join(UPLOAD_DIR, f"{uploaded_file.id}_{uploaded_file.file_name}")
    if not os.path.exists(stored_path):
        raise ValueError("Stored dataset file could not be found on server.")

    with open(stored_path, "rb") as f:
        file_bytes = f.read()

    # Create IMPORT processing job
    job = ProcessingJob(
        uploaded_file_id=uploaded_file.id,
        job_type="IMPORT",
        status="PROCESSING",
        total_records=uploaded_file.valid_rows,
        started_at=datetime.now(timezone.utc),
    )
    db.add(job)
    uploaded_file.status = "PROCESSING"
    db.commit()

    try:
        # Re-parse valid rows
        file_ext = os.path.splitext(uploaded_file.file_name)[1].lower()
        if file_ext == ".csv":
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), dtype=str, keep_default_na=False)
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(file_bytes), dtype=str, encoding="latin1", keep_default_na=False)
        else:
            df = pd.read_excel(io.BytesIO(file_bytes), dtype=str, keep_default_na=False)

        # Normalize column headers
        mapped_columns = {col: normalize_column_name(col) for col in df.columns}
        df.rename(columns=mapped_columns, inplace=True)

        # Retrieve row numbers that had errors
        error_row_numbers = set(
            row[0] for row in db.query(ValidationError.row_number)
            .filter(ValidationError.uploaded_file_id == uploaded_file.id)
            .all()
        )

        # Existing codes check
        existing_codes = set(
            row[0] for row in db.query(Material.material_code)
            .filter(Material.cpse_id == cpse_id)
            .all()
        )

        materials_to_insert = []
        batch_seen = set()

        for idx, row in df.iterrows():
            row_num = idx + 2
            if row_num in error_row_numbers:
                continue

            mat_code = str(row.get("material_code", "")).strip()
            raw_desc = str(row.get("description", "")).strip()
            raw_qty = str(row.get("order_qty", "")).strip()
            raw_uom = str(row.get("uom", "")).strip()

            if not mat_code or mat_code in existing_codes or mat_code in batch_seen:
                continue

            batch_seen.add(mat_code)
            try:
                qty = float(raw_qty.replace(",", "").replace("$", "").replace("₹", "").strip())
            except ValueError:
                qty = 0.0

            material = Material(
                cpse_id=cpse_id,
                uploaded_file_id=uploaded_file.id,
                source_row_number=row_num,
                material_code=mat_code,
                raw_description=raw_desc,
                order_qty=qty,
                uom=raw_uom.upper() or "EA",
                status="ACTIVE",
            )
            materials_to_insert.append(material)

        db.bulk_save_objects(materials_to_insert)

        job.status = "COMPLETED"
        job.processed_records = len(materials_to_insert)
        job.completed_at = datetime.now(timezone.utc)

        uploaded_file.status = "COMPLETED"
        uploaded_file.processed_at = datetime.now(timezone.utc)

        db.commit()
        return len(materials_to_insert)

    except Exception as e:
        db.rollback()
        job.status = "FAILED"
        job.error_message = str(e)
        uploaded_file.status = "FAILED"
        db.commit()
        raise e
