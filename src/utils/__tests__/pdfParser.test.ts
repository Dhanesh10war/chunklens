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
});
