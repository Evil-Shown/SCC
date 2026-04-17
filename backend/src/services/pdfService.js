import { createRequire } from 'module';
import { createWorker } from 'tesseract.js';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

// pdf-parse modules properly imported
const { PDFParse } = require('pdf-parse');

// pdfjs-dist modules properly imported
const pdfjsLib = require('pdfjs-dist');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set worker path for pdfjs-dist (older version)
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');

// OCR function using tesseract.js - converts PDF pages to images first
const extractTextUsingOCR = async (fileBuffer) => {
  try {
    console.log("✓ Trying OCR with tesseract.js...");
    
    // Load PDF using pdfjs-dist
    const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const pageCount = pdf.numPages;
    console.log(`✓ PDF has ${pageCount} pages, processing for OCR...`);
    
    let allText = "";
    const worker = await createWorker('eng');
    
    // Process each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      console.log(`  - Processing page ${pageNum}/${pageCount}...`);
      
      // Get page
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Create canvas
      const canvas = require('canvas');
      const canvasElement = canvas.createCanvas(viewport.width, viewport.height);
      const context = canvasElement.getContext('2d');
      
      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to buffer
      const imageBuffer = canvasElement.toBuffer('image/png');
      
      // Run OCR on the image
      const result = await worker.recognize(imageBuffer);
      allText += result.data.text + "\n";
    }
    
    await worker.terminate();
    console.log(`✓ OCR completed, extracted ${allText.length} characters`);
    return allText;
  } catch (ocrError) {
    console.error("✗ OCR Error:", ocrError.message);
    return "";
  }
};

export const extractTextFromPDF = async (fileBuffer) => {
  let extractedContent = {
    text: "",
    imageDescriptions: []
  };

  try {
    // Validate buffer
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      console.log("Error: File buffer is missing or invalid.");
      return extractedContent;
    }

    // Step 1: Extract text using pdf-parse
    console.log("✓ Step 1: Extracting text from PDF...");
    const data = await new PDFParse(fileBuffer);
    
    extractedContent.text = data?.text || "";
    console.log(`✓ Extracted text length: ${extractedContent.text.length} characters`);

    // Step 2: Get page count
    const pageCount = data?.numpages || 1;
    console.log(`✓ Total pages in PDF: ${pageCount}`);

    // Step 3: If text is too short, try OCR
    if (extractedContent.text.length < 50) {
      console.log("✓ Step 2: Text too short, trying OCR...");
      const ocrText = await extractTextUsingOCR(fileBuffer);
      
      if (ocrText && ocrText.length > 50) {
        extractedContent.text = ocrText;
        console.log(`✓ OCR extracted text length: ${extractedContent.text.length} characters`);
      } else {
        console.log("✓ Step 3: OCR also failed, marking as minimal text");
        extractedContent.imageDescriptions.push({
          page: "all",
          description: "This PDF contains minimal extractable text. It may be an image file or have encoded content."
        });
      }
    }

    return extractedContent;
  } catch (error) {
    console.error("✗ Error extracting PDF content:", error.message);
    return extractedContent;
  }
};