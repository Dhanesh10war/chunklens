# PDFs, Columns & Visual Layouts

<!-- claim: [STANDARD KNOWLEDGE] PDF documents store visual placement coordinates rather than sequential semantic text flows. -->
:::callout[note]{title="TL;DR"}
PDF is the most common enterprise document format and the most dangerous for RAG. Unlike Markdown or HTML, a PDF does not store paragraphs or semantic tags—it stores independent character glyphs placed at precise $(x, y)$ coordinate positions on a visual page canvas. Extracting text naively from multi-column PDFs interleaves unrelated columns, injects repetitive running headers into every chunk, and creates broken hyphenated tokens that sabotage vector retrieval.
:::

## The PDF Coordinate Illusion

When humans view a two-column research paper or financial statement, our visual cortex naturally parses the left column from top to bottom before moving to the right column:

```
Visual Layout (Human Reading Order):
┌─────────────────────────┬─────────────────────────┐
│ Column 1                │ Column 2                │
│ (1) In this study, we   │ (4) Furthermore, the    │
│ (2) evaluate five dense │ (5) latency overhead of │
│ (3) embedding models.   │ (6) subword tokenizers. │
└─────────────────────────┴─────────────────────────┘

Naive Left-to-Right Extraction (Corrupted Text):
"In this study, we Furthermore, the evaluate five dense latency overhead of embedding models. subword tokenizers."
```

If a PDF extractor processes text purely by vertical $y$-coordinates across the full page width, it interleaves lines from both columns horizontally. The resulting text is grammatical gibberish that yields meaningless vector embeddings and guarantees retrieval failure.

---

## The Three Primary PDF Extraction Hazards

<!-- claim: [STANDARD KNOWLEDGE] Multi-column layouts, repeated headers/footers, and line-break hyphens are the primary sources of text corruption in PDF parsing. -->
### 1. Multi-Column Scrambling
**Problem**: Text from parallel columns is merged line-by-line.
**Remedy**: Modern document parsing algorithms perform spatial clustering using bounding box coordinates, detecting column gutters ($x$-spacing) to reconstruct the correct sequential reading flow before generating chunks.

### 2. Running Header and Footer Pollution
**Problem**: Every printed page typically contains:
- Top: Document Title, Chapter Name, Confidentiality Markings.
- Bottom: Page Numbers, Copyright Notices, Date Stamps.
When extracted into raw text streams, these lines appear repeatedly every 200–500 words. When chunked, they dilute vector embeddings with repetitive boilerplate phrases (e.g. *"Confidential - Do Not Distribute - Page 14"*).
**Remedy**: Strip repetitive marginal text by identifying strings that appear in identical vertical coordinate bands across multiple sequential pages.

### 3. Broken Hyphenation Across Line Breaks
**Problem**: Typesetting engines insert hyphens to justify text:
`"The primary trans-"` (end of line 1)
`"action was verified."` (start of line 2)
If extracted literally as `"trans- action"`, tokenizer BPE encoders split this into two separate, unrelated tokens rather than the unified word `"transaction"`.
**Remedy**: Apply deterministic de-hyphenation regexes that rejoin lowercase word continuations across single line breaks.

---

## Client-Side In-Browser PDF Parsing in ChunkLens

To preserve user privacy and maintain a strict zero-egress architecture, ChunkLens performs PDF extraction directly in your browser:
- PDF byte streams are processed inside an isolated WebAssembly Web Worker using a customized PDF.js extraction engine.
- Glyph coordinates are parsed in-memory, reconstructing paragraph flow and stripping header margins before chunking occurs.
- No document bytes or extracted text strings are ever transmitted over the network.

:::tryit[academic-paper]{strategy="recursive" chunkSize="512" chunkOverlap="50"}
:::

---

## Test Your Understanding

:::quiz[quiz-2-2]{}
:::

---

## Key Takeaways

- **PDFs are coordinate graphs, not text files**: Text extraction must reconstruct visual reading order from $(x, y)$ bounding boxes.
- **Beware of column interleaving**: Multi-column documents require gutter detection to avoid merging parallel columns into word salad.
- **Filter running headers and footers**: Deduplicate or strip marginal headers and page numbers to prevent vector pollution.
- **De-hyphenate line breaks**: Reconnect severed words before passing text to subword tokenizers.
- **Client-side parsing preserves privacy**: In-browser WebAssembly extraction allows auditing confidential PDFs without remote server exposure.
