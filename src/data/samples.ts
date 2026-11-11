import { SampleDocument } from '../engine/types';

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'api-reference',
    title: 'Developer API Reference & Code',
    category: 'Technical Documentation',
    description: 'Markdown spec with complex nested headers, parameters table, and Python code blocks.',
    content: `# Vector Search API Documentation (v2.4)

Welcome to the Vector Search Engine API. This document explains index creation, vector similarity metrics, and upsert batching limits.

## Authentication
All requests must include a Bearer token in the \`Authorization\` header:
\`\`\`bash
curl -X POST https://api.vectorsearch.io/v1/collections \\
  -H "Authorization: Bearer vsec_live_994827104" \\
  -H "Content-Type: application/json"
\`\`\`

## Index Architecture & Similarity Metrics
The vector engine supports three primary distance calculation functions:
1. **Cosine Similarity**: Best for normalized embeddings such as OpenAI \`text-embedding-3-small\`.
2. **Euclidean Distance (L2)**: Best for spatial coordinates and audio latent vectors.
3. **Dot Product**: Optimized for high-throughput maximum inner product search (MIPS).

### Parameters Table
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| \`dimension\` | integer | Yes | Number of vector dimensions (e.g., 1536 for OpenAI, 384 for MiniLM). |
| \`metric\` | string | Yes | One of \`cosine\`, \`euclidean\`, or \`dotproduct\`. |
| \`replicas\` | integer | No | Number of read replicas across availability zones (default: 2). |
| \`max_vectors\` | integer | No | Hard ceiling limit for collection capacity. |

## Upsert Operations
You can batch up to 1,000 vectors per single HTTP POST payload:
\`\`\`python
import requests

def upsert_vectors(collection_id, vectors):
    url = f"https://api.vectorsearch.io/v1/{collection_id}/upsert"
    payload = {
        "records": [
            {"id": str(i), "values": v, "metadata": {"source": "manual"}}
            for i, v in enumerate(vectors)
        ]
    }
    res = requests.post(url, json=payload, headers={"Authorization": "Bearer TOKEN"})
    res.raise_for_status()
    return res.json()
\`\`\`

## Rate Limits & Error Handling
Standard accounts are throttled at 10,000 requests per minute. Exceeding limits returns HTTP status \`429 Too Many Requests\` with a \`Retry-After\` header indicating waiting seconds.`,
  },
  {
    id: 'legal-contract',
    title: 'SaaS Master Subscription Agreement',
    category: 'Legal & Compliance',
    description: 'Enterprise contract with numbered sections, indemnification, and liability clauses.',
    content: `MASTER CLOUD SERVICES SUBSCRIPTION AGREEMENT

This Master Cloud Services Subscription Agreement ("Agreement") is entered into between CloudFlow Technologies Inc. ("Provider") and the entity agreeing to these terms ("Subscriber").

1. DEFINITIONS AND SCOPE
1.1 "Authorized Users" means Subscriber's designated employees, contractors, and agents authorized to access the Cloud Platform.
1.2 "Customer Data" means all electronic data, files, or information submitted by Subscriber to the Cloud Platform.
1.3 "Service Level Agreement" means the performance metrics and availability commitments set forth in Schedule A.

2. SERVICE AVAILABILITY AND SERVICE CREDITS
Provider shall use commercially reasonable efforts to ensure the Cloud Platform maintains a Monthly Uptime Percentage of not less than 99.9% during each calendar month.
In the event Provider fails to meet the Uptime Commitment, Subscriber's sole and exclusive remedy shall be to receive Service Credits as follows:
(a) Uptime between 99.0% and 99.9%: 10% credit of monthly billing cycle.
(b) Uptime between 95.0% and 99.0%: 25% credit of monthly billing cycle.
(c) Uptime below 95.0%: 50% credit of monthly billing cycle.

3. DATA PROTECTION AND CONFIDENTIALITY
Each party agrees that all code, inventions, business, technical, and financial information disclosed to that party ("Receiving Party") by the other party ("Disclosing Party") constitutes the confidential property of the Disclosing Party.
The Receiving Party will hold in confidence and not disclose any Confidential Information, except to its employees who have a legitimate need to know.

4. LIMITATION OF LIABILITY
EXCEPT FOR WILLFUL MISCONDUCT OR BREACH OF CONFIDENTIALITY OBLIGATIONS, NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.
PROVIDER'S TOTAL AGGREGATE LIABILITY ARISING UNDER THIS AGREEMENT SHALL BE STRICTLY LIMITED TO THE FEES PAID BY SUBSCRIBER IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.`,
  },
  {
    id: 'financial-report',
    title: 'Quarterly Financial Performance (10-Q)',
    category: 'Financial Analysis',
    description: 'Audited financial metrics, revenue disaggregation, and operational risk factors.',
    content: `PART I — FINANCIAL INFORMATION
ITEM 2. MANAGEMENT'S DISCUSSION AND ANALYSIS OF FINANCIAL CONDITION

Overview of Operating Results
Total consolidated revenue for the third fiscal quarter ended September 30, 2026 was $142.5 million, representing a 28% year-over-year increase compared to $111.3 million reported in the third quarter of 2025.
Growth was driven primarily by rapid expansion of our Enterprise AI Cloud solutions and enhanced customer retention in North American markets.

Revenue Breakdown by Segment:
- Subscription Software & Platform: $118.2 million (83% of total revenue), up 32% year-over-year.
- Professional Implementation & Advisory Services: $24.3 million (17% of total revenue), up 11% year-over-year.

Cost of Revenue and Gross Margins:
Gross margin expanded 240 basis points to 74.6%, compared to 72.2% in the prior year period.
The improvement reflects ongoing cloud infrastructure optimizations, negotiated multi-year committed compute pricing with hyperscale cloud providers, and automated tiering of cold storage assets.

Liquidity and Capital Resources:
As of September 30, 2026, we had cash, cash equivalents, and short-term marketable securities totaling $318.4 million.
Operating cash flow generated during the nine months ended September 30 was $64.2 million, up from $41.8 million for the same period in 2025.
Management believes existing cash reserves and operating cash flows will remain sufficient to fund capital expenditures and working capital requirements for at least the next 24 months.`,
  },
  {
    id: 'academic-paper',
    title: 'Attention & Retrieval in Transformer Models',
    category: 'Research & AI',
    description: 'Academic paper extract examining context window constraints and needle-in-a-haystack retrieval.',
    content: `Abstract
Recent advancements in Large Language Models (LLMs) have substantially increased effective context window lengths from 4k tokens to upwards of 1M tokens.
However, empirical benchmarks demonstrate that attention density degrades significantly as context lengths expand, a phenomenon colloquially termed the "Lost in the Middle" effect.
In this work, we systematically investigate the intersection between retrieval-augmented generation (RAG) and dense long-context processing.

1. Introduction
While multi-hop reasoning over hundreds of pages is computationally tractable with FlashAttention-3 and ring-attention architectures, naive ingestion introduces substantial semantic distraction.
Irrelevant paragraphs injected into prompt contexts reduce recall fidelity by up to 34% on standardized Needle-in-a-Haystack (NIAH) evaluations.
Consequently, granular chunking and semantic pre-filtering remain imperative for mission-critical enterprise applications.

2. Chunking Granularity vs. Semantic Completeness
We formulate chunk boundary optimization as a dual-objective trade-off:
- Objective 1: Minimize token redundancy and cross-chunk noise to maximize embedding signal-to-noise ratio (SNR).
- Objective 2: Maximize boundary coherence such that syntactically coupled propositions (e.g., condition-consequence clauses) are not bifurcated across disparate vector embeddings.

Experimental results across seven open-domain question answering datasets confirm that recursive delimiter-based splitting outperforms static sliding-window chunking by 18.4 points in Normalized Discounted Cumulative Gain (NDCG@10).`,
  },
  {
    id: 'backend-service',
    title: 'Python Backend Service (FastAPI & SQLAlchemy)',
    category: 'Source Code & Architecture',
    description: 'Production Python service with FastAPI routes, Pydantic schemas, and SQLAlchemy ORM models.',
    content: `"""FastAPI Document Ingestion & Chunking Service."""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ---------------------------------------------------------
# Database Models & ORM Schema
# ---------------------------------------------------------
Base = declarative_base()

class DocumentRecord(Base):
    """Database model for indexed knowledge documents."""
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    source_uri = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ChunkRecord(Base):
    """Database model for vectorized document chunks."""
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=False)
    embedding_id = Column(String(64), nullable=True, index=True)

# ---------------------------------------------------------
# Pydantic Request & Response Schemas
# ---------------------------------------------------------
class ChunkResponse(BaseModel):
    chunk_index: int
    content: str
    token_count: int

    class Config:
        from_attributes = True

class IngestRequest(BaseModel):
    title: str = Field(..., max_length=255, description="Document title")
    text: str = Field(..., min_length=1, description="Raw document text")
    chunk_size: int = Field(default=500, ge=50, le=4000)
    chunk_overlap: int = Field(default=50, ge=0, le=1000)

class IngestResponse(BaseModel):
    document_id: int
    total_chunks: int
    total_tokens: int
    chunks: List[ChunkResponse]

# ---------------------------------------------------------
# FastAPI Application & Endpoints
# ---------------------------------------------------------
app = FastAPI(
    title="ChunkLens Ingestion Engine",
    version="1.0.0",
    description="High-performance API for document chunking and vector storage."
)

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Service liveness probe for container orchestrators."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/v1/ingest", response_model=IngestResponse, status_code=status.HTTP_201_CREATED)
def ingest_document(payload: IngestRequest, db: Session = Depends(get_db)):
    """Split document into coherent chunks and persist records."""
    if payload.chunk_overlap >= payload.chunk_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="chunk_overlap must be strictly less than chunk_size"
        )
    
    doc = DocumentRecord(title=payload.title)
    db.add(doc)
    db.flush()

    chunks = split_text(payload.text, payload.chunk_size, payload.chunk_overlap)
    total_tokens = sum(c["tokens"] for c in chunks)
    
    records = [
        ChunkRecord(
            document_id=doc.id,
            chunk_index=i,
            content=c["text"],
            token_count=c["tokens"],
        )
        for i, c in enumerate(chunks)
    ]
    db.add_all(records)
    db.commit()
    
    return IngestResponse(
        document_id=doc.id,
        total_chunks=len(records),
        total_tokens=total_tokens,
        chunks=[ChunkResponse(chunk_index=r.chunk_index, content=r.content, token_count=r.token_count) for r in records]
    )
`,
  },
  {
    id: 'tabular-csv',
    title: 'Product Catalog CSV',
    category: 'Structured Tabular Data',
    description: 'Tabular CSV records containing product SKUs, categories, pricing, ratings, and stock levels.',
    content: `sku,product_name,category,brand,price_usd,stock_level,rating_stars,supplier_id
SKU-9021,Aperture Precision Mouse,Peripherals,LogiTech,89.99,142,4.8,SUP-101
SKU-9022,Mechanical Cobalt Keyboard,Peripherals,Keychron,149.50,56,4.9,SUP-102
SKU-9023,Ergonomic Obsidian Standing Desk,Furniture,Autonomous,549.00,18,4.7,SUP-103
SKU-9024,Noise Cancelling Studio Headphones,Audio,Sony,299.99,78,4.8,SUP-104
SKU-9025,Reference Nearfield Monitor Speakers,Audio,Yamaha,349.00,32,4.9,SUP-104
SKU-9026,Solid Walnut Desk Riser,Furniture,Grovemade,120.00,95,4.6,SUP-105
SKU-9027,Braided 100W USB-C Cable (2m),Accessories,Anker,24.99,480,4.8,SUP-106
SKU-9028,Curved 34-inch QD-OLED Monitor,Displays,Alienware,899.99,22,4.9,SUP-107
SKU-9029,Aluminum Laptop Cooling Stand,Accessories,TwelveSouth,69.95,115,4.5,SUP-108
SKU-9030,Smart LED Monitor Light Bar,Lighting,BenQ,109.00,64,4.7,SUP-109
SKU-9031,Thunderbolt 4 Multi-Port Dock,Peripherals,CalDigit,379.99,41,4.9,SUP-110
SKU-9032,High-Density Wool Felt Desk Pad,Accessories,DeltaHub,45.00,210,4.6,SUP-111
SKU-9033,4K Ultra-HD AI Streaming Webcam,Video,Obsbot,249.00,38,4.7,SUP-112
SKU-9034,Cardioid USB/XLR Dynamic Microphone,Audio,Shure,269.00,52,4.9,SUP-113
SKU-9035,Motorized Desktop Cable Tray,Furniture,Fully,55.00,175,4.4,SUP-103`,
  },
];
