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
  if (!data || data.byteLength === 0) {
    throw new Error('Uploaded PDF document is empty (0 bytes).');
  }

  // Dynamically import legacy build for universal browser & Node test compatibility
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const lib = pdfjs.GlobalWorkerOptions ? pdfjs : ((pdfjs as any).default || pdfjs);
  if (typeof window !== 'undefined' && lib.GlobalWorkerOptions) {
    if (!lib.GlobalWorkerOptions.workerSrc) {
      lib.GlobalWorkerOptions.workerSrc =
        pdfWorkerUrl ||
        new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
    }
  }

  const getDoc = lib.getDocument || pdfjs.getDocument;

  // Always copy bytes to an isolated Uint8Array so worker transfer never detaches caller's buffer
  const sourceBytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const clonedBytes = new Uint8Array(sourceBytes.length);
  clonedBytes.set(sourceBytes);

  const loadingTask = getDoc({
    data: clonedBytes,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  let pdfDocument: any;
  try {
    pdfDocument = await loadingTask.promise;
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
  } catch (err: any) {
    const msg = err?.message || String(err);
    const errName = err?.name || '';

    if (errName === 'PasswordException' || msg.toLowerCase().includes('password')) {
      const error = new Error('PDF is password-protected. ChunkLens only processes unencrypted documents.');
      error.name = 'PasswordException';
      throw error;
    }

    if (errName === 'InvalidPDFException' || msg.toLowerCase().includes('invalid pdf')) {
      const error = new Error('Invalid PDF format: File structure is malformed.');
      error.name = 'InvalidPDFException';
      throw error;
    }

    if (
      errName === 'MissingPDFException' ||
      msg.toLowerCase().includes('missing pdf') ||
      msg.toLowerCase().includes('unexpected end')
    ) {
      const error = new Error('Incomplete PDF: File appears truncated or missing required data.');
      error.name = 'MissingPDFException';
      throw error;
    }

    // Never label an unknown failure as "corrupt"
    const error = new Error(`Unexpected error reading PDF: ${msg}`);
    error.name = 'UnexpectedPDFError';
    (error as any).technicalDetail = msg;
    throw error;
  } finally {
    try {
      if (pdfDocument) {
        await pdfDocument.destroy();
      } else {
        await loadingTask.destroy();
      }
    } catch {
      // Safe teardown
    }
  }
}
