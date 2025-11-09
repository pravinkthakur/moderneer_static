# Multi-Repository Assessment Flow Design

## Overview
Design for seamless flow from setup wizard → Edge CLI → OutcomeScore visualization with support for single repo and multi-repo (org) assessments.

---

## User Journey

### 1️⃣ Setup Phase (setup.html)
**User Actions:**
- Select or create customer
- Choose assessment type:
  - **Single Repo**: One repository to assess
  - **Organization**: Multiple repositories from same org
- Save configuration

**System Actions:**
```javascript
// Save to customer record via BFF
await bffClient.updateCustomer(customerId, {
  repositories: [
    { name: 'owner/repo1', url: '...' },
    { name: 'owner/repo2', url: '...' }
  ],
  assessmentType: 'organization' // or 'single'
});
```

**Output:**
- Customer ID
- CLI command with customerId
- Redirect option to launch OutcomeScore (once assessments exist)

---

### 2️⃣ Analysis Phase (Edge CLI)
**User Actions:**
```bash
# Single repo
edge repo analyze myrepo --customerId cus_abc123

# Organization (multiple repos)
edge org analyze myorg --customerId cus_abc123 --repos repo1,repo2,repo3
```

**System Actions:**
1. **Analyze each repository** → Generate assessment.json
2. **Upload to BFF** → Store in customer-service database

**API Calls:**
```javascript
// For each repo analyzed
POST /api/customer/:customerId/assessments
{
  "repositoryName": "owner/repo1",
  "repositoryUrl": "https://github.com/owner/repo1",
  "assessmentData": { /* full assessment.json */ },
  "metadata": {
    "analyzedAt": "2025-11-09T15:30:00Z",
    "edgeVersion": "2.1.0",
    "analysisType": "full"
  }
}

// OR bulk upload for org
POST /api/customer/:customerId/assessments/bulk
{
  "assessments": [
    { "repositoryName": "...", "assessmentData": {...} },
    { "repositoryName": "...", "assessmentData": {...} }
  ]
}
```

**Output:**
- Assessment IDs for each repo
- Success confirmation
- Direct link to view: `https://moderneer.co.uk/assessment/OutcomeScore.html?customerId=cus_abc123&view=org`

---

### 3️⃣ Visualization Phase (OutcomeScore.html)

**URL Patterns:**
```
# Single repo
/assessment/OutcomeScore.html?customerId=cus_abc123

# Organization view
/assessment/OutcomeScore.html?customerId=cus_abc123&view=org
```

**System Actions:**
1. **Load customer context:**
   ```javascript
   const customer = await bffClient.getCustomer(customerId);
   const assessments = await bffClient.getCustomerAssessments(customerId);
   ```

2. **Render UI based on assessment count:**
   - **Single assessment**: Standard single-repo view (current behavior)
   - **Multiple assessments**: Tabbed org view

**Tab Structure (Multi-Repo):**
```
┌─────────────────────────────────────────────────────────────┐
│ [🏢 Organization Overview] [Repo 1] [Repo 2] [Repo 3] [...] │
└─────────────────────────────────────────────────────────────┘
```

**Tab Types:**

#### 🏢 Organization Overview Tab
- **Aggregated Scores**: Average/median across all repos
- **Pillar Comparison**: Side-by-side pillar scores
- **Repository Rankings**: Best to worst by overall score
- **Trend Analysis**: If assessments have timestamps
- **Export**: Combined org-level report (PDF/Word)

#### Individual Repo Tabs
- **Full Assessment UI**: Same as single-repo view
- **Repository-specific scores**
- **Deep-dive into answers/evidence**
- **Per-repo export**

---

## Data Model

### Customer Record
```json
{
  "customerId": "cus_abc123",
  "companyName": "Acme Corp",
  "email": "tech@acme.com",
  "repositories": [
    {
      "name": "acme/frontend",
      "url": "https://github.com/acme/frontend"
    },
    {
      "name": "acme/backend",
      "url": "https://github.com/acme/backend"
    }
  ],
  "assessmentType": "organization",
  "createdAt": "2025-11-09T10:00:00Z",
  "updatedAt": "2025-11-09T15:30:00Z"
}
```

### Assessment Record
```json
{
  "assessmentId": "asmt_xyz789",
  "customerId": "cus_abc123",
  "repositoryName": "acme/frontend",
  "repositoryUrl": "https://github.com/acme/frontend",
  "assessmentData": {
    "pillars": { /* full assessment structure */ },
    "overallScore": 73,
    "metadata": {
      "analyzedAt": "2025-11-09T15:30:00Z",
      "edgeVersion": "2.1.0"
    }
  },
  "createdAt": "2025-11-09T15:30:00Z"
}
```

---

## Implementation Plan

### Phase 1: Backend API (BFF + Customer Service)
- [ ] Add `POST /api/customer/:id/assessments` - Save single assessment
- [ ] Add `POST /api/customer/:id/assessments/bulk` - Save multiple assessments
- [ ] Add `GET /api/customer/:id/assessments` - List all assessments for customer
- [ ] Add `GET /api/assessments/:assessmentId` - Get single assessment
- [ ] Add `DELETE /api/assessments/:assessmentId` - Delete assessment

### Phase 2: Edge CLI Integration
- [ ] Add `--customerId` flag to `edge repo analyze`
- [ ] Add `--customerId` flag to `edge org analyze`
- [ ] Implement assessment upload after analysis completes
- [ ] Generate shareable URL after upload
- [ ] Add bulk upload for org assessments

### Phase 3: Frontend (OutcomeScore.html)
- [ ] Add `?customerId=xxx` URL parameter support
- [ ] Implement customer context loader
- [ ] Auto-detect single vs multi-repo mode
- [ ] Enhance org-view.js:
  - Organization overview tab with aggregated scores
  - Dynamic tab rendering for each repo
  - Tab switching with data persistence
- [ ] Add "Load from Customer" button (alternative to file upload)

### Phase 4: Setup Wizard Enhancement
- [ ] Add "View Assessments" button in Step 3 (if assessments exist)
- [ ] Generate direct link to OutcomeScore with customerId
- [ ] Add assessment history viewer

---

## UI Mockups

### Organization Overview Tab
```
┌─────────────────────────────────────────────────────────┐
│  🏢 Acme Corp - Organization Assessment                  │
│  3 Repositories Analyzed                                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Overall Organization Score: 76 / 100                    │
│  ■■■■■■■■□□                                              │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Pillar Scores (Average)                           │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ 🚀 Leadership            82  ■■■■■■■■□□           │  │
│  │ 🏗️  Architecture          74  ■■■■■■■□□□           │  │
│  │ 🧪 Testing               71  ■■■■■■■□□□           │  │
│  │ 🔄 DevOps                79  ■■■■■■■■□□           │  │
│  │ ... (all 12 pillars)                              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Repository Comparison                             │  │
│  ├───────────────────────────────────────────────────┤  │
│  │ 1. acme/backend      ⭐ 81  [View Details →]      │  │
│  │ 2. acme/frontend     ⭐ 75  [View Details →]      │  │
│  │ 3. acme/mobile       ⭐ 72  [View Details →]      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  [📊 Export Combined Report] [📧 Share]                  │
└─────────────────────────────────────────────────────────┘
```

### Individual Repo Tab
```
┌─────────────────────────────────────────────────────────┐
│  [🏢 Org Overview] [• acme/frontend] [Repo 2] [Repo 3]  │
└─────────────────────────────────────────────────────────┘

(Standard single-repo assessment view)
```

---

## Edge Cases & Considerations

### Multiple Assessments for Same Repo
**Scenario:** User runs Edge multiple times on same repo
**Solution:** 
- Show version history dropdown
- Default to latest assessment
- Allow comparison between versions

### Partial Org Analysis
**Scenario:** User selects 5 repos in setup, but only analyzes 3
**Solution:**
- Show "Not analyzed yet" placeholders for missing repos
- Display last analyzed date for each repo

### Assessment Expiry
**Scenario:** Old assessments become stale
**Solution:**
- Add "age" indicator (e.g., "Analyzed 30 days ago")
- Warning for assessments > 90 days old
- "Re-run Analysis" button

### Large Organizations
**Scenario:** 50+ repositories
**Solution:**
- Paginate repo tabs (show 10 at a time)
- Add search/filter for repos
- Lazy-load assessment data per tab

---

## Migration Path

### For Existing Users (File Upload)
- ✅ Keep current file upload functionality
- ✅ Allow mixing: some repos from API, some from file upload
- Add "Save to Customer" button after file upload

### Backward Compatibility
- Single-repo flow remains unchanged
- File upload continues to work
- No breaking changes to existing URLs

---

## Success Metrics

✅ **User can complete full flow** without leaving browser
✅ **Setup → CLI → View** takes < 5 minutes
✅ **Org overview** provides actionable insights at a glance
✅ **Switching repos** is instant (no page reload)
✅ **Shareable URLs** work for stakeholders without context

---

## Questions to Resolve

1. **Authentication**: Should assessments be private? Require login?
2. **Data Retention**: How long to keep assessment history?
3. **Collaboration**: Can multiple users view same customer's assessments?
4. **Notifications**: Email when Edge completes analysis?
5. **Versioning**: Track assessment schema versions for compatibility?

