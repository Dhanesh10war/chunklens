import { useState, useCallback } from 'react';
import { useToast } from '../components/ui/Toast';
import {
  detectFileFormat,
  isPdfBuffer,
  DetectedFormatInfo,
} from '../utils/fileFormatDetector';

export interface UploadErrorInfo {
  failedFilename: string;
  reason: string;
  retainedDocTitle?: string;
  technicalDetail?: string;
  category:
    | 'oversize'
    | 'empty'
    | 'unsupported'
    | 'password'
    | 'invalid'
    | 'missing'
    | 'scanned_empty'
    | 'unknown';
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

export const SUPPORTED_EXTENSIONS = new Set([
  '.pdf',
  '.md',
  '.markdown',
  '.csv',
  '.tsv',
  '.json',
  '.txt',
  '.py',
  '.ts',
  '.js',
  '.tsx',
  '.jsx',
  '.html',
  '.css',
  '.yaml',
  '.yml',
  '.xml',
  '.sql',
]);

export interface ProcessDocumentOptions {
  currentDocumentTitle?: string;
  onSuccess: (content: string, filename: string, formatInfo: DetectedFormatInfo) => void;
  onError: (error: UploadErrorInfo) => void;
  onPdfExtractStart?: () => void;
  onPdfExtractEnd?: () => void;
}

/**
 * Pure document validation and parsing engine.
 * Handles size checks, format detection, buffer cloning, PDF extraction, and strict exception categorization.
 */
export async function validateAndProcessDocumentFile(
  file: File,
  options: ProcessDocumentOptions
): Promise<boolean> {
  const filename = file.name;
  const retainedTitle = options.currentDocumentTitle || 'current document';

  // 1. Check for 0-byte file
  if (file.size === 0) {
    const errorInfo: UploadErrorInfo = {
      failedFilename: filename,
      reason: 'Uploaded file is empty (0 bytes).',
      retainedDocTitle: retainedTitle,
      category: 'empty',
    };
    options.onError(errorInfo);
    return false;
  }

  // 2. Enforce 10MB limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const errorInfo: UploadErrorInfo = {
      failedFilename: filename,
      reason: `File exceeds 10 MB limit (${sizeMb} MB).`,
      retainedDocTitle: retainedTitle,
      category: 'oversize',
    };
    options.onError(errorInfo);
    return false;
  }

  // 3. Check for supported extension/format
  const extMatch = filename.match(/\.[0-9a-z]+$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';
  if (ext && !SUPPORTED_EXTENSIONS.has(ext)) {
    const errorInfo: UploadErrorInfo = {
      failedFilename: filename,
      reason: `File format "${ext}" is not supported. Supported: .pdf, .md, .csv, .json, .txt, .py, .ts, .js.`,
      retainedDocTitle: retainedTitle,
      category: 'unsupported',
    };
    options.onError(errorInfo);
    return false;
  }

  try {
    const buffer = await file.arrayBuffer();

    // Safe PDF detection (clone slice so buffer is never detached)
    const isPdf = ext === '.pdf' || isPdfBuffer(buffer.slice(0));

    if (isPdf) {
      options.onPdfExtractStart?.();
      try {
        const { extractTextFromPdf } = await import('../utils/pdfParser');
        const result = await extractTextFromPdf(buffer.slice(0));

        if (!result.text.trim()) {
          const errorInfo: UploadErrorInfo = {
            failedFilename: filename,
            reason: 'No readable text found. Document may be a scanned image or empty.',
            retainedDocTitle: retainedTitle,
            category: 'scanned_empty',
          };
          options.onError(errorInfo);
          return false;
        }

        const formatInfo: DetectedFormatInfo = {
          formatId: 'pdf',
          label: 'PDF Document',
          badge: 'PDF',
          extension: ext || '.pdf',
          recommendedStrategy: 'recursive',
          confidence: 'high',
          description: `Extracted ${result.pageCount} pages with structural page markers.`,
        };

        options.onSuccess(result.text, filename, formatInfo);
        return true;
      } catch (pdfErr: any) {
        const msg = pdfErr?.message || String(pdfErr);
        const errName = pdfErr?.name || '';

        let category: UploadErrorInfo['category'] = 'unknown';
        let reason = '';
        let technicalDetail: string | undefined = undefined;

        if (errName === 'PasswordException' || msg.toLowerCase().includes('password')) {
          category = 'password';
          reason = 'PDF is password-protected. ChunkLens only processes unencrypted documents.';
        } else if (errName === 'InvalidPDFException' || msg.toLowerCase().includes('invalid pdf')) {
          category = 'invalid';
          reason = 'Invalid PDF format: File structure is malformed.';
        } else if (
          errName === 'MissingPDFException' ||
          msg.toLowerCase().includes('incomplete') ||
          msg.toLowerCase().includes('missing')
        ) {
          category = 'missing';
          reason = 'Incomplete PDF: File appears truncated or missing required data.';
        } else {
          // Explicit requirement: Never label unknown failures as "corrupt"
          category = 'unknown';
          reason = `Unexpected error reading "${filename}".`;
          technicalDetail = msg;
        }

        const errorInfo: UploadErrorInfo = {
          failedFilename: filename,
          reason,
          retainedDocTitle: retainedTitle,
          technicalDetail,
          category,
        };
        options.onError(errorInfo);
        return false;
      } finally {
        options.onPdfExtractEnd?.();
      }
    }

    // Standard text decoding for non-PDF documents
    const content = new TextDecoder('utf-8').decode(buffer);
    if (!content || !content.trim()) {
      const errorInfo: UploadErrorInfo = {
        failedFilename: filename,
        reason: 'Uploaded file contains no readable text.',
        retainedDocTitle: retainedTitle,
        category: 'empty',
      };
      options.onError(errorInfo);
      return false;
    }

    const formatInfo = detectFileFormat(filename, content);
    options.onSuccess(content, filename, formatInfo);
    return true;
  } catch (err: any) {
    const msg = err?.message || String(err);
    const errorInfo: UploadErrorInfo = {
      failedFilename: filename,
      reason: `Unexpected error reading "${filename}".`,
      technicalDetail: msg,
      retainedDocTitle: retainedTitle,
      category: 'unknown',
    };
    options.onError(errorInfo);
    return false;
  }
}

interface UseDocumentUploadOptions {
  onSuccess: (content: string, filename: string, formatInfo: DetectedFormatInfo) => void;
  currentDocumentTitle?: string;
}

export function useDocumentUpload({
  onSuccess,
  currentDocumentTitle,
}: UseDocumentUploadOptions) {
  const [uploadError, setUploadError] = useState<UploadErrorInfo | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  const clearError = useCallback(() => {
    setUploadError(null);
  }, []);

  const processFile = useCallback(
    async (file: File): Promise<boolean> => {
      // Auto-clear prior errors upon new file upload attempt
      clearError();

      return validateAndProcessDocumentFile(file, {
        currentDocumentTitle,
        onPdfExtractStart: () => setIsExtractingPdf(true),
        onPdfExtractEnd: () => setIsExtractingPdf(false),
        onSuccess: (content, filename, formatInfo) => {
          setUploadError(null);
          onSuccess(content, filename, formatInfo);
          toastSuccess(
            `Format Recognized: ${formatInfo.label}`,
            `Detected [${formatInfo.badge}]. Recommending ${formatInfo.recommendedStrategy} chunking.`
          );
        },
        onError: (err) => {
          setUploadError(err);
          toastError(
            err.category === 'password'
              ? 'PDF Encrypted'
              : err.category === 'invalid'
              ? 'Invalid PDF'
              : err.category === 'missing'
              ? 'Incomplete PDF'
              : err.category === 'oversize'
              ? 'File Oversize'
              : err.category === 'empty'
              ? 'Empty File'
              : 'Upload Error',
            err.reason
          );
        },
      });
    },
    [clearError, currentDocumentTitle, onSuccess, toastError, toastSuccess]
  );

  return {
    uploadError,
    clearError,
    isExtractingPdf,
    processFile,
  };
}
