# Semantic Literature Explorer

A vector-database-backed research instrument for exploring LLM system architectures through semantic retrieval.

---

## Overview

The Semantic Literature Explorer is a research project that builds practical intuition for vector databases and retrieval-augmented generation (RAG) while supporting academic research into LLM-powered system architectures. It enables semantic exploration of research papers, allowing queries by meaning rather than keywords.

---

## Core Research Question

*How do modern AI system architectures (RAG, orchestration, agents, governance) actually behave in practice when instantiated as real systems?*

---

## Project Goals

1. **Build practical intuition** for vector databases and RAG
2. **Support academic research** into LLM-powered system architectures
3. **Empirically explore claims** made in the LLM systems literature
4. **Document the process** as part of the research methodology

---

## High-Level Architecture

```
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
```

This mirrors production LLM architectures discussed in the literature.

---

## Project Phases

### Phase 1: Corpus Definition
**Goal:** Define a controlled, research-relevant dataset of 20-100 papers  
**Focus:** LLM architectures, RAG, multi-agent systems, orchestration, governance & evaluation  
**Status:** 🟡 In Progress

### Phase 2: Text Extraction
**Goal:** Produce clean, readable text from PDFs  
**Tasks:** Extract text per page, remove headers/footers, preserve section structure  
**Status:** ⚪ Not Started

### Phase 3: Section-Aware Chunking
**Goal:** Preserve academic semantics  
**Strategy:** 200-300 word chunks with ~20% overlap, aligned to sections  
**Metadata:** Title, authors, year, venue, section name, paper type  
**Status:** ⚪ Not Started

### Phase 4: Embedding
**Goal:** Encode meaning, not structure  
**Method:** Sentence-transformer embedding model  
**Status:** ⚪ Not Started

### Phase 5: Vector Database
**Goal:** Provide semantic memory  
**Storage:** Embedding vector + raw text + metadata payload  
**Status:** ⚪ Not Started

### Phase 6: Semantic Retrieval
**Goal:** Retrieve arguments, not documents  
**Query Types:** Definitions, comparisons, trend analysis, limitations/critique  
**Status:** ⚪ Not Started

### Phase 7: LLM Synthesis
**Goal:** Generate grounded research assistance  
**Constraints:** Answer using only retrieved context, no external knowledge  
**Status:** ⚪ Not Started

---

## Research Questions

The system is designed to support investigation into:

1. **Conceptual Definitions** - How are core concepts (orchestration, agents, RAG) defined?
2. **Architectural Patterns** - What recurring patterns emerge in LLM systems?
3. **Vector DB & Retrieval** - How is semantic retrieval justified and implemented?
4. **Orchestration & Control** - How do systems manage control flow and decision-making?
5. **Evaluation & Failures** - How are systems evaluated and what failure modes are acknowledged?
6. **Governance & Ethics** - How are compliance and ethical considerations integrated?
7. **Temporal Analysis** - How has LLM system design framing evolved over time?

See [`research_questions.md`](research_questions.md) for detailed queries and expected insights.

---

## Project Structure

```
semantic-lit-explorer/
├── README.md                          # This file
├── semantic_literature_explorer.md    # Detailed project specification
├── research_questions.md              # Research questions and queries
├── paper_selection_criteria.md        # Corpus definition criteria
├── papers/                            # PDF corpus (to be created)
├── data/                              # Processed data and embeddings (to be created)
├── src/                               # Source code (to be created)
├── docs/                              # Documentation and notes (to be created)
└── notebooks/                         # Jupyter notebooks for exploration (to be created)
```

---

## Getting Started

### Prerequisites
- Python 3.9+
- Notion account (for project management)
- TBD: Vector database (evaluating options)
- TBD: Embedding model (evaluating options)

### Current Status
The project is in **Phase 1: Corpus Definition**. We are currently:
- ✅ Defining paper selection criteria
- 🟡 Identifying candidate papers
- ⚪ Setting up repository structure

### Next Steps
1. Complete paper selection criteria (see `paper_selection_criteria.md`)
2. Set up project repository structure
3. Begin identifying and collecting papers
4. Document initial architectural decisions

---

## Methodology

### Evaluation Strategy

**Qualitative Evaluation:**
- Are retrieved chunks conceptually relevant?
- Does section-aware chunking improve answers?
- Where does semantic retrieval fail?

**Architectural Stress Tests:**
- Change chunk sizes
- Vary top-k retrieval
- Introduce contradictory papers
- Ask ambiguous questions

**Failures are treated as research insights, not bugs.**

### Guiding Principle

> If you can query it by meaning, you can reason about it.  
> If you can reason about it, you can design better systems.

---

## Expected Learning Outcomes

By completing this project:
- Understand vector databases in practice
- Experience real RAG failure modes
- See why orchestration matters more than model size
- Gain empirical grounding for academic claims
- Produce a reusable research tool

---

## Project Management

This project uses Notion for task management and documentation:
- **Task Database:** Kanban board tracking development and research tasks
- **Literature Corpus:** Database of papers with selection criteria and metadata
- **Failure Log:** Journal documenting unexpected behaviors and insights
- **Progress Log:** Weekly reflections and learnings
- **Research Questions:** Reference linking tasks to research objectives

---

## Documentation

### Core Documents
- [`semantic_literature_explorer.md`](semantic_literature_explorer.md) - Full project specification
- [`research_questions.md`](research_questions.md) - Research questions and representative queries
- [`paper_selection_criteria.md`](paper_selection_criteria.md) - Criteria for corpus definition

---

## Current Tasks

### In Progress
- **Task 1:** Define Selection Criteria for Papers

### Backlog (High Priority)
- **Task 2:** Identify Candidate Papers
- **Task 3:** Setup Project Repository Structure
- **Task 7:** Define Evaluation Criteria

### Backlog (Medium Priority)
- **Task 4:** Research Vector Database Options
- **Task 5:** Research Embedding Model Options
- **Task 6:** Document Initial Architecture Decisions
- **Task 8:** Create Query Test Set

---

## Contributing

This is a personal research project. The process of building and learning is the primary output.

---

## License

TBD

---

## Contact

TBD

---

## Acknowledgments

This project draws inspiration from:
- Production LLM system architectures in industry
- Academic research on RAG and multi-agent systems
- The broader AI safety and governance community

---

## Project Status

**Current Phase:** Phase 1 - Corpus Definition  
**Last Updated:** January 13, 2026  
**Status:** 🟡 Active Development

---

## Quick Links

- [Project Specification](semantic_literature_explorer.md)
- [Research Questions](research_questions.md)
- [Paper Selection Criteria](paper_selection_criteria.md)
- 
---
