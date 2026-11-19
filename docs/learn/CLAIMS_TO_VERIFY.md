# ChunkLens Learn Track: Claims Verification Register

This register logs every factual, algorithmic, and educational claim present in the ChunkLens Learn Track documentation and lessons, adhering to the principle: **Evidence or UNKNOWN**.

## Verification Tag Definitions
- `[STANDARD KNOWLEDGE]`: Widely established, foundational computer science or information retrieval concept documented in academic textbooks and peer-reviewed literature.
- `[CHUNKLENS BEHAVIOR VERIFIED]`: Empirically verified against the local ChunkLens codebase, vitest test suites, or live browser runtime measurements.
- `[NEEDS SOURCE]`: A specific quantitative or empirical claim requiring an authoritative primary source or benchmark replication.

---

## Lesson 1.1: What is RAG? (`docs/learn/m1-rag-foundations/1-1-what-is-rag.md`)

| Claim ID | Classification | Statement | Verification Method / Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| `1.1-C1` | `[STANDARD KNOWLEDGE]` | RAG supplements LLM parametric knowledge with external dynamic document retrieval. | Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (NeurIPS 2020). | VERIFIED |
| `1.1-C2` | `[STANDARD KNOWLEDGE]` | Pre-trained LLM weights are static and subject to training cutoff dates. | Established foundational limitation of autoregressive Transformer architectures. | VERIFIED |
| `1.1-C3` | `[STANDARD KNOWLEDGE]` | Hallucinations occur when models generate plausible-sounding but factually ungrounded text. | Ji et al., "Survey of Hallucination in Natural Language Generation" (ACM Computing Surveys 2023). | VERIFIED |
| `1.1-C4` | `[STANDARD KNOWLEDGE]` | RAG architectures bypass retraining by retrieving context dynamically. | Standard IR-LLM integration architecture. | VERIFIED |
| `1.1-C5` | `[STANDARD KNOWLEDGE]` | Chunk size dictates the signal-to-noise ratio in retrieved context. | Robertson & Spärck Jones; Manning et al., "Introduction to Information Retrieval". | VERIFIED |
| `1.1-C6` | `[CHUNKLENS BEHAVIOR VERIFIED]` | Tokenization and chunk boundaries can be fully previewed client-side without remote calls. | Verified via `scripts/test-egress.cjs` and sandboxed local worker architecture. | VERIFIED |

---

## Lesson 3.2: The Chunk Size Trade-Off (`docs/learn/m3-chunking-fundamentals/3-2-the-size-trade-off.md`)

| Claim ID | Classification | Statement | Verification Method / Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| `3.2-C1` | `[STANDARD KNOWLEDGE]` | Chunk size represents a fundamental trade-off between retrieval precision and contextual completeness. | Standard NLP information retrieval literature; Liu et al., "Lost in the Middle" (TACL 2024). | VERIFIED |
| `3.2-C2` | `[STANDARD KNOWLEDGE]` | Micro-chunks often isolate pronouns and qualifiers from their referring subjects. | Core coreference resolution failure mode in NLP passage retrieval. | VERIFIED |
| `3.2-C3` | `[CHUNKLENS BEHAVIOR VERIFIED]` | In standard English prose, 1 BPE token is roughly 4 characters, but code/JSON drops below 2. | Empirically verified via `src/engine/tokenizers/__tests__/multiModel.test.ts`. | VERIFIED |
| `3.2-C4` | `[STANDARD KNOWLEDGE]` | Optimal chunk size depends on downstream query granularity and model context limits. | Barnett et al., "Seven Failure Points When Fine-tuning and RAG for LLMs" (2024). | VERIFIED |
