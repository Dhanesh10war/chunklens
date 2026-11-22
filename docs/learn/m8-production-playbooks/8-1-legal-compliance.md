# Legal Contracts & Regulatory Compliance

<!-- claim: [STANDARD KNOWLEDGE] Legal chunking requires strict preservation of clause numbering, hierarchical section breadcrumbs, and cross-reference bindings to avoid semantic inversion and broken citations. -->
:::callout[note]{title="TL;DR"}
Legal contracts and regulatory statutes are among the least forgiving domains for naive chunking. A severed clause number turns a binding obligation into an unidentifiable fragment, while separating a restriction from its qualifying introductory clause (*"Except as provided in Section 8.2..."*) reverses the legal meaning entirely. Production legal RAG requires clause-aware splitting, hierarchical breadcrumb prepending, and defined-term preservation.
:::

## The Strict Structural Hierarchy of Law

Legal instruments are engineered with rigorous syntactic hierarchy:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Legal Document Hierarchy                              │
│                                                                             │
│  Master Services Agreement                                                  │
│  └── Article VIII: Warranties and Covenants                                 │
│      └── Section 8.2 Performance Warranties                                 │
│          ├── (a) Service Level Availability                                 │
│          │   ├── (i) Uptime Calculation                                     │
│          │   └── (ii) Scheduled Maintenance Exclusions                      │
│          └── (b) Remedies for SLA Breach                                    │
│              └── "Subject to the limitations in Section 11.4..."            │
└─────────────────────────────────────────────────────────────────────────────┘
```

When an ingestion pipeline splits text on arbitrary character boundaries:
1. **Broken Section Attribution**: A chunk begins with `"(ii) Scheduled Maintenance Exclusions"`. The embedding model has no knowledge of whether this applies to hosting, physical hardware, or software SLAs.
2. **Severed Qualifying Clauses**: Slicing before *"Except as provided in Section 11.4"* strips the liability ceiling from the warranty, leading the LLM to generate legally false advice regarding unlimited damages.
3. **Detached Defined Terms**: Capitalized terms like `"Confidential Information"` or `"Covered Losses"` are defined in Article I. When Article IX is retrieved in isolation, the LLM hallucinates common-language definitions rather than the contract's negotiated meanings.

---

## The Clause-Aware Chunking Strategy

To maintain fidelity, legal chunking follows three core engineering rules:

### 1. Regex Splitting on Section Identifiers
Do not split on generic double newlines alone. Configure the splitter to recognize legal section headers using regex lookaheads so boundaries occur strictly before numbered headings:

```python
LEGAL_DELIMITERS = [
    # Top-level articles (e.g. "ARTICLE IV", "Article 4")
    r"\n(?=(?i:article)\s+[0-9IVXLCDM]+)",
    # Numbered sections (e.g. "Section 12.3", "12.3 ")
    r"\n(?=(?i:section)\s+\d+(?:\.\d+)*)",
    r"\n(?=\d+\.\d+\s+[A-Z])",
    # Subsections (e.g. "(a)", "(i)")
    r"\n(?=\([a-z0-9]+\)\s+)",
    # Standard paragraph breaks
    "\n\n",
    "\n",
    " "
]
```

### 2. Hierarchical Breadcrumb Prepending
To ground isolated clauses, dynamically track the document outline and prepend the full section hierarchy to each chunk during ingestion:

```
[Document: Master Services Agreement]
[Context: Article VIII Warranties > Section 8.2 Performance Warranties > Subsection (b) Remedies]

(b) If Provider fails to meet the Service Level Commitment, Customer shall be 
entitled to Service Credits as set forth in Exhibit B. Service Credits constitute 
Customer's sole and exclusive remedy for availability failures.
```

Adding this 25-token header grounds the embedding vector in the exact legal scope without distorting the underlying clause text.

---

## Architectural Comparison

:::compare{left="Blind Character Chunking" right="Clause-Aware Legal Chunking"}
- Splits wherever character count hits 500.
- Strips section titles from underlying numbered provisions.
- High risk of truncating qualifying clauses like "Provided, however, that...".
- LLM cannot provide exact section citations in responses.
===
- Splits strictly at section and subsection boundaries.
- Prepends hierarchical metadata breadcrumbs to every passage.
- Keeps qualifying provisions joined with their governing covenants.
- Enables the LLM to generate precise legal citations (e.g. "Under Section 8.2(b)...").
:::

---

## Production Python Implementation

The following implementation parses legal sections and injects hierarchical breadcrumbs:

```python
import re
from typing import List, Dict

class LegalContractChunker:
    def __init__(self, document_title: str):
        self.doc_title = document_title
        self.section_pattern = re.compile(
            r"^(Article\s+[IVXLCDM0-9]+|Section\s+\d+(?:\.\d+)*)\s*[:\-\.]?\s*(.*)$",
            re.IGNORECASE
        )

    def chunk_contract(self, raw_text: str, max_chars: int = 1500) -> List[Dict[str, str]]:
        paragraphs = raw_text.split("\n\n")
        chunks = []
        current_article = "Preamble"
        current_section = "General"
        current_body = []
        current_length = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Check if paragraph establishes a new section header
            first_line = para.split("\n")[0].strip()
            match = self.section_pattern.match(first_line)
            if match:
                sec_type = match.group(1)
                sec_title = match.group(2)
                if "article" in sec_type.lower():
                    current_article = f"{sec_type}: {sec_title}"
                else:
                    current_section = f"{sec_type}: {sec_title}"

            para_len = len(para)
            if current_length + para_len > max_chars and current_body:
                # Flush current buffer
                breadcrumb = f"[{self.doc_title} > {current_article} > {current_section}]\n"
                chunks.append({
                    "metadata": {"article": current_article, "section": current_section},
                    "text": breadcrumb + "\n\n".join(current_body)
                })
                current_body = []
                current_length = 0

            current_body.append(para)
            current_length += para_len

        if current_body:
            breadcrumb = f"[{self.doc_title} > {current_article} > {current_section}]\n"
            chunks.append({
                "metadata": {"article": current_article, "section": current_section},
                "text": breadcrumb + "\n\n".join(current_body)
            })

        return chunks
```

:::tryit[legal-contract]{strategy="recursive" chunkSize="450" chunkOverlap="50"}
:::

---

## Test Your Understanding

:::quiz[quiz-8-1]{}
:::

---

## Key Takeaways

- **Preserve clause hierarchy**: Never split across numbered subsections without maintaining the parent section reference.
- **Prepend metadata breadcrumbs**: Injecting `[Doc > Article > Section]` headers ensures the vector embedding captures jurisdictional context.
- **Keep qualifiers intact**: Covenants and their exceptions must remain in the same chunk to prevent dangerous legal misinformation.
- **Enable exact citations**: Structural chunking allows the downstream model to cite specific clause numbers in its generated answers.
