import { describe, it, expect } from 'vitest';
import { extractTextFromPdf } from '../pdfParser';

/**
 * Creates a minimal valid PDF binary with exact byte offsets for xref table.
 */
function createSyntheticPdf(text: string): Uint8Array {
  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
  const streamData = `BT\n/F1 12 Tf\n72 712 Td\n(${text}) Tj\nET\n`;
  const streamLength = Buffer.byteLength(streamData);
  const obj5 = `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamData}endstream\nendobj\n`;

  const offset1 = Buffer.byteLength(header);
  const offset2 = offset1 + Buffer.byteLength(obj1);
  const offset3 = offset2 + Buffer.byteLength(obj2);
  const offset4 = offset3 + Buffer.byteLength(obj3);
  const offset5 = offset4 + Buffer.byteLength(obj4);
  const xrefOffset = offset5 + Buffer.byteLength(obj5);

  const pad = (n: number) => String(n).padStart(10, '0');

  const xref = `xref
0 6
0000000000 65535 f \r
${pad(offset1)} 00000 n \r
${pad(offset2)} 00000 n \r
${pad(offset3)} 00000 n \r
${pad(offset4)} 00000 n \r
${pad(offset5)} 00000 n \r
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF
`;

  const fullPdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref;
  return new Uint8Array(Buffer.from(fullPdf, 'utf8'));
}

describe('extractTextFromPdf', () => {
  it('extracts text and page count from a valid PDF binary', async () => {
    const pdfBytes = createSyntheticPdf('Retrieval Augmented Generation with ChunkLens');
    const result = await extractTextFromPdf(pdfBytes);

    expect(result.pageCount).toBe(1);
    expect(result.text).toContain('--- Page 1 ---');
    expect(result.text).toContain('Retrieval Augmented Generation with ChunkLens');
  });

  it('handles multi-word and technical terms in PDF content', async () => {
    const pdfBytes = createSyntheticPdf('Vector embeddings, cosine similarity, and semantic search.');
    const result = await extractTextFromPdf(pdfBytes);

    expect(result.pageCount).toBe(1);
    expect(result.text).toContain('Vector embeddings, cosine similarity, and semantic search.');
  });

  it('returns empty text when PDF contains no text items', async () => {
    const emptyPdfBytes = createSyntheticPdf('');
    const result = await extractTextFromPdf(emptyPdfBytes);

    expect(result.pageCount).toBe(1);
    expect(result.text).toBe('');
  });

  // --- REGRESSION TESTS FOR DETACHED ARRAYBUFFER FIX ---
  it('does not detach caller ArrayBuffer during PDF extraction', async () => {
    const pdfBytes = createSyntheticPdf('Cloned ArrayBuffer preservation check');
    const rawBuffer = pdfBytes.slice().buffer as ArrayBuffer;

    const result = await extractTextFromPdf(rawBuffer);
    expect(result.text).toContain('Cloned ArrayBuffer preservation check');

    // Verify rawBuffer was not detached by pdf.js worker transfer
    expect(rawBuffer.byteLength).toBeGreaterThan(0);
    expect(() => new Uint8Array(rawBuffer)).not.toThrow();
  });

  it('allows extracting text from the same ArrayBuffer instance multiple times sequentially', async () => {
    const pdfBytes = createSyntheticPdf('Sequential extraction idempotency check');
    const rawBuffer = pdfBytes.slice().buffer as ArrayBuffer;

    // Run 1
    const res1 = await extractTextFromPdf(rawBuffer);
    expect(res1.text).toContain('Sequential extraction idempotency check');
    expect(rawBuffer.byteLength).toBeGreaterThan(0);

    // Run 2 on the SAME buffer - must not throw "Cannot perform Construct on a detached ArrayBuffer"
    const res2 = await extractTextFromPdf(rawBuffer);
    expect(res2.text).toContain('Sequential extraction idempotency check');
    expect(rawBuffer.byteLength).toBeGreaterThan(0);
  });

  it('allows extracting text from the same Uint8Array instance multiple times', async () => {
    const pdfBytes = createSyntheticPdf('Uint8Array reuse test');

    const res1 = await extractTextFromPdf(pdfBytes);
    expect(res1.text).toContain('Uint8Array reuse test');
    expect(pdfBytes.buffer.byteLength).toBeGreaterThan(0);

    const res2 = await extractTextFromPdf(pdfBytes);
    expect(res2.text).toContain('Uint8Array reuse test');
    expect(pdfBytes.buffer.byteLength).toBeGreaterThan(0);
  });

  // --- EXCEPTION CLASSIFICATION TESTS ---
  it('classifies malformed PDF bytes as InvalidPDFException', async () => {
    const malformedBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x99, 0x88, 0x77]);
    await expect(extractTextFromPdf(malformedBytes)).rejects.toThrow(/Invalid PDF/);
  });

  it('rejects 0-byte buffer with explicit empty error', async () => {
    const emptyBuffer = new ArrayBuffer(0);
    await expect(extractTextFromPdf(emptyBuffer)).rejects.toThrow(/empty \(0 bytes\)/);
  });
});
