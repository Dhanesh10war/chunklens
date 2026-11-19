# Sources & Primary References for ChunkLens Learn Track

Authoritative citations and research papers underpinning the educational materials in ChunkLens:

1. **Retrieval-Augmented Generation (RAG)**
   - Lewis, P., et al. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*. Advances in Neural Information Processing Systems (NeurIPS 2020), 33, 9459-9474.
   - Primary contribution: Formalized the RAG architecture combining parametric pre-trained language models with non-parametric dense vector index retrieval.

2. **Lost in the Middle / Context Window Attention Degradation**
   - Liu, N. F., Lin, K., Hewitt, J., Paranjape, A., Bevilacqua, M., Petroni, F., & Liang, P. (2024). *Lost in the Middle: How Language Models Use Long Contexts*. Transactions of the Association for Computational Linguistics (TACL), 12, 157-173.
   - Primary contribution: Demonstrated that LLM retrieval accuracy degrades significantly when relevant information is positioned in the center of long multi-chunk input prompts compared to the beginning or end.

3. **Subword Byte-Pair Encoding (BPE)**
   - Sennrich, R., Haddow, B., & Birch, A. (2016). *Neural Machine Translation of Rare Words with Subword Units*. Proceedings of the 54th Annual Meeting of the Association for Computational Linguistics (ACL 2016), 1715-1725.
   - Primary contribution: Pioneered subword tokenization via iterative Byte-Pair Encoding.

4. **Lexical Retrieval Baseline (BM25)**
   - Robertson, S. E., & Zaragoza, H. (2009). *The Probabilistic Relevance Framework: BM25 and Beyond*. Foundations and Trends in Information Retrieval, 3(4), 333-389.
   - Primary contribution: Comprehensive formulation of term frequency saturation and document length normalization for sparse ranking.

5. **Late Interaction Multi-Vector Retrieval (ColBERT)**
   - Khattab, O., & Zaharia, M. (2020). *ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT*. Proceedings of the 43rd International ACM SIGIR Conference on Research and Development in Information Retrieval, 39-48.
   - Primary contribution: Introduced fine-grained token-level MaxSim operations preserving token alignment without compressing documents into single vectors.
