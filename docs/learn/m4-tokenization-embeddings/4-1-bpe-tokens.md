# Characters vs Bytes vs BPE Tokens

<!-- claim: [STANDARD KNOWLEDGE] Large language models process text as discrete subword tokens produced by Byte-Pair Encoding rather than raw characters. -->
:::callout[note]{title="TL;DR"}
Large language models do not read characters, syllables, or words. They operate on integer token IDs produced by statistical compression algorithms like Byte-Pair Encoding (BPE). Because token boundaries depend on vocabulary frequency rather than character length, a 500-character chunk can represent anywhere from 90 tokens to 450 tokens. Calibrating chunk sizes in raw characters is the leading cause of silent embedding truncation.
:::

## The Three Layers of Text Representation

When text enters a RAG ingestion engine, it exists at three distinct abstraction levels:

```
1. Characters (Graphemes)   :  "R"    "e"    "t"    "r"    "i"    "e"    "v"    "a"    "l"
                               │      │      │      │      │      │      │      │      │
2. Raw Bytes (UTF-8)        : 0x52   0x65   0x74   0x72   0x69   0x65   0x76   0x61   0x6C
                               └──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
3. Subword BPE Token        : Token ID 41285 ("Retrieval")
```

1. **Characters**: Human-readable symbols. Variable in byte length (1 byte for ASCII `A`, 2 bytes for `é`, 3 bytes for `日`, 4 bytes for `🚀`).
2. **Bytes**: The underlying 8-bit integers stored in memory or disk.
3. **BPE Tokens**: Variable-length subword chunks created by merging frequent byte pairs during tokenizer training.

---

## How Byte-Pair Encoding (BPE) Works

BPE was originally invented as a data compression algorithm (Gage, 1994) before being adapted for neural language models (Sennrich et al., 2016).

<!-- claim: [ACADEMIC CITATION] Sennrich et al. (2016) adapted Byte-Pair Encoding for neural networks to handle open-vocabulary subwords through iterative frequency merging. -->
The training process works iteratively:
1. Start with an atomic vocabulary of raw bytes ($0 - 255$).
2. Scan the training corpus and count every adjacent pair of symbols.
3. Merge the most frequent pair into a new subword symbol (e.g., `'t'` + `'h'` $\rightarrow$ `'th'`).
4. Repeat this merge step tens of thousands of times until reaching a target vocabulary size (e.g., 100,000 ranks in `cl100k_base`).

### Inference: The Greedy Merge Cascade
When text is encoded at runtime:
- Common English words (`" the"`, `" agreement"`, `" system"`) merge into single tokens.
- Rare or compound words (`" anti"`, `" gravity"`) split into two subwords.
- Technical syntax and code (`"def"`, `" auth"`, `"_"`, `"user"`) split along punctuation and camelCase/snake_case boundaries.

---

## Why Character Counts Lie: The Ratio Variance

Because BPE relies on frequency statistics, the **characters-per-token ratio** fluctuates wildly depending on language, formatting, and domain:

| Domain / Syntax | Sample Input | Characters | Tokens | Chars / Token |
| :--- | :--- | :--- | :--- | :--- |
| Standard English | "The company entered into a mutual agreement." | 45 | 8 | **5.62** |
| Technical Code | `res = await fetch(url, { headers });` | 38 | 12 | **3.16** |
| Indented JSON | `{"retention_days": 365, "active": true}` | 41 | 14 | **2.92** |
| Multilingual (Japanese) | "文書をチャンクに分割する" | 13 | 11 | **1.18** |
| Whitespace / Spaces | `"          "` (10 spaces) | 10 | 2 | **5.00** |

:::compare{left="The Character Counter Trap" right="Exact BPE Token Accounting"}
**Slicing by `chunk_size = 1,000` characters:**
- English article: Yields ~180 tokens (under-utilizes prompt budget by 50%).
- Python backend script: Yields ~380 tokens.
- Indented API payload: Yields ~460 tokens.
- Japanese contract: Yields ~850 tokens (**exceeds 512-token embedding ceiling**).
===
**Slicing by `chunk_size = 400` BPE tokens:**
Every partition contains an exact, deterministic quantity of information regardless of whether the document is code, JSON, English, or German.
:::

In ChunkLens, token counting is performed using real in-memory BPE encoding tables rather than character estimations, guaranteeing that token ceilings are never breached.

:::tryit[academic-paper]{strategy="recursive" chunkSize="400" chunkOverlap="40"}
:::

---

## Test Your Understanding

:::quiz[quiz-4-1]{}
:::

---

## Key Takeaways

- **LLMs read BPE tokens, not characters**: Token boundaries depend on vocabulary merge statistics.
- **Ratios vary from 1.0 to 6.0 chars/token**: English prose compresses efficiently; code, JSON, and non-Latin scripts require significantly more tokens per character.
- **Character sizing causes silent truncation**: Sizing chunks in raw characters risks overflowing embedding model positional context limits.
- **Calibrate in BPE tokens**: Always measure and enforce chunk limits using real tokenizer encoding tables.
