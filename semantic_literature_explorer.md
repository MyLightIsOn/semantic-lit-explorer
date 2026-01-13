# Semantic Literature Explorer

## A Vector-Database--Backed Research Project for LLM Systems Design

### Purpose

This project is a **research instrument**, not a demo. Its goal is to: -
Build practical intuition for vector databases and retrieval-augmented
generation (RAG) - Support academic research into LLM-powered system
architectures - Empirically explore claims made in the LLM systems
literature

The system enables **semantic exploration of research papers**, allowing
queries by meaning rather than keywords.

------------------------------------------------------------------------

## Core Research Question

How do modern AI systems architectures (RAG, orchestration, agents,
governance) actually behave in practice when instantiated as real
systems?

------------------------------------------------------------------------

## High-Level Architecture

    Research PDFs
      ↓
    Text Extraction
      ↓
    Section-Aware Chunking + Metadata
      ↓
    Embedding Model
      ↓
    Vector Database
      ↓
    Semantic Retrieval
      ↓
    LLM Synthesis

This mirrors production LLM architectures discussed in the literature.

------------------------------------------------------------------------

## Project Phases

### Phase 1: Corpus Definition

**Goal:** Define a controlled, research-relevant dataset.

-   20--100 papers
-   Academic + industry research (clearly labeled)
-   Focus areas:
    -   LLM architectures
    -   RAG
    -   Multi-agent systems
    -   Orchestration
    -   Governance & evaluation

**Outcome:** A curated PDF corpus.

------------------------------------------------------------------------

### Phase 2: Text Extraction

**Goal:** Produce clean, readable text.

Tasks: - Extract text per page - Remove headers/footers - Preserve
section structure where possible

**Outcome:** Page-level raw text suitable for chunking.

------------------------------------------------------------------------

### Phase 3: Section-Aware Chunking

**Goal:** Preserve academic semantics.

Chunking strategy: - 200--300 words - \~20% overlap - Chunk boundaries
aligned to sections

Metadata per chunk: - Paper title - Authors - Year - Venue - Section
name - Paper type (academic / industry)

**Outcome:** Semantically meaningful chunks with rich metadata.

------------------------------------------------------------------------

### Phase 4: Embedding

**Goal:** Encode meaning, not structure.

-   Use a sentence-transformer embedding model
-   One vector per chunk
-   Store vectors + metadata

**Outcome:** High-dimensional semantic representations of the
literature.

------------------------------------------------------------------------

### Phase 5: Vector Database

**Goal:** Provide semantic memory.

Recommended: - Local vector database (e.g., Qdrant)

Stored per entry: - Embedding vector - Raw text - Metadata payload

**Outcome:** Queryable semantic index.

------------------------------------------------------------------------

### Phase 6: Semantic Retrieval

**Goal:** Retrieve arguments, not documents.

Query types: - Definition queries - Comparison queries - Trend
analysis - Limitations / critique

Retrieval: - Embed query - Top-k similarity search - Metadata filtering

**Outcome:** Relevant literature fragments surfaced by meaning.

------------------------------------------------------------------------

### Phase 7: LLM Synthesis

**Goal:** Generate grounded research assistance.

Prompt constraints: - Answer using only retrieved context - No external
knowledge - Prefer synthesis over summarization

**Outcome:** Structured, grounded responses with traceable sources.

------------------------------------------------------------------------

## Evaluation Strategy

### Qualitative Evaluation

-   Are retrieved chunks conceptually relevant?
-   Does section-aware chunking improve answers?
-   Where does semantic retrieval fail?

### Architectural Stress Tests

-   Change chunk sizes
-   Vary top-k
-   Introduce contradictory papers
-   Ask ambiguous questions

Failures are treated as **research insights**, not bugs.

------------------------------------------------------------------------

## Expected Learning Outcomes

By completing this project, you will: - Understand vector databases in
practice - Experience real RAG failure modes - See why orchestration
matters more than model size - Gain empirical grounding for academic
claims - Produce a reusable research tool

------------------------------------------------------------------------

## How This Strengthens the Paper

This project allows you to: - Reference a concrete system artifact -
Base claims on empirical observation - Discuss architectural trade-offs
honestly - Align theory with implementation

You are not just writing *about* LLM systems---you are **using one as a
research instrument**.

------------------------------------------------------------------------

## Non-Goals (Important)

-   Not a production system
-   Not a benchmark
-   Not an agent framework
-   Not optimized for performance

The goal is **architectural understanding**, not polish.

------------------------------------------------------------------------

## Guiding Principle

> If you can query it by meaning, you can reason about it. If you can
> reason about it, you can design better systems.
