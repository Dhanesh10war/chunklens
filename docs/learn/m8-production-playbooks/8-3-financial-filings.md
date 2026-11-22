# Financial Filings (10-K, 10-Q & Balance Sheets)

<!-- claim: [STANDARD KNOWLEDGE] Financial filing chunking requires table header persistence, fiscal year alignment, and unit-of-measure preservation to prevent numeric hallucination. -->
:::callout[note]{title="TL;DR"}
Financial filings like SEC Forms 10-K and 10-Q are dense with multi-column financial statements, comparative quarterly tables, and critical footnotes. When standard text splitters partition a balance sheet midway, the bottom half of the table loses its fiscal year headers, column classifications, and currency units. To prevent severe numeric hallucinations, financial RAG requires table-aware chunking that glues column headers and reporting units to every partition.
:::

## The Anatomy of Financial Statements

In an SEC filing, numerical values derive their entire factual meaning from their row label, column header, and reporting denomination:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Consolidated Statements of Income                      │
│                  (In millions, except per share data)                       │
│                                                                             │
│                                       Three Months Ended September 30,      │
│                                            2024              2023           │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Revenue:                                                                   │
│    Products                             $ 42,150          $ 38,920          │
│    Services                               21,800            18,450          │
│  Total revenue                            63,950            57,370          │
│  ─────────────────────────────────────────────────────────────────────────  │
│  [Arbitrary Chunk Boundary Cut Here]                                        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Cost of revenue:                                                           │
│    Products                               24,100            22,300          │
│    Services                                7,850             6,900          │
│  Operating income                       $ 18,200          $ 15,120          │
└─────────────────────────────────────────────────────────────────────────────┘
```

If an ingestion pipeline cuts across this table at the indicated boundary:
1. **Lost Temporal Grounding**: The second chunk contains `$18,200` and `$15,120`. Which year is which? Without the column header, the vector search engine cannot discern 2024 from 2023.
2. **Lost Unit of Measure**: The header `"(In millions)"` was in Chunk #1. In Chunk #2, the LLM reads `"Operating income: 18,200"` and frequently reports that operating income was $18,200 dollars instead of $18.2 billion.
3. **Footnote Disconnection**: Critical GAAP reconciliations and litigation disclosures often appear in small print at the bottom of the page. Severing them leaves material caveats unretrieved.

---

## The Table-Aware Ingestion Strategy

To maintain financial accuracy, production systems utilize a two-pronged ingestion methodology:

### 1. Header-Row Repetition (Structural Table Chunking)
Whenever a financial table exceeds the target chunk size (e.g. 400 tokens), the chunker splits along row boundaries—never column boundaries—and prepends the table title, denomination units, and column headers to each resulting slice:

```markdown
<!-- Chunk 2 -->
[Table: Consolidated Statements of Income | Units: In millions, USD]
| Line Item | Three Months Ended Sep 30, 2024 | Three Months Ended Sep 30, 2023 |
|---|---|---|
| Cost of products revenue | $ 24,100 | $ 22,300 |
| Cost of services revenue | $ 7,850 | $ 6,900 |
| Operating income | $ 18,200 | $ 15,120 |
```

With this pattern, every single row is anchored to its temporal columns and units of measure.

### 2. Tabular Row Linearization (Semantic Triples)
For high-stakes compliance or extraction tasks, tables can also be serialized into natural language statements during ingestion:
> *"For the three months ended September 30, 2024, Product Cost of Revenue was \$24,100 million, compared to \$22,300 million for the three months ended September 30, 2023."*

While linearization increases token counts, it generates dense embeddings that align directly with natural language user queries like *"What was the product cost in Q3 2024?"*.

---

## Architectural Comparison

:::compare{left="Blind Text Splitting on 10-K" right="Table-Aware Financial Chunking"}
- Slices balance sheets midway, stripping temporal headers.
- Converts numbers into unanchored scalars ($18,200 vs $18.2B).
- Fails to pair footnotes with the line items they qualify.
- Causes hallucinated financial comparisons in model responses.
===
- Retains table titles, currency units, and fiscal year columns on all slices.
- Partitions strictly along complete table row boundaries.
- Glues accounting policy footnotes to corresponding statement chunks.
- Enables accurate multi-year comparisons and ratio computations.
:::

---

## Production Python Implementation

The following implementation chunks financial markdown tables by row while duplicating schema headers across every chunk:

```python
from typing import List

def chunk_financial_table(
    table_markdown: str, 
    context_header: str, 
    max_rows_per_chunk: int = 4
) -> List[str]:
    """
    Chunks a markdown table ensuring table headers and units persist across every slice.
    """
    lines = [line.strip() for line in table_markdown.strip().split("\n") if line.strip()]
    if len(lines) < 3:
        return [f"{context_header}\n{table_markdown}"]

    # Extract schema headers (row 0: column names, row 1: separator)
    header_rows = lines[:2]
    data_rows = lines[2:]

    chunks = []
    for i in range(0, len(data_rows), max_rows_per_chunk):
        row_batch = data_rows[i:i + max_rows_per_chunk]
        chunk_table = "\n".join(header_rows + row_batch)
        full_chunk = f"{context_header}\n{chunk_table}"
        chunks.append(full_chunk)

    return chunks

# Example usage:
context = "[SEC 10-K | Acme Corp | Consolidated Statements of Income (In Millions)]"
table = """| Line Item | 2024 | 2023 |
|---|---|---|
| Product Revenue | $42,150 | $38,920 |
| Service Revenue | $21,800 | $18,450 |
| Operating Income | $18,200 | $15,120 |
| Net Income | $14,100 | $12,300 |"""

slices = chunk_financial_table(table, context, max_rows_per_chunk=2)
for idx, slice_text in enumerate(slices, 1):
    print(f"--- Slice {idx} ---")
    print(slice_text)
```

:::tryit[csv-data]{strategy="tabular" chunkSize="400" chunkOverlap="40"}
:::

---

## Test Your Understanding

:::quiz[quiz-8-3]{}
:::

---

## Key Takeaways

- **Preserve units and periods**: Financial numbers are meaningless without currency units, magnitude indicators (`in millions`), and reporting periods.
- **Never slice columns apart**: Slicing between columns destroys comparative ratios and temporal alignment.
- **Repeat header rows across slices**: Ensure every chunk containing table data includes the schema header row.
- **Anchor footnotes**: Explicitly associate accounting policy notes with the financial line items they govern.
