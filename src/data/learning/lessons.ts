import lesson0_1 from '../../../docs/learn/m0-quickstart/0-1-mental-model.md?raw';
import lesson0_2 from '../../../docs/learn/m0-quickstart/0-2-first-eval.md?raw';
import lesson1_1 from '../../../docs/learn/m1-rag-foundations/1-1-what-is-rag.md?raw';
import lesson1_2 from '../../../docs/learn/m1-rag-foundations/1-2-failure-modes.md?raw';
import lesson1_3 from '../../../docs/learn/m1-rag-foundations/1-3-rag-triad.md?raw';
import lesson2_1 from '../../../docs/learn/m2-document-ingestion/2-1-plain-text-markdown.md?raw';
import lesson2_2 from '../../../docs/learn/m2-document-ingestion/2-2-pdfs-layouts.md?raw';
import lesson2_3 from '../../../docs/learn/m2-document-ingestion/2-3-tables-csv.md?raw';
import lesson2_4 from '../../../docs/learn/m2-document-ingestion/2-4-code-semistructured.md?raw';
import lesson3_1 from '../../../docs/learn/m3-chunking-fundamentals/3-1-why-chunking-matters.md?raw';
import lesson3_2 from '../../../docs/learn/m3-chunking-fundamentals/3-2-the-size-trade-off.md?raw';
import lesson3_3 from '../../../docs/learn/m3-chunking-fundamentals/3-3-overlap-context-cliffs.md?raw';
import lesson3_4 from '../../../docs/learn/m3-chunking-fundamentals/3-4-core-strategies.md?raw';
import lesson4_1 from '../../../docs/learn/m4-tokenization-embeddings/4-1-bpe-tokens.md?raw';
import lesson4_2 from '../../../docs/learn/m4-tokenization-embeddings/4-2-encoding-families.md?raw';
import lesson4_3 from '../../../docs/learn/m4-tokenization-embeddings/4-3-embeddings-geometry.md?raw';
import lesson4_4 from '../../../docs/learn/m4-tokenization-embeddings/4-4-distance-metrics.md?raw';
import lesson5_1 from '../../../docs/learn/m5-advanced-architectures/5-1-parent-child.md?raw';
import lesson5_2 from '../../../docs/learn/m5-advanced-architectures/5-2-context-enrichment.md?raw';
import lesson5_3 from '../../../docs/learn/m5-advanced-architectures/5-3-semantic-chunking.md?raw';
import lesson6_1 from '../../../docs/learn/m6-retrieval-reranking/6-1-dense-vs-sparse.md?raw';
import lesson6_2 from '../../../docs/learn/m6-retrieval-reranking/6-2-hybrid-rrf.md?raw';
import lesson6_3 from '../../../docs/learn/m6-retrieval-reranking/6-3-cross-encoders.md?raw';
import lesson7_1 from '../../../docs/learn/m7-evaluation-optimization/7-1-heatmap-interpretation.md?raw';
import lesson7_2 from '../../../docs/learn/m7-evaluation-optimization/7-2-detecting-bloat.md?raw';
import lesson7_3 from '../../../docs/learn/m7-evaluation-optimization/7-3-chunk-utilization.md?raw';
import lesson8_1 from '../../../docs/learn/m8-production-playbooks/8-1-legal-compliance.md?raw';
import lesson8_2 from '../../../docs/learn/m8-production-playbooks/8-2-tech-docs.md?raw';
import lesson8_3 from '../../../docs/learn/m8-production-playbooks/8-3-financial-filings.md?raw';

export const LESSON_CONTENT: Record<string, string> = {
  '0-1-mental-model': lesson0_1,
  '0-2-first-eval': lesson0_2,
  '1-1-what-is-rag': lesson1_1,
  '1-2-failure-modes': lesson1_2,
  '1-3-rag-triad': lesson1_3,
  '2-1-plain-text-markdown': lesson2_1,
  '2-2-pdfs-layouts': lesson2_2,
  '2-3-tables-csv': lesson2_3,
  '2-4-code-semistructured': lesson2_4,
  '3-1-why-chunking-matters': lesson3_1,
  '3-2-the-size-trade-off': lesson3_2,
  '3-3-overlap-context-cliffs': lesson3_3,
  '3-4-core-strategies': lesson3_4,
  '4-1-bpe-tokens': lesson4_1,
  '4-2-encoding-families': lesson4_2,
  '4-3-embeddings-geometry': lesson4_3,
  '4-4-distance-metrics': lesson4_4,
  '5-1-parent-child': lesson5_1,
  '5-2-context-enrichment': lesson5_2,
  '5-3-semantic-chunking': lesson5_3,
  '6-1-dense-vs-sparse': lesson6_1,
  '6-2-hybrid-rrf': lesson6_2,
  '6-3-cross-encoders': lesson6_3,
  '7-1-heatmap-interpretation': lesson7_1,
  '7-2-detecting-bloat': lesson7_2,
  '7-3-chunk-utilization': lesson7_3,
  '8-1-legal-compliance': lesson8_1,
  '8-2-tech-docs': lesson8_2,
  '8-3-financial-filings': lesson8_3,
};

export function getLessonMarkdown(slug: string): string | undefined {
  return LESSON_CONTENT[slug];
}
