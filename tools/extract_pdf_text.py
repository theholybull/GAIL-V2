import json
import sys
from pathlib import Path


def extract_with_pymupdf(path: Path) -> tuple[str, int]:
    import fitz

    doc = fitz.open(path)
    parts: list[str] = []
    try:
      for page in doc:
        text = page.get_text("text")
        if text:
          parts.append(text)
    finally:
      doc.close()
    return "\n".join(parts).strip(), len(parts)


def extract_with_pypdf(path: Path) -> str:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    parts: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        if text:
            parts.append(text)
    return "\n".join(parts).strip()


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing PDF path."}))
        return 1

    path = Path(sys.argv[1])
    if not path.exists():
        print(json.dumps({"error": f"PDF not found: {path}"}))
        return 1

    warnings: list[str] = []
    text = ""
    page_count = 0
    used = ""

    try:
        text, page_count = extract_with_pymupdf(path)
        used = "pymupdf"
    except Exception as error:
        warnings.append(f"PyMuPDF extraction failed: {error}")

    if not text:
        try:
            text = extract_with_pypdf(path)
            used = "pypdf"
        except Exception as error:
            warnings.append(f"pypdf extraction failed: {error}")

    if not text:
        warnings.append("No embedded PDF text was extracted. The document may be image-only and OCR is not installed yet.")

    print(json.dumps({
        "text": text,
        "pageCount": page_count,
        "used": used,
        "warnings": warnings,
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
