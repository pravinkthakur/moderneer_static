# Moderneer – Outcome Engineering

## Vision
Moderneer is a framework and SaaS toolkit that helps organisations move **beyond Agile** toward **Outcome Engineering** — a measurable discipline aligning engineering effort with business outcomes.  
**Slogan:** Transforming ideas into outcomes.

## Current Deployment Status (Phase 1 ✅ Complete)
- **Frontend:** https://moderneer.co.uk (GitHub Pages) – Static assessment tool
- **Backend API:** https://api.moderneer.co.uk (Vercel) – Data serving + versioning
- **Deployed:** October 17, 2025
- **Infrastructure:** Zero-cost (GitHub Pages + Vercel free tier)
- **Features:** 
  - Environment-aware data loading (local JSON in dev, API in production)
  - Automatic version tracking with git commit hash + UTC timestamp
  - CORS configured, SSL auto-provisioned
  - 6 REST endpoints: `/health`, `/version`, `/api/config|pillars|scales|rules`
- **Phase 2 Status:** Integration complete, testing in progress

## Core Idea
Agile mastery stops at process efficiency. Moderneer defines what comes next — quantifying how engineering connects to customer value, quality, and delivery speed.  
It provides a **maturity model**, **diagnostic engine**, and **improvement system** to evolve from activity to impact.

---

## Model Overview
- **Core 24 Parameters** – universal engineering foundations.  
- **Full 12 Pillars** – advanced differentiators for leading organisations.  
- **Levels 1–9** – progressive stages from ad hoc execution to engineered outcomes.  
- **Gates and Caps Logic** – gates enforce minimum criteria, caps restrict premature advancement.  
- Result: a single **Outcome Engineering Index (OEI)**.

---

## Levels Summary
| Level | Theme | Typical State |
|--------|--------|----------------|
| 1–2 | Ad hoc / Reactive | No metrics or repeatability |
| 3 | Defined | Basic Agile adoption and CI/CD |
| 4–5 | Predictable / Data-driven | Automation, shift-left testing, observability |
| 6–7 | Optimised | Platform mindset, customer metrics |
| 8–9 | Engineered Outcomes | Continuous alignment of tech, product, and business value |

---

## Principles
1. **Outcome before output** – business value over process metrics.  
2. **T-shaped leadership** – cross-domain accountability.  
3. **Shift-left quality** – engineers own end-to-end delivery.  
4. **Operational excellence** – low MTTR, high deploy frequency.  
5. **Composable architecture** – refactor legacy to modern modules.  
6. **AI-assisted evolution** – generate insights and next steps automatically.

---

## System Behaviour
- Inputs (yes/no or scored answers) feed a scoring engine.  
- Engine computes:  
  - Quantitative score  
  - Narrative explanation  
  - Recommended interventions  
- Supports Core vs Full mode.  
- Allows export as PDF/Word/PPT.  
- Includes Compute Score, Generate Narrative, and Show CSP buttons.  

---

## Philosophy
Outcome Engineering merges **technical**, **operational**, and **organisational** excellence.  
It replaces subjective Agile "health checks" with measurable maturity scoring.  
Even high-performing Agile teams typically cap around Level 3; Level 4+ indicates structural, data-driven alignment with outcomes.

---

## Implementation Vision
- **Frontend-first:** client-side computation, no backend dependency.  
- **AI-ready:** optional LLM integration for explanations.  
- **Presentation-ready:** narrative and charts export directly into slides.  
- **Design consistency:** follow brand assets (`colourfontasset.png`, `logo.jpg`).  

---

## User Journey
1. Choose assessment type (Core 24 or Full 12).  
2. Answer diagnostic questions.  
3. Compute maturity level (Gates/Caps applied).  
4. Generate visual chart and narrative.  
5. Export report for leadership or clients.  

---

## Target Users
- CTOs, VPs, Engineering & Product Leaders  
- Transformation and Delivery Excellence Heads  
- Consulting firms assessing digital maturity  

---

## Expected Outcomes
- Quantified maturity benchmarking.  
- Data-to-narrative storytelling for executives.  
- Framework to prioritise investment and improvement.  

---

## Future Extensions
- AI-driven auto-diagnosis.  
- Benchmark comparison database.  
- Role-based dashboards (Org / Team / Individual).  
- Predictive recommendations via historical data.

---

## Development Guidelines

> **Copilot instruction:**  
> When assisting, prioritise clarity, structure, and reproducibility.  
> Maintain factual tone, use Tailwind + ShadCN UI, ensure components remain modular.  
> Never alter model philosophy, levels, or Gates/Caps logic.  
> Generate only production-ready React/Next.js code consistent with this document.

---

## Architecture Context

### Current System Structure

**Frontend Repository: `moderneer_static`**
- Location: `c:\dev\moderneer_static`
- Static HTML/CSS/JS assessment application
- **Live Deployment:** https://moderneer.co.uk (GitHub Pages)
- Client-side scoring engine with Gates/Caps logic
- Environment-aware data loading:
  - **Development:** Reads from local JSON files
  - **Production:** Calls backend API at api.moderneer.co.uk
- Assessment tool: `/assessment/index.html`
- **Version tracking:** `/version.json` with buildNumber, timestamp, git commit

**Backend Repository: `moderneer-platform`**
- Location: `c:\dev\moderneer-platform`
- Microservices architecture (currently single service)
- Assessment Service: Node.js REST API (CommonJS)
- **Live Deployment:** Vercel at https://api.moderneer.co.uk
- **Infrastructure:**
  - DNS: A record → 76.76.21.21
  - SSL: Auto-provisioned by Vercel
  - CORS: Configured for moderneer.co.uk
- Serves assessment configuration data via REST API (6 endpoints):
  - `GET /health` - Service health check
  - `GET /version` - Version metadata with git commit + timestamp
  - `GET /api/config`, `/api/pillars`, `/api/scales`, `/api/rules`
- Stateless, JSON-based, no database (MVP)
- **Version tracking:** `/version` endpoint with git commit hash, UTC timestamp

### Repository Structure
```
c:\dev\
├── moderneer_static/          # Frontend (GitHub Pages)
│   ├── index.html            # Main website
│   ├── version.json          # ✨ Auto-generated version metadata
│   ├── update-version.ps1    # ✨ PowerShell script to update version on commit
│   ├── assessment/           # Assessment tool
│   │   ├── index.html
│   │   ├── data/             # JSON data files
│   │   │   ├── config.json
│   │   │   ├── pillars.json  (12 pillars)
│   │   │   ├── scales.json
│   │   │   └── rules.json    (gates/caps)
│   │   └── src/              # Frontend logic
│   │       ├── main.js
│   │       ├── data-loader.js  # ✨ Environment-aware API/local file loader
│   │       └── app/          # Core assessment engine
│   └── css/                  # Styling
│
└── moderneer-platform/        # Backend (Vercel)
    └── services/
        └── assessment-service/
            ├── api/
            │   └── index.js           # Node.js serverless function (CommonJS)
            ├── version.json           # ✨ Auto-generated version metadata
            ├── update-version.ps1     # ✨ PowerShell script to update version on commit
            └── data/              # Same JSON files as frontend
                ├── config.json
                ├── pillars.json
                ├── scales.json
                └── rules.json
```

### Versioning System
Both repositories include **automatic version tracking** on every commit:

**Backend (`moderneer-platform/services/assessment-service`):**
- **Endpoint:** `GET https://api.moderneer.co.uk/version`
- **Response:** 
  ```json
  {
    "success": true,
    "data": {
      "version": "1.0.0",
      "buildTime": "2025-10-17T11:58:03.372Z",
      "commitHash": "1001e2c",
      "branch": "main",
      "environment": "production",
      "serverTime": "2025-10-17T12:15:23.456Z"
    }
  }
  ```
- **Script:** `update-version.ps1` - Run before `git commit` to auto-update version.json

**Frontend (`moderneer_static`):**
- **Endpoint:** `GET https://moderneer.co.uk/version.json`
- **Response:** 
  ```json
  {
    "version": "3.1.0",
    "buildNumber": "202510171258",
    "buildDate": "2025-10-17T12:58:00Z",
    "gitCommit": "f6c39f8",
    "environment": "production",
    "features": ["assessment", "maturity-model", "advisory"]
  }
  ```
- **Script:** `update-version.ps1` - Run before `git commit` to auto-update version.json

**Usage Workflow:**
1. Make changes to code
2. Run `.\update-version.ps1` (in respective repo directory)
3. Script captures: git commit hash, UTC timestamp, branch name
4. Updates version.json with fresh metadata
5. Commit and push (version.json included in commit)
6. Deploy automatically updates `/version` endpoint

**Benefits:**
- Track exact build time to millisecond precision
- Correlate deployed version with git commit hash
- Debug production issues by matching version to code
- Monitor deployment freshness with serverTime
- Zero manual version management

### Migration Path
- **Phase 1 (✅ COMPLETE):** Static frontend + API backend serving data
  - Frontend: Self-contained, reads local JSON (development) OR API (production)
  - Backend: RESTful API serves same data structure
  - Status: ✅ Complete (both running independently)
  - **Deployed:** October 17, 2025
  - **URLs:** 
    - Frontend: https://moderneer.co.uk
    - Backend API: https://api.moderneer.co.uk
  - **Features:**
    - Automatic environment detection (localhost vs production)
    - CORS configured for cross-origin requests
    - SSL certificates auto-provisioned
    - Version tracking on every commit
    - Zero-cost infrastructure (Vercel + GitHub Pages free tier)

- **Phase 2 (IN PROGRESS):** Frontend calls API for dynamic config
  - Frontend calls `https://api.moderneer.co.uk/api/...` ✅ Implemented
  - Single source of truth for assessment data
  - Backend becomes authoritative data source
  - Real-time data updates without frontend redeployment
  - Status: ✅ Integration complete, testing in progress

- **Phase 3 (PLANNED):** Backend adds scoring engine, user auth, storage
  - Move scoring logic to backend
  - Add user authentication (Supabase/Auth0)
  - Store assessment results in database
  - User dashboards and history
  - Target: Q1 2026

- **Phase 4 (FUTURE):** Full SaaS platform with dashboards, benchmarking, AI
  - Multi-tenant architecture
  - Benchmark comparison across organizations
  - AI-driven narrative generation (OpenAI/Claude)
  - Predictive recommendations
  - Role-based dashboards (Org/Team/Individual)
  - Target: Q2-Q3 2026

---

## Model Integrity Rules

### 🚫 DO NOT MODIFY
1. **Levels 1-9 definitions** – fixed model structure
2. **Gates and Caps logic** – business rules for level calculation
3. **Core 24 vs Full 12 parameter distinction** – fundamental model choice
4. **Outcome Engineering Index (OEI) calculation** – scoring algorithm
5. **Pillar weights and structure** – model balance
6. **12 Pillars framework** – defined capability domains

### ✅ CAN EXTEND
1. New pillars (beyond 12) with justification and approval
2. Additional parameters within existing pillars
3. UI/UX improvements for assessment flow
4. Export formats and presentation templates
5. AI narrative generation enhancements
6. Analytics and benchmarking features
7. Integration with external tools (Jira, GitHub, etc.)

### 📝 MUST PRESERVE
- **Outcome-first philosophy** – every feature serves business value measurement
- **Measurable maturity** – subjective feelings converted to quantified levels
- **Progressive complexity** – Core → Full assessment modes
- **T-shaped accountability** – cross-functional ownership emphasized
- **Data structure consistency** – frontend and backend must stay in sync
- **Assessment integrity** – Gates/Caps logic produces consistent results

---

## Key Terminology

| Term | Definition |
|------|------------|
| **OEI** | Outcome Engineering Index – final maturity score (1-9) |
| **Pillar** | One of 12 major capability domains |
| **Parameter** | Measurable question within a pillar (24 Core, more in Full) |
| **Gate** | Minimum requirement to achieve a level |
| **Cap** | Maximum level achievable without meeting criteria |
| **Core 24** | Simplified assessment with 24 foundational parameters |
| **Full 12** | Complete assessment across all 12 pillars |
| **Shift-left** | Moving quality/security/testing earlier in delivery |
| **T-shaped** | Deep expertise in one area, broad knowledge across domains |
| **MTTR** | Mean Time To Recovery – operational excellence metric |

---

## Data Schema Contract

### JSON File Structure (Shared between Frontend & Backend)

**config.json**
```json
{
  "scoringBands": { ... },
  "features": { "coreOnly": boolean, "fullMode": boolean },
  "version": "string"
}
```

**pillars.json**
```json
{
  "pillars": [
    {
      "id": "string",
      "name": "string",
      "weight": number,
      "parameters": [ ... ],
      "outcomes": [ ... ]
    }
  ]
}
```

**scales.json**
```json
{
  "scales": [
    {
      "id": "string",
      "type": "5-point | percentage | time-based",
      "values": [ ... ]
    }
  ]
}
```

**rules.json**
```json
{
  "gates": [ ... ],
  "caps": [ ... ],
  "validation": [ ... ]
}
```

### API Contract (Backend Endpoints)

All endpoints return: `{ success: boolean, data: {...} }`

```
GET /health                  → Server health check
GET /api/config              → Assessment configuration
GET /api/pillars             → All 12 pillars
GET /api/pillars/:id         → Single pillar by ID
GET /api/scales              → All measurement scales
GET /api/scales/:id          → Single scale by ID
GET /api/rules               → All rules (gates/caps/validation)
GET /api/rules/gates         → Gate rules only
GET /api/rules/caps          → Cap rules only
GET /api/rules/validation    → Validation rules only
GET /api/metadata            → System metadata (counts, version)
```

---

## Development Workflow

### When Working on Frontend (`moderneer_static`)
1. ✅ Ensure changes don't break core assessment logic
2. ✅ Test Gates/Caps calculations locally
3. ✅ Maintain JSON schema compatibility
4. ✅ Follow brand guidelines (colors, fonts, logo)
5. ✅ Validate HTML/CSS/JS before deploy
6. ✅ Keep data files in sync with backend

### When Working on Backend (`moderneer-platform`)
1. ✅ Ensure API responses match frontend expectations
2. ✅ Keep data files in sync with frontend
3. ✅ Maintain endpoint contracts (no breaking changes)
4. ✅ Add tests for new endpoints
5. ✅ Update API documentation (ENDPOINT-ANALYSIS.md)
6. ✅ Version API changes appropriately

### When Modifying Assessment Model
1. 🚫 **DO NOT** change Gates/Caps logic without explicit approval
2. ✅ Update BOTH frontend and backend data files
3. ✅ Test scoring engine with new changes
4. ✅ Document changes in CHANGELOG
5. ✅ Update VISION.md if philosophy changes
6. ✅ Validate backward compatibility

---

## AI Assistant Guidelines

### When You (Copilot) Are Asked To Help:

**ALWAYS:**
- ✅ Reference this VISION.md for context
- ✅ Preserve model integrity (Levels, Gates, Caps)
- ✅ Keep frontend and backend data in sync
- ✅ Generate production-ready code (no placeholders)
- ✅ Follow TypeScript/JavaScript best practices
- ✅ Use Tailwind CSS + ShadCN UI for frontend
- ✅ Maintain RESTful API design for backend

**NEVER:**
- 🚫 Alter the 1-9 level structure
- 🚫 Change Gates/Caps business logic
- 🚫 Break API contracts (frontend depends on backend)
- 🚫 Add database dependencies without user approval
- 🚫 Generate placeholder code (`// TODO: implement`)
- 🚫 Modify OEI calculation formula

**ASK FIRST:**
- ❓ Adding new pillars or parameters
- ❓ Changing assessment scoring algorithm
- ❓ Introducing breaking changes to APIs
- ❓ Adding external dependencies (databases, auth, etc.)
- ❓ Altering model philosophy or principles

---

## Deployment Strategy

### Frontend (moderneer_static)
- **Platform:** GitHub Pages ✅ LIVE
- **URL:** https://moderneer.co.uk
- **Deploy:** `git push` to main branch → auto-deploys
- **DNS:** Configured via GitHub Pages settings
- **SSL:** Auto-managed by GitHub
- **Version Tracking:** Run `.\update-version.ps1` before commit

### Backend (moderneer-platform)
- **Platform:** Vercel ✅ LIVE
- **URL:** https://api.moderneer.co.uk
- **Deploy:** `git push` to main branch → auto-deploys via Vercel GitHub integration
- **DNS:** A record → 76.76.21.21 (configured October 17, 2025)
- **SSL:** Auto-managed by Vercel
- **Version Tracking:** Run `.\update-version.ps1` before commit (in services/assessment-service/)

### CORS Configuration
```javascript
// Backend allows frontend domain
Access-Control-Allow-Origin: *  // Currently open for testing
// Production: https://moderneer.co.uk, https://www.moderneer.co.uk
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 17, 2025 | Initial vision document created |
| 1.1 | Oct 17, 2025 | Added deployment status, versioning system, Phase 1 completion |

---

**Document Location:** `c:\dev\VISION.md` (root level for both repositories)  
**Status:** Living document – maintained as system evolves  
**Owner:** Pravin Thakur  
**Purpose:** Permanent context for AI assistance and team alignment

---

> 🎯 **This document serves as the single source of truth for the Moderneer system.**  
> All development decisions should align with this vision.  
> When in doubt, refer back to the principles and model integrity rules above.  
> **Version endpoints:** [Frontend](https://moderneer.co.uk/version.json) | [Backend](https://api.moderneer.co.uk/version)
