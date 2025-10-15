# Assessment Data JSON Schema Proposal

## Overview
This document proposes a comprehensive JSON schema structure to externalize all assessment data from JavaScript code into configurable JSON files.

## Current Pain Points
- Assessment data is hardcoded in JavaScript files
- Difficult to update questions, weights, and logic without code changes
- No clear separation between data and application logic
- Hard to version control changes to assessment content
- Cannot easily create different assessment variants

## Proposed JSON File Structure

```
assessment/data/
├── config.json              # Main configuration
├── pillars.json             # Pillar definitions and weights
├── parameters.json          # All assessment parameters/questions
├── scales.json              # Scale definitions and anchors
├── rules.json               # Gates, caps, and validation rules
├── ui-config.json           # UI layout and presentation
├── metadata.json            # Question metadata and dependencies
└── localization/
    ├── en.json              # English text
    ├── es.json              # Spanish text (future)
    └── fr.json              # French text (future)
```

## 1. Main Configuration (`config.json`)

```json
{
  "version": "3.0.0",
  "name": "Engineering Excellence Maturity Assessment",
  "description": "Comprehensive assessment of engineering practices and organizational maturity",
  "created": "2025-01-01T00:00:00Z",
  "lastModified": "2025-10-14T00:00:00Z",
  "defaultLanguage": "en",
  "supportedLanguages": ["en"],
  "features": {
    "core24": true,
    "pillarView": true,
    "tierView": true,
    "radarChart": true,
    "fullReport": true,
    "llmIntegration": false
  },
  "ui": {
    "theme": "modern-2025",
    "layout": "grid",
    "compactMode": false
  }
}
```

## 2. Pillars Configuration (`pillars.json`)

```json
{
  "version": "3.0.0",
  "pillars": [
    {
      "id": "strategy-exec",
      "name": "Strategy & Executive Alignment",
      "description": "Strategic alignment and executive leadership practices",
      "weight": 8,
      "color": "#3B82F6",
      "icon": "strategy",
      "order": 1,
      "parameters": [
        "strat.okr_link",
        "strat.portfolio_review",
        "strat.exec_narrative",
        "strat.decision_reversible"
      ],
      "outcomes": {
        "description": "Clear strategy execution with measurable outcomes",
        "kpis": ["OKR alignment %", "Strategy execution velocity", "Decision quality"]
      }
    },
    {
      "id": "customer-outcome",
      "name": "Customer & Outcome Alignment", 
      "description": "Customer-centric practices and outcome focus",
      "weight": 12,
      "color": "#10B981",
      "icon": "users",
      "order": 2,
      "parameters": [
        "cust.proximity",
        "cust.kpi_literacy",
        "cust.problem_framing",
        "cust.outcome_trace"
      ],
      "outcomes": {
        "description": "Deep customer understanding driving product decisions",
        "kpis": ["Customer satisfaction", "Feature adoption rate", "Problem-solution fit"]
      }
    }
    // ... more pillars
  ],
  "pillarGroups": {
    "vision": [
      "strategy-exec", 
      "customer-outcome", 
      "product-strategy"
    ],
    "execution": [
      "engineering-effectiveness", 
      "architecture-platform", 
      "data-insights"
    ],
    "systems": [
      "delivery-flow",
      "reliability-security", 
      "experience-quality"
    ]
  }
}
```

## 3. Parameters/Questions (`parameters.json`)

```json
{
  "version": "3.0.0",
  "parameters": {
    "deliv.lead_time": {
      "id": "deliv.lead_time",
      "pillarId": "delivery-flow",
      "name": "Lead time for change",
      "description": "Time from commit to production deployment",
      "type": "composite",
      "tier": 1,
      "required": true,
      "order": 1,
      "checks": [
        {
          "id": "deliv.lead_time.dora_export",
          "type": "checkbox",
          "weight": 18,
          "label": "DORA/VCS export available (90d)",
          "helpText": "Automated metrics collection from version control system",
          "category": "measurement"
        },
        {
          "id": "deliv.lead_time.p95",
          "type": "scale5",
          "weight": 22,
          "label": "P95 lead time (lower is better)",
          "scaleRef": "p95_lead_time",
          "purpose": "Lower time ⇒ faster learning cycles",
          "category": "performance"
        },
        {
          "id": "deliv.lead_time.wip_limits",
          "type": "checkbox",
          "weight": 14,
          "label": "WIP limits enforced",
          "helpText": "Work in progress limits to optimize flow",
          "category": "process"
        }
      ],
      "validation": {
        "minChecked": 1,
        "requiredForTier": 2
      }
    }
  }
}
```

## 4. Scales Configuration (`scales.json`)

```json
{
  "version": "3.0.0",
  "scaleTypes": {
    "scale5": {
      "name": "5-point Scale",
      "description": "Standard 1-5 rating scale",
      "min": 1,
      "max": 5,
      "step": 1
    },
    "scale100": {
      "name": "Percentage Scale", 
      "description": "0-100 percentage scale",
      "min": 0,
      "max": 100,
      "step": 5,
      "suffix": "%"
    }
  },
  "scales": {
    "p95_lead_time": {
      "type": "scale5",
      "name": "P95 Lead Time",
      "description": "95th percentile lead time measurement",
      "purpose": "Measure deployment flow efficiency",
      "unit": "days",
      "lowerIsBetter": true,
      "anchors": [
        {
          "value": 5,
          "label": "< 1 day",
          "description": "Exceptional - sub-day deployment capability"
        },
        {
          "value": 4, 
          "label": "1-7 days",
          "description": "Good - weekly deployment rhythm"
        },
        {
          "value": 3,
          "label": "1-4 weeks", 
          "description": "Moderate - monthly deployment cycle"
        },
        {
          "value": 2,
          "label": "1-6 months",
          "description": "Poor - quarterly or slower deployments"
        },
        {
          "value": 1,
          "label": "> 6 months",
          "description": "Critical - very slow deployment capability"
        }
      ]
    }
  }
}
```

## 5. Rules Configuration (`rules.json`)

```json
{
  "version": "3.0.0",
  "gates": [
    {
      "id": "G1",
      "name": "Outcome Traceability Gate",
      "description": "Minimum outcome measurement capability",
      "label": "Outcome traceability ≥ 4",
      "parameters": ["cust.outcome_trace"],
      "logic": "AND",
      "threshold": 4.0,
      "operator": ">=",
      "blockingLevel": "band3",
      "rationale": "Cannot achieve higher maturity without outcome measurement"
    }
  ],
  "caps": [
    {
      "id": "C1", 
      "name": "Delivery Flow Cap",
      "description": "Cap overall score if delivery fundamentals are weak",
      "label": "Cap 2.4 if Lead time < 3 or Release < 3",
      "parameters": ["deliv.lead_time", "deliv.release_safety"],
      "logic": "OR",
      "capValue": 2.4,
      "conditions": [
        {
          "parameter": "deliv.lead_time",
          "operator": "<",
          "value": 3.0
        },
        {
          "parameter": "deliv.release_safety", 
          "operator": "<",
          "value": 3.0
        }
      ],
      "rationale": "Poor delivery flow prevents higher organizational maturity"
    }
  ],
  "validationRules": [
    {
      "id": "tier1_minimum",
      "name": "Tier 1 Minimum Requirements",
      "description": "Must complete basic tier 1 parameters",
      "parameters": ["deliv.lead_time", "eng.test_strategy"],
      "minimumCompliance": 0.8,
      "blockingLevel": "tier2"
    }
  ]
}
```

## 6. UI Configuration (`ui-config.json`)

```json
{
  "version": "3.0.0",
  "layout": {
    "assessmentView": {
      "defaultView": "pillar",
      "availableViews": ["pillar", "tier", "all"],
      "cardsPerRow": 3,
      "compactMode": false,
      "showProgress": true
    },
    "reportModal": {
      "defaultTab": "overall",
      "availableTabs": [
        "overall",
        "gates", 
        "pillars",
        "radar",
        "next",
        "exec",
        "narrative", 
        "full",
        "analyst"
      ],
      "enableFullReport": true,
      "enableRadarChart": true
    }
  },
  "styling": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#2C2C2C", 
    "accentColor": "#22D3EE",
    "cardStyle": "glassmorphism",
    "animationsEnabled": true
  },
  "features": {
    "helpTooltips": true,
    "progressIndicators": true,
    "autoSave": true,
    "exportOptions": ["json", "csv", "pdf", "markdown"]
  }
}
```

## 7. Metadata Configuration (`metadata.json`)

```json
{
  "version": "3.0.0", 
  "parameterMeta": {
    "eng.test_strategy": {
      "tier": 1,
      "popular": true,
      "purpose": "Establish quality gates and fast feedback loops",
      "dependsOn": [],
      "enables": ["eng.cicd", "deliv.flow_efficiency"],
      "category": "quality",
      "timeToImplement": "4-8 weeks",
      "difficulty": "medium",
      "roi": "high",
      "tags": ["testing", "quality", "automation"]
    }
  },
  "categories": {
    "measurement": {
      "name": "Measurement & Observability",
      "description": "Metrics, monitoring, and measurement practices",
      "color": "#8B5CF6"
    },
    "process": {
      "name": "Process & Workflow", 
      "description": "Team processes and workflow optimization",
      "color": "#06B6D4"
    }
  }
}
```

## Implementation Strategy

### Phase 1: Data Extraction
1. Create JSON schema files from current JavaScript data
2. Build data migration/validation utilities
3. Update data loader to use JSON instead of hardcoded data

### Phase 2: Dynamic Configuration  
1. Implement runtime JSON loading with validation
2. Add configuration hot-reloading for development
3. Create admin interface for data management

### Phase 3: Multi-tenancy
1. Support multiple assessment variants
2. Enable organization-specific customizations
3. Add version control for assessment configurations

## Benefits

1. **Maintainability**: Easy to update questions and logic without code changes
2. **Flexibility**: Support multiple assessment variants and customizations  
3. **Versioning**: Clear version control of assessment content
4. **Localization**: Easy to add multiple languages
5. **Validation**: Schema validation ensures data integrity
6. **Analytics**: Track changes and usage patterns
7. **Collaboration**: Non-technical stakeholders can contribute to content

## Migration Path

1. **Extract current data** to JSON files using the proposed schema
2. **Create data loaders** that maintain backward compatibility  
3. **Add validation** to ensure data integrity
4. **Test thoroughly** with existing functionality
5. **Remove hardcoded data** once JSON system is proven
6. **Add new features** like multi-language support and variants