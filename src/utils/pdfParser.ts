/**
 * Client-Side PDF Text Extractor
 * Extracts text from PDF documents entirely within the browser runtime with zero server transmission.
 */

import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

export interface PdfParseResult {
  text: string;
  pageCount: number;
}

/**
 * Parses an ArrayBuffer or Uint8Array representing a PDF and returns extracted text by page.
 * Attaches page boundary headers (e.g. --- Page 1 ---) to preserve document structure for RAG chunking.
 */
export async function extractTextFromPdf(data: ArrayBuffer | Uint8Array): Promise<PdfParseResult> {
  // Dynamically import legacy build for universal browser & Node test compatibility
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl || `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  }

  const uint8 = data instanceof Uint8Array ? data : new Uint8Array(data);

  const loadingTask = pdfjs.getDocument({
    data: uint8,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdfDocument = await loadingTask.promise;
  const pageCount = pdfDocument.numPages;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items = textContent.items as Array<{ str?: string; hasEOL?: boolean }>;
    let pageStr = '';

    for (const item of items) {
      if (typeof item.str === 'string') {
        pageStr += item.str + (item.hasEOL ? '\n' : ' ');
      }
    }

    const cleanPage = pageStr.trim();
    if (cleanPage.length > 0) {
      pageTexts.push(`--- Page ${pageNum} ---\n${cleanPage}`);
    }
  }

  const combinedText = pageTexts.join('\n\n');
  return {
    text: combinedText,
    pageCount,
  };
}
