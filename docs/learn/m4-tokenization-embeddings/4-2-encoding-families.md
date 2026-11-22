# Frontier Tokenizer Encodings (o200k vs cl100k)

<!-- claim: [STANDARD KNOWLEDGE] Frontier tokenizer encodings with expanded vocabularies achieve higher subword compression ratios across multilingual text and code. -->
:::callout[note]{title="TL;DR"}
Tokenizers have evolved alongside model generations. Expanding vocabulary size from 100,000 tokens (`cl100k_base` in GPT-4) to 200,000 tokens (`o200k_base` in GPT-4o) significantly improves compression efficiency—yielding up to 30% fewer tokens on technical code and 50% fewer tokens on non-Latin scripts. Understanding these differences prevents misalignment between chunking budgets and embedding ceilings.
:::

## The Evolution of Frontier Tokenizers

The history of Byte-Pair Encoding reflects a continuous push to balance vocabulary size against subword compression efficiency:

```
┌────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  r50k / p50k       │ ──▶ │  cl100k_base        │ ──▶ │  o200k_base         │
│  (GPT-3 / Codex)   │     │  (GPT-4 / Ada-002)  │     │  (GPT-4o)           │
│  Vocab: 50,257     │     │  Vocab: 100,277     │     │  Vocab: 200,000     │
└────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

Each doubling of vocabulary size allows the tokenizer to assign single, dedicated integer tokens to more complex words, technical phrases, and non-English scripts.

---

## Architectural Comparison: o200k vs. cl100k

<!-- claim: [CHUNKLENS BEHAVIOR VERIFIED] o200k_base encodes identical source text into fewer tokens than cl100k_base, particularly for non-Latin alphabets and code syntax. -->
| Feature | `cl100k_base` (GPT-4 / Embeddings) | `o200k_base` (GPT-4o) | Compression Delta |
| :--- | :--- | :--- | :--- |
| **Vocabulary Size** | 100,277 ranks | 200,000 ranks | $+99.4\%$ vocabulary capacity |
| **Standard English Prose** | ~1.00x baseline | ~0.95x | $5\%$ token reduction |
| **Python / TypeScript Code** | ~1.00x baseline | ~0.80x | $20\%$ token reduction |
| **CJK (Chinese / Japanese / Korean)** | ~1.00x baseline | ~0.65x | $35\%$ token reduction |
| **Arabic / Devanagari / Cyrillic** | ~1.00x baseline | ~0.50x | $50\%$ token reduction |

### Why This Matters for RAG Pipelines:
Many developers configure chunkers using the new `o200k_base` tokenizer, but index those chunks into embedding models (such as `text-embedding-3-small`) that still rely on `cl100k_base`!

```
[Document Chunk] ──▶ Evaluated with o200k: 500 tokens (Under 512 budget)
                           │
                           ▼
[text-embedding-3] ──▶ Evaluated with cl100k: 585 tokens (OVERFLOW: TRUNCATED!)
```

If your chunker evaluates size using `o200k_base`, but your embedding model runs on `cl100k_base`, a chunk that looked safe at 500 tokens will expand to nearly 600 tokens during embedding, causing silent truncation of the trailing text!

---

## The Non-Latin Language Tax

In older tokenizers with smaller vocabularies (`r50k` and `cl100k`), the merge table was overwhelmingly biased toward English words. Non-Latin characters (such as Hindi, Arabic, or Chinese) frequently had no subword merges, forcing the tokenizer to encode words character-by-character or byte-by-byte:

:::compare{left="Legacy Tokenization (cl100k_base)" right="Frontier Tokenization (o200k_base)"}
**Devanagari phrase: "कृत्रिम बुद्धिमत्ता"**
- Encoded into **18 tokens** in `cl100k_base`.
- Severe economic and latency penalty for non-English users.
===
**Devanagari phrase: "कृत्रिम बुद्धिमत्ता"**
- Encoded into **6 tokens** in `o200k_base`.
- $66\%$ reduction in token volume; matches English semantic density.
:::

---

## Tokenizer Calibration in ChunkLens

ChunkLens provides a **Tokenizer Comparison Matrix** in the top navigation bar. With one click, you can audit your current document across:
- `cl100k_base` (text-embedding-3, GPT-4)
- `o200k_base` (GPT-4o)
- Estimated Anthropic Claude BPE
- Estimated Meta Llama 3 BPE
- Estimated Google Gemini SentencePiece

This prevents token-mismatch surprises before writing vectors to production databases.

:::tryit[developer-guide]{strategy="recursive" chunkSize="450" chunkOverlap="45"}
:::

---

## Test Your Understanding

:::quiz[quiz-4-2]{}
:::

---

## Key Takeaways

- **Vocabulary expansion boosts compression**: Doubling vocabulary to 200k ranks reduces token counts significantly.
- **Watch out for cross-tokenizer mismatch**: Never calibrate chunk budgets with `o200k_base` if your embedding model uses `cl100k_base`.
- **Multilingual gains are dramatic**: Non-Latin scripts see up to a 50% drop in token counts under frontier encodings.
- **Audit tokenizer divergence**: Always verify the exact encoding used by your specific downstream embedding model.
