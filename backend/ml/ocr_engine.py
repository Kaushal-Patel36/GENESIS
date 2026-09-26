import os
import io
import logging

try:
    import fitz  # PyMuPDF
    FITZ_AVAILABLE = True
except ImportError:
    FITZ_AVAILABLE = False
    fitz = None

try:
    import pytesseract
    from pdf2image import convert_from_path
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    pytesseract = None
    convert_from_path = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set tesseract path for macOS (common homebrew path)
if OCR_AVAILABLE:
    TESSERACT_CMD = "/opt/homebrew/bin/tesseract"
    if os.path.exists(TESSERACT_CMD):
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

class OCREngine:
    """
    Engine for extracting text from clinical PDFs and images.
    Uses PyMuPDF for searchable PDFs and Tesseract for scanned documents.
    """
    
    def extract_text(self, file_path: str) -> str:
        """
        Main entry point to extract text from a file (PDF or Image).
        """
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == ".pdf":
            return self._process_pdf(file_path)
        elif ext in [".png", ".jpg", ".jpeg", ".tiff", ".bmp"]:
            return self._process_image(file_path)
        else:
            logger.warning(f"Unsupported file extension: {ext}")
            return ""

    def _process_pdf(self, pdf_path: str) -> str:
        """
        Process a PDF file. First try searchable text, then fallback to OCR.
        """
        text = ""
        if FITZ_AVAILABLE and fitz:
            try:
                doc = fitz.open(pdf_path)
                for page in doc:
                    text += page.get_text()
                doc.close()
                if len(text.strip()) > 50:
                    logger.info(f"Successfully extracted searchable text from {pdf_path}")
                    return text
            except Exception as e:
                logger.error(f"PyMuPDF error: {e}")

        # Fallback to OCR if searchable text is missing or sparse
        logger.info(f"Searchable text not found in {pdf_path}. Falling back to OCR.")
        return self._ocr_pdf(pdf_path)

    def _ocr_pdf(self, pdf_path: str) -> str:
        if not OCR_AVAILABLE:
            return "[OCR unavailable: pytesseract/pdf2image not installed]"
        full_text = ""
        try:
            pages = convert_from_path(pdf_path)
            for i, page in enumerate(pages):
                logger.info(f"OCRing page {i+1}/{len(pages)}...")
                page_text = pytesseract.image_to_string(page)
                full_text += page_text + "\n\n"
        except Exception as e:
            logger.error(f"OCR error for {pdf_path}: {e}")
        return full_text

    def _process_image(self, image_path: str) -> str:
        if not OCR_AVAILABLE:
            return "[OCR unavailable: pytesseract not installed]"
        try:
            from PIL import Image as _Img
            img = _Img.open(image_path)
            return pytesseract.image_to_string(img)
        except Exception as e:
            logger.error(f"Image OCR error for {image_path}: {e}")
            return ""

# Singleton instance
ocr_engine = OCREngine()
