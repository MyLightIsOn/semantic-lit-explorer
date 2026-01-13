# Paper Selection Criteria
## Semantic Literature Explorer - Literature Corpus Definition

**Date:** January 13, 2026  
**Status:** In Development  
**Task:** Task 1 - Define Selection Criteria for Papers

---

## Purpose

This document defines the criteria for selecting papers to include in the Semantic Literature Explorer corpus. The goal is to create a focused, high-quality collection of 20-100 papers that support systematic research into LLM system architectures.

---

## Selection Criteria Framework

### 1. **Topical Scope**

#### Primary Focus Areas (MUST include at least one):
- [ ] **LLM System Architectures** - Overall system design, integration patterns
- [ ] **Retrieval-Augmented Generation (RAG)** - RAG architectures, retrieval strategies, grounding
- [ ] **Multi-Agent Systems** - Agent frameworks, agent collaboration, agent orchestration
- [ ] **Orchestration & Control Flow** - How LLM systems manage decision-making and workflows
- [ ] **Governance & Safety** - Compliance, auditability, safety mechanisms, ethical considerations
- [ ] **Evaluation & Reliability** - Evaluation methodologies, failure modes, reliability patterns

#### Secondary/Supporting Topics (Nice to have):
- [ ] Vector databases and semantic search
- [ ] Prompt engineering and prompt management
- [ ] Tool use and function calling
- [ ] Context management and memory
- [ ] Fine-tuning vs. prompting trade-offs
- [ ] Production deployment considerations
- [ ] Cost and latency optimization

#### Explicitly Out of Scope:
- ❌ Pure model training papers (unless they discuss system integration)
- ❌ Benchmark-only papers (unless they evaluate systems holistically)
- ❌ Domain-specific applications without architectural insights
- ❌ Papers focused solely on model internals (attention mechanisms, etc.)

---

### 2. **Publication Type & Venue**

#### Academic Sources:
**Preferred Venues:**
- [ ] **Top-tier ML/AI Conferences:** NeurIPS, ICML, ICLR, ACL, EMNLP, NAACL
- [ ] **Systems Conferences:** MLSys, SysML, OSDI, SOSP, ATC
- [ ] **AI/Agent Conferences:** AAMAS, AAAI, IJCAI
- [ ] **HCI Conferences:** CHI, CSCW (if focusing on human-AI interaction in systems)

**Acceptable Venues:**
- [ ] Workshop papers from top conferences (if particularly relevant)
- [ ] ArXiv preprints (if highly cited or from reputable research groups)
- [ ] Journal articles from: JMLR, TACL, AI Magazine

#### Industry/Technical Reports:
**Preferred Sources:**
- [ ] Technical blogs from major AI labs: OpenAI, Anthropic, Google DeepMind, Meta AI
- [ ] Company white papers on production systems
- [ ] Technical documentation with architectural insights
- [ ] Industry conference presentations with published materials

**Quality Indicators for Industry Sources:**
- Authored by known researchers/engineers
- Contains technical depth (not just marketing)
- Discusses trade-offs and limitations
- Includes architectural diagrams or concrete implementations

---

### 3. **Temporal Scope**

#### Date Range:
- **Primary Focus:** 2022-2026 (Post ChatGPT era, modern LLM systems)
- **Secondary:** 2019-2021 (Foundational RAG, early GPT-3 architectures)
- **Selective:** Pre-2019 (Only seminal papers that define key concepts)

#### Rationale:
- LLM system architecture is a rapidly evolving field
- Pre-2022 papers may not reflect current architectural patterns
- Focus on post-ChatGPT systems to capture production-relevant insights
- Include foundational papers for conceptual definitions

---

### 4. **Content Quality Indicators**

#### Must Have (Required):
- [ ] Clear architectural descriptions or diagrams
- [ ] Discussion of design decisions and trade-offs
- [ ] Concrete implementation details or case studies
- [ ] Addresses at least one research question from the project

#### Strong Preference (Valuable):
- [ ] Discusses failure modes or limitations
- [ ] Compares multiple architectural approaches
- [ ] Provides evaluation methodology
- [ ] Includes reproducible results or open-source code
- [ ] Challenges conventional wisdom or reveals gaps

#### Bonus (Nice to Have):
- [ ] Longitudinal analysis or temporal trends
- [ ] Cross-domain insights (e.g., RAG + agents)
- [ ] Governance or ethical considerations embedded in architecture
- [ ] Novel evaluation frameworks

---

### 5. **Diversity & Balance**

#### Source Diversity:
- [ ] Mix of academic and industry papers (aim for 60/40 or 50/50)
- [ ] Multiple research groups (avoid over-representation from single source)
- [ ] Geographic diversity (US, Europe, Asia)
- [ ] Mix of established researchers and emerging voices

#### Topical Balance:
Target distribution (flexible):
- RAG & Retrieval: 25-30%
- Orchestration & Agents: 25-30%
- Evaluation & Reliability: 20-25%
- Governance & Safety: 10-15%
- Other (Infrastructure, Tools, etc.): 10-15%

#### Perspective Diversity:
- [ ] Papers that agree on approaches
- [ ] Papers that disagree or propose alternatives
- [ ] Critical/skeptical perspectives on current practices
- [ ] Papers from different application domains

---

### 6. **Practical Considerations**

#### Accessibility:
- [ ] Paper is publicly available (not behind paywall)
- [ ] Full text available as PDF
- [ ] English language (for processing simplicity)
- [ ] OCR quality is good (for PDF extraction)

#### Size & Scope:
- [ ] Typical length: 8-15 pages (conference papers)
- [ ] Can include longer papers (20-30 pages) if exceptionally relevant
- [ ] Short papers (4-6 pages) acceptable if they're dense with insights

#### Citation Impact:
- [ ] Has citations (indicates community interest) - but not required for recent papers
- [ ] Referenced in other papers in the corpus (creates network)
- [ ] Not required: papers can be included if they're high-quality but not yet widely cited

---

## Decision Framework

### Inclusion Decision Tree:

```
1. Is the paper about LLM system architecture? (Not just model internals)
   ├─ NO → Reject
   └─ YES → Continue
   
2. Does it address at least one research question?
   ├─ NO → Reject
   └─ YES → Continue
   
3. Is it from 2019 or later? (or is it a seminal pre-2019 paper?)
   ├─ NO → Reject
   └─ YES → Continue
   
4. Does it have clear architectural content? (diagrams, design discussions, trade-offs)
   ├─ NO → Reject (unless exceptionally strong on other criteria)
   └─ YES → Continue
   
5. Is it publicly accessible?
   ├─ NO → Reject
   └─ YES → Include
```

### Borderline Cases:
If unsure, ask:
- Would this paper help answer any research question?
- Does it provide unique architectural insights not found elsewhere?
- Would excluding it leave a significant gap in the corpus?

**If yes to any → Include**

---

## Initial Seed Papers (Examples to Start)

### Foundational RAG Papers:
- [ ] "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (Lewis et al., 2020)
- [ ] Recent papers on advanced RAG (multi-hop, agentic RAG, etc.)

### LLM System Architecture:
- [ ] Papers on LangChain, LlamaIndex architectures
- [ ] Papers on agent frameworks (AutoGPT, BabyAGI, etc.)
- [ ] Production system papers from major tech companies

### Orchestration & Agents:
- [ ] Papers on tool use and function calling
- [ ] Multi-agent collaboration frameworks
- [ ] ReAct, Plan-and-Execute, and similar patterns

### Evaluation:
- [ ] Papers on RAG evaluation methodologies
- [ ] Hallucination detection and mitigation
- [ ] Production failure mode analysis

### Governance:
- [ ] Papers on AI safety in production systems
- [ ] Auditability and explainability in LLM systems
- [ ] Compliance and regulatory considerations

---

## Collection Strategy

### Phase 1: Core Papers (Target: 20-30 papers)
1. Start with highly-cited foundational papers
2. Include representative papers from each focus area
3. Ensure mix of academic and industry sources
4. Prioritize papers with clear architectural content

### Phase 2: Expansion (Target: 30-60 papers)
1. Add papers that fill gaps in coverage
2. Include critical/alternative perspectives
3. Add recent papers (2024-2025) for current trends
4. Ensure topical balance

### Phase 3: Refinement (Target: 60-100 papers if needed)
1. Add papers revealed through citation analysis
2. Include papers that address emerging patterns
3. Add papers that challenge existing approaches
4. Ensure diversity of perspectives

---

## Tracking & Documentation

For each paper considered, document:
- [ ] **Title & Authors**
- [ ] **Year & Venue**
- [ ] **Type:** Academic / Industry
- [ ] **Focus Areas:** Which topics does it address?
- [ ] **Research Questions:** Which RQs does it support?
- [ ] **Decision:** Include / Exclude
- [ ] **Rationale:** Why included or excluded?
- [ ] **Notes:** Key insights or special considerations

This will be tracked in the **Literature Corpus** page in Notion (to be created).

---

## Quality Control

### Regular Reviews:
- After collecting first 20 papers → Review for balance
- After collecting first 40 papers → Review for gaps
- Before finalizing corpus → Comprehensive review

### Balance Checks:
- [ ] Academic vs. Industry ratio appropriate?
- [ ] All research questions adequately covered?
- [ ] Sufficient diversity of perspectives?
- [ ] Mix of seminal and recent papers?
- [ ] Geographic and institutional diversity?

---

## Next Steps

1. **Immediate:**
   - [ ] Review this criteria document
   - [ ] Refine/adjust criteria based on discussion
   - [ ] Finalize decision framework
   - [ ] Mark Task 1 as complete in Notion

2. **Following Task (Task 2):**
   - [ ] Create Literature Corpus tracking page in Notion
   - [ ] Begin identifying candidate papers
   - [ ] Apply these criteria to each candidate
   - [ ] Document decisions

---

## Open Questions for Discussion

1. **Academic vs. Industry Balance:** Should we aim for 50/50, or is 60/40 (academic/industry) better?

2. **ArXiv Papers:** How selective should we be with ArXiv preprints? Only from known labs/authors?

3. **Blog Posts:** Should technical blog posts be included, or only formal publications?

4. **Minimum Citation Threshold:** Should we require a minimum number of citations for papers older than 1 year?

5. **Language Models:** Should we focus only on GPT-3.5+ era models, or include GPT-2 era architectures?

6. **Corpus Size:** Start with 20-30 and expand, or aim for 50+ from the start?

7. **Contradictory Papers:** How many papers presenting opposing viewpoints should we include?

---

## Criteria Summary (Quick Reference)

✅ **Include if:**
- About LLM system architecture (not just model internals)
- Addresses ≥1 research question
- From 2019+ (or seminal pre-2019)
- Has architectural content (diagrams, trade-offs, design decisions)
- Publicly accessible PDF
- Academic (top venue) OR Industry (technical depth)

❌ **Exclude if:**
- Pure model training/benchmarking
- No architectural insights
- Behind paywall (unavailable)
- Poor PDF quality
- Marketing material without technical depth

---

**Status:** Ready for Review & Refinement  
**Next Action:** Discuss open questions and finalize criteria
