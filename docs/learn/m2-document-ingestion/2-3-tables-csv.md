# Tables, CSVs & Schema Retention

<!-- claim: [STANDARD KNOWLEDGE] Slicing tabular data across arbitrary boundaries detaches data rows from their column schema. -->
:::callout[note]{title="TL;DR"}
Tabular data (spreadsheets, SQL exports, CSVs, and markdown tables) is the most fragile format in vector search. If a 100-row table is sliced into chunks without schema retention, only the first chunk contains the column names. All subsequent chunks become collections of floating numbers and strings divorced from their labels. Tabular schema retention prepends header rows to every chunk partition, guaranteeing that individual rows remain semantically searchable.
:::

## The Floating Cell Catastrophe

Consider a financial earnings table:

| Fiscal Quarter | Total Revenue ($M) | Operating Expense ($M) | Net Profit Margin | Cash Reserves ($M) |
| :--- | :--- | :--- | :--- | :--- |
| 2024-Q1 | 42.5 | 28.1 | 33.8% | 114.2 |
| 2024-Q2 | 48.0 | 31.2 | 35.0% | 128.5 |
| 2024-Q3 | 51.4 | 33.0 | 35.7% | 142.0 |
| ... | ... | ... | ... | ... |
| 2025-Q4 | 68.2 | 41.5 | 39.1% | 204.0 |

When this table spans multiple pages, a generic text splitter slices the table at target token intervals. 

Look at what happens to **Chunk 4** (rows 40 to 50):
```
| 2025-Q4 | 68.2 | 41.5 | 39.1% | 204.0 |
```

<!-- claim: [STANDARD KNOWLEDGE] Unanchored numeric table rows cannot be matched by semantic vector queries targeting column definitions. -->
Now consider a user query: *"What was the Net Profit Margin in Q4 2025?"*
The vector embedding for the query centers heavily on the semantic concepts **"Net Profit Margin"** and **"Profitability"**.
In Chunk 4, the phrase *"Net Profit Margin"* does not appear anywhere! The chunk contains only `"39.1%"`. 
Because the column label was cut off 3 chunks earlier, the cosine similarity between the query and Chunk 4 drops, resulting in a retrieval miss.

---

## Schema Retention & Header Prepending

To preserve retrieval accuracy across tabular data, a production pipeline must enforce **Tabular Schema Retention**:

```
┌─────────────────────────────────────────────────────────────┐
│ Chunk 4 (With Tabular Schema Retention)                     │
│                                                             │
│ [Header Prepend]:                                           │
│ | Fiscal Quarter | Revenue ($M) | OpEx ($M) | Margin | Cash |
│ |----------------|--------------|-------------|--------|------|
│ [Data Rows]:                                                │
│ | 2025-Q3        | 64.0         | 39.5        | 38.2%  | 185  |
│ | 2025-Q4        | 68.2         | 41.5        | 39.1%  | 204  |
└─────────────────────────────────────────────────────────────┘
```

By prepending the table's header row and column definitions to every partition:
1. Every row inherits the full vocabulary of the table's schema.
2. Embedding models compute dense vectors that cleanly capture the relationship between column metrics and row values.
3. Downstream LLMs reading the retrieved chunk can immediately interpret numbers without hallucinating column names.

---

## Tabular Formatting Strategies: Markdown vs CSV vs Key-Value

Different serialization formats produce distinct token efficiencies:

:::compare{left="Markdown Table Format" right="Key-Value Entity Format"}
**Markdown Format:**
```markdown
| Quarter | Revenue | Margin |
| 2025-Q4 | 68.2M   | 39.1%  |
```
- Highly readable for frontier LLMs.
- Moderate token overhead from pipe delimiters (`|`).
===
**Key-Value Serialized Format:**
```
Record [Fiscal Performance]:
- Quarter: 2025-Q4
- Revenue: $68.2M
- Profit Margin: 39.1%
```
- Highest embedding accuracy for single-row queries.
- Highest token consumption per row.
:::

In ChunkLens, the **Tabular & CSV Splitter** allows configuring row grouping limits, automated header replication, and token budget calculations so you can observe the exact token overhead before committing to a database schema.

:::tryit[product-catalog]{strategy="tabular" chunkSize="400" chunkOverlap="0"}
:::

---

## Test Your Understanding

:::quiz[quiz-2-3]{}
:::

---

## Key Takeaways

- **Never slice tables blindly**: Slicing tabular data without headers strips numbers of their semantic definitions.
- **Enforce schema retention**: Prepend column headers to every chunk partition so that numbers stay tied to their labels.
- **Measure token expansion**: Prepending headers consumes tokens; budget for this overhead when calculating chunk sizes.
- **Choose the right format**: Use markdown tables for multi-row comparisons; use key-value serialization for isolated record lookups.
