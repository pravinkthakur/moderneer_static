/**
 * Moderneer Assessment Data Models
 * Contains all the maturity model definitions and scales
 */

// Default purpose descriptions by prefix
export const DEFAULT_PURPOSE_BY_PREFIX = {
  "strat": "Strategic alignment drives outcome clarity and coordinated execution.",
  "cust": "Customer focus ensures problem-solution fit and sustainable value.",
  "prod": "Product strategy optimises discovery, validation, and market leverage.",
  "eng": "Engineering effectiveness enables predictable, quality delivery at speed.",
  "arch": "Architecture provides modularity, resilience, and platform velocity.",
  "sec": "Security ensures trust, compliance, and business continuity.",
  "docs": "Documentation enables knowledge sharing and reduces onboarding friction.",
  "org": "Organisation design aligns roles, accountability, and growth.",
  "econ": "Economics optimises spend, pricing, and resource allocation.",
  "data": "Data capabilities drive insight, automation, and decision quality.",
  "xp": "Experience focus ensures usability, performance, and inclusion."
};

// Scale catalog with anchors
export const SCALE_CATALOG = {
  "generic_0_5": {
    label: "Generic 0-5 Scale",
    purpose: "General assessment from none (0) to excellent (5).",
    anchors: [
      "0 = None/Not present",
      "1 = Basic/Ad hoc",
      "2 = Developing/Some structure", 
      "3 = Defined/Good practice",
      "4 = Managed/Consistent execution",
      "5 = Optimising/Excellent"
    ]
  },
  "generic_0_100": {
    label: "Generic 0-100% Scale", 
    purpose: "Percentage coverage or completion.",
    anchors: [
      "0% = No coverage",
      "20% = Minimal coverage",
      "40% = Partial coverage",
      "60% = Good coverage", 
      "80% = Comprehensive coverage",
      "100% = Complete coverage"
    ]
  }
};

// Parameter metadata
export const PARAM_META = {
  "strat.vision_outcomes": { tier: 1, popular: true },
  "strat.okr_rollup": { tier: 2, popular: true },
  "strat.funding_outcomes": { tier: 3, popular: true },
  "strat.executive_review": { tier: 4 },
  "cust.problem_discovery": { tier: 1, popular: true },
  "cust.segment_jobs": { tier: 2 },
  "cust.validation_methods": { tier: 3, popular: true },
  "cust.feedback_loops": { tier: 4, popular: true },
  "prod.discovery_process": { tier: 2, popular: true },
  "prod.bet_sizing": { tier: 3 },
  "prod.gtm_integration": { tier: 4 },
  "prod.portfolio_management": { tier: 5 },
  "eng.ci_cd": { tier: 1, popular: true },
  "eng.testing_pyramid": { tier: 2, popular: true },
  "eng.observability": { tier: 3, popular: true },
  "eng.incident_response": { tier: 4, popular: true }
  // Add more metadata as needed
};

// Main model definition
export const MODEL = {
  weights: {
    "Strategy & Executive Alignment": 15,
    "Customer & Outcome Alignment": 15,
    "Product Strategy, Discovery & GTM": 15,
    "Engineering Effectiveness": 20,
    "Architecture & Platform": 15,
    "Data & Insights": 20
  },
  core24: [
    "strat.vision_outcomes", "strat.okr_rollup", "strat.funding_outcomes", "strat.executive_review",
    "cust.problem_discovery", "cust.segment_jobs", "cust.validation_methods", "cust.feedback_loops",
    "prod.discovery_process", "prod.bet_sizing", "prod.gtm_integration", "prod.portfolio_management",
    "eng.ci_cd", "eng.testing_pyramid", "eng.observability", "eng.incident_response",
    "arch.modularity", "arch.resilience", "arch.platform_apis", "arch.infra_as_code",
    "data.data_quality", "data.analytics", "data.ml_ops", "data.governance"
  ],
  gates: [
    {
      id: "basic_delivery",
      label: "Basic delivery capability",
      params: ["eng.ci_cd", "eng.testing_pyramid"],
      threshold: 3.0,
      logical: "AND"
    },
    {
      id: "outcome_alignment", 
      label: "Outcome alignment established",
      params: ["strat.vision_outcomes", "cust.problem_discovery"],
      threshold: 3.0,
      logical: "AND"
    }
  ],
  caps: [
    {
      label: "Low automation caps delivery",
      params: ["eng.ci_cd"],
      logic: "LE",
      value: 2.0,
      cap: 3.5
    },
    {
      label: "Poor observability caps reliability", 
      params: ["eng.observability"],
      logic: "LE", 
      value: 2.0,
      cap: 3.5
    }
  ],
  fullModel: {
    pillars: [
      {
        name: "Strategy & Executive Alignment",
        parameters: ["strat.vision_outcomes", "strat.okr_rollup", "strat.funding_outcomes", "strat.executive_review"]
      },
      {
        name: "Customer & Outcome Alignment", 
        parameters: ["cust.problem_discovery", "cust.segment_jobs", "cust.validation_methods", "cust.feedback_loops"]
      },
      {
        name: "Product Strategy, Discovery & GTM",
        parameters: ["prod.discovery_process", "prod.bet_sizing", "prod.gtm_integration", "prod.portfolio_management"]
      },
      {
        name: "Engineering Effectiveness",
        parameters: ["eng.ci_cd", "eng.testing_pyramid", "eng.observability", "eng.incident_response"]
      },
      {
        name: "Architecture & Platform", 
        parameters: ["arch.modularity", "arch.resilience", "arch.platform_apis", "arch.infra_as_code"]
      },
      {
        name: "Data & Insights",
        parameters: ["data.data_quality", "data.analytics", "data.ml_ops", "data.governance"]
      }
    ],
    parameters: {
      "strat.vision_outcomes": {
        label: "Vision & outcome clarity",
        checks: [
          { label: "Vision statement exists and is measurable", type: "check", w: 25 },
          { label: "OKRs cascade from vision to teams", type: "check", w: 20 },
          { label: "Outcome metrics tracked regularly", type: "scale5", w: 20 },
          { label: "Progress reviewed monthly", type: "check", w: 15 },
          { label: "Success criteria defined upfront", type: "check", w: 10 },
          { label: "Stakeholder alignment documented", type: "check", w: 10 }
        ]
      },
      "strat.okr_rollup": {
        label: "OKR discipline & rollup",
        checks: [
          { label: "OKRs follow standard format", type: "check", w: 20 },
          { label: "Quarterly cadence maintained", type: "check", w: 20 },
          { label: "Team OKRs align to company OKRs", type: "scale5", w: 20 },
          { label: "Progress tracking automated", type: "check", w: 15 },
          { label: "Review meetings scheduled", type: "check", w: 15 },
          { label: "Scoring methodology consistent", type: "check", w: 10 }
        ]
      }
      // Simplified for demo - full model would have all parameters
    }
  }
};

export default MODEL;