# MatLink OCR

Standalone Streamlit extraction service for material documents and inventory tables.

## Run locally

```powershell
cd ocr
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
streamlit run ai_studio_code.py
```

EasyOCR downloads its language and detection models on first use.

## Supported inputs

- PDF: native extraction for clean digital pages and 300 DPI OCR for scanned or image-heavy pages
- Images: PNG, JPG/JPEG, TIFF, BMP, WebP, and GIF
- Spreadsheets: XLSX, XLS, XLSM, XLSB, ODS, CSV, and TSV
- Documents: DOCX and PPTX
- Text: TXT, Markdown, LOG, and JSON

Every extracted element includes confidence, source route, bounding box or structured-cell coordinates, provenance, and non-destructive domain correction candidates.
