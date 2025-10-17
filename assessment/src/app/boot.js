/* Year */
document.addEventListener('DOMContentLoaded', function() {
  const yearEl = document.getElementById('yr');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }
});

/* ---------- Scales (with purpose/anchors) ---------- */
const SCALE_CATALOG = {
  p95_lead_time:{label:"P95 Lead Time",purpose:"Shorten idea→production to tighten feedback loops.",anchors:["0 = ≥20 days","1 = ~15 days","2 = ~10 days","3 = ~5 days","4 = ~2 days","5 = ≤1 day"]},
  deploy_frequency:{label:"Deployment Frequency",purpose:"Increase safe delivery cadence to reduce batch size.",anchors:["0 = Monthly","1 = Bi-weekly","2 = Weekly","3 = 2–3×/week","4 = Daily","5 = Hourly"]},
  change_failure_rate:{label:"Change Failure Rate",purpose:"Ship safely by reducing incidents per deployment.",anchors:["0 = ≥40%","2 = ~25%","3 = ~15%","4 = ~8%","5 = ≤5% (↑ is better)"]},
  ci_feedback_time:{label:"CI Feedback Time",purpose:"Tighten developer loop to enable small, frequent changes.",anchors:["0 = ≥60m","1 = 45m","2 = 30m","3 = 20m","4 = 15m","5 = ≤10m"]},
  mttr_scale:{label:"MTTR",purpose:"Recover fast to protect user outcomes & error budgets.",anchors:["0 = ≥2 days","2 = ~8h","3 = ~2h","4 = ~45m","5 = ≤15m"]},
  slo_coverage_pct:{label:"SLO Coverage %",purpose:"Ensure reliability is defined where it matters.",anchors:["0–100% of services with SLOs"]},
  lineage_coverage_pct:{label:"Outcome Lineage %",purpose:"Trace PR→Feature→Event→KPI to attribute impact.",anchors:["0–100% merged PRs with lineage"]},
  eng_cust_hours:{label:"Engineer–Customer Hours",purpose:"Bring engineers closer to users to reduce rework.",anchors:["0 = 0h/qtr","1 = 1h","2 = 2h","3 = 4h","4 = 6h","5 = ≥8h per engineer/quarter"]},
  tagging_coverage_pct:{label:"Tagging Coverage %",purpose:"Expose cost-to-serve for financial decisions.",anchors:["0–100% resources correctly tagged"]},
  generic_0_5:{label:"Maturity (0–5)",purpose:"Rate the maturity of this capability.",anchors:["0 = Not at all","1 = Ad-hoc","2 = Emerging","3 = Defined","4 = Managed","5 = Optimised"]},
  generic_0_100:{label:"Coverage % (0–100)",purpose:"Estimate current coverage/completeness.",anchors:["0% = none → 100% = fully covered"]}
};

const DEFAULT_PURPOSE_BY_PREFIX = {
  strat:"Align strategy to measurable outcomes and governance.",
  cust:"Wire customer evidence and KPIs into daily work.",
  prod:"De-risk bets via discovery, prioritisation and GTM readiness.",
  arch:"Shape systems for safe change and extensibility.",
  eng:"Automate build/test/deploy and enable paved paths.",
  deliv:"Improve flow metrics and release safety.",
  reliab:"Protect user outcomes with SLOs, incidents and budgets.",
  sec:"Bake security, privacy and compliance into the lifecycle.",
  docs:"Make decisions and knowledge discoverable and auditable.",
  org:"Enable empowered, accountable, outcome-owning teams.",
  econ:"Expose costs and link spend to value outcomes.",
  data:"Ensure trustworthy data/ML with SLAs and oversight.",
  xp:"Deliver fast, inclusive experiences with feedback loops."
};

/* ---------- Meta (tiers, depends, purpose) ---------- */
const PARAM_META = {
  "eng.test_strategy":{tier:1,popular:true,purpose:"Fast, trustworthy feedback at unit→e2e levels.",dependsOn:[]},
  "eng.code_review_gates":{tier:1,purpose:"Consistent code/security gates via PRs.",dependsOn:[]},
  "docs.code_api_docs":{tier:1,purpose:"Docs-as-code; discoverable & fresh.",dependsOn:[]},
  "org.role_triad":{tier:1,purpose:"Clear EM/PM/Design decision rights.",dependsOn:[]},
  "cust.kpi_literacy":{tier:1,purpose:"Teams read & act on KPIs; shared vocabulary.",dependsOn:[]},

  "deliv.lead_time":{tier:2,popular:true,purpose:"Shorten change lead time; primary flow signal.",dependsOn:["eng.test_strategy","eng.code_review_gates","eng.dev_workflow"]},
  "deliv.flow_efficiency":{tier:2,purpose:"Visualise queues; reduce wait vs work.",dependsOn:["deliv.lead_time"]},
  "eng.dev_workflow":{tier:2,purpose:"Reproducible local/cloud dev; fast bootstraps.",dependsOn:[]},
  "eng.cicd":{tier:2,popular:true,purpose:"Automated build/test/deploy; ship often & safely.",dependsOn:["eng.test_strategy","eng.dev_workflow"]},
  "arch.modularity":{tier:2,purpose:"Right-sized modules/services to limit blast radius.",dependsOn:[]},

  "deliv.release_safety":{tier:3,popular:true,purpose:"Progressive delivery, flags, rollback.",dependsOn:["eng.cicd"]},
  "reliab.incident_mgmt":{tier:3,purpose:"Coordinated response; RCAs & drills.",dependsOn:["arch.obs_by_design"]},
  "reliab.mttr_budget":{tier:3,popular:true,purpose:"Error budgets policies + MTTR tracking.",dependsOn:["arch.obs_by_design","reliab.incident_mgmt"]},
  "arch.obs_by_design":{tier:3,popular:true,purpose:"Golden signals, tracing & runbooks.",dependsOn:[]},

  "cust.proximity":{tier:4,popular:true,purpose:"Engineers meet users; evidence flows in.",dependsOn:[]},
  "cust.outcome_trace":{tier:4,popular:true,purpose:"PR→Feature→Event→KPI lineage for attribution.",dependsOn:["data.data_sla_lineage"]},
  "reliab.slos_product":{tier:4,popular:true,purpose:"Product-relevant SLOs & budget policy.",dependsOn:["arch.obs_by_design"]},
  "prod.discovery":{tier:4,purpose:"Derisk bets via experiments & guardrails.",dependsOn:["cust.problem_framing"]},
  "cust.problem_framing":{tier:4,purpose:"Evidence-first problem statements.",dependsOn:[]},

  "econ.cost_to_serve":{tier:5,popular:true,purpose:"Cost per request/segment drives choices.",dependsOn:["eng.iac_gitops","eng.cloud_enable"]},
  "econ.squad_budget":{tier:5,purpose:"Local budget ownership & reallocation.",dependsOn:["econ.cost_to_serve"]},
  "data.data_sla_lineage":{tier:5,purpose:"Data contracts, lineage & quality SLAs.",dependsOn:[]},
  "arch.api_product":{tier:5,purpose:"API as product: SLAs, adoption, analytics.",dependsOn:["arch.modularity"]},

  "prod.gtm_readiness":{tier:6,purpose:"Enablement, support & rollback plans.",dependsOn:["deliv.release_safety"]},
  "econ.finops":{tier:6,purpose:"Policy-driven cloud savings & forecasts.",dependsOn:["econ.cost_to_serve","eng.iac_gitops"]},
  "data.model_lifecycle":{tier:6,purpose:"Drift monitors, rollback, cadence.",dependsOn:["data.data_sla_lineage"]},
  "data.responsible_ai":{tier:6,purpose:"Fairness, HITL, auditability.",dependsOn:["data.model_lifecycle"]},
  "xp.perf_budgets_rum":{tier:6,popular:true,purpose:"Perceived perf tied to KPIs.",dependsOn:["eng.cicd"]},
  "xp.accessibility":{tier:6,purpose:"Inclusive usage (WCAG).",dependsOn:[]},
  "xp.i18n_l10n":{tier:6,purpose:"Global readiness.",dependsOn:[]},
  "xp.support_integration":{tier:6,purpose:"Close loop with Customer Support.",dependsOn:[]},
  "strat.okr_link":{tier:6,popular:true,purpose:"Connect strategy→OKRs→metrics; governance.",dependsOn:["cust.kpi_literacy"]},
  "strat.portfolio_review":{tier:6,purpose:"Evidence-based allocation/kill.",dependsOn:["cust.outcome_trace","reliab.slos_product"]},
  "strat.exec_narrative":{tier:6,purpose:"Single story across customer, tech, finance.",dependsOn:[]},
  "strat.decision_reversible":{tier:6,purpose:"Fast, reversible decisions.",dependsOn:["docs.adrs_quality"]},
  "deliv.planning_adapt":{tier:6,purpose:"Metrics-driven replanning cadence.",dependsOn:["strat.okr_link"]},
  "arch.evolutionary":{tier:6,purpose:"Fitness functions in CI; guided change.",dependsOn:["eng.test_strategy","eng.cicd"]},
  "eng.iac_gitops":{tier:6,purpose:"Infra as code; drift & policy control.",dependsOn:[]},
  "eng.cloud_enable":{tier:6,purpose:"Paved paths, managed services, guardrails.",dependsOn:[]},
  "reliab.anomaly":{tier:6,purpose:"Change-aware alerting, fatigue control.",dependsOn:["arch.obs_by_design"]},
  "sec.secure_coding":{tier:6,popular:true,purpose:"Supply chain & code security.",dependsOn:["eng.cicd"]},
  "sec.privacy_data":{tier:6,purpose:"Lawful, safe data usage.",dependsOn:["data.data_sla_lineage"]},
  "sec.compliance_evidence":{tier:6,purpose:"Evidence-as-code, audit-ready.",dependsOn:["eng.cicd"]},
  "sec.runtime_ir":{tier:6,purpose:"Detect/contain/respond.",dependsOn:["reliab.incident_mgmt"]},
  "docs.knowledge_onboarding":{tier:6,purpose:"Reduce time-to-first-PR.",dependsOn:["docs.code_api_docs"]},
  "docs.adrs_quality":{tier:6,popular:true,purpose:"Decision quality, reversals & traceability.",dependsOn:[]},
  "docs.audit_trace":{tier:6,purpose:"End-to-end accountability.",dependsOn:[]},
  "org.team_autonomy":{tier:6,purpose:"Own problem→ops within guardrails.",dependsOn:["org.role_triad"]},
  "org.growth_calibration":{tier:6,purpose:"Fair, evidence-based growth.",dependsOn:[]},
  "org.leadership_behaviour":{tier:6,purpose:"Unblockers; outcome-first leadership.",dependsOn:[]},
  "econ.pricing_levers":{tier:6,purpose:"Telemetry-informed pricing tests.",dependsOn:["data.analytics_selfserve"]},
  "prod.prioritisation":{tier:6,purpose:"Value/risk sequencing tied to OKRs.",dependsOn:["cust.problem_framing"]},
  "prod.roadmapping":{tier:6,purpose:"Outcome-based, scenario-aware plans.",dependsOn:["strat.okr_link"]},
  "data.analytics_selfserve":{tier:6,purpose:"Speed to insight; self-serve.",dependsOn:["data.data_sla_lineage"]}
};

/* ---------- Model (weights, gates, caps) ---------- */
const MODEL = {
  weights: {
    "Strategy & Executive Alignment": 8,
    "Customer & Outcome Alignment": 12,
    "Product Strategy, Discovery & GTM": 10,
    "Architecture & Extensibility": 8,
    "Engineering & Platform Automation": 12,
    "Delivery Flow & Velocity": 12,
    "Reliability, Security & Compliance": 14,
    "Documentation, Decisioning & Traceability": 4,
    "Organisation, Leadership & Autonomy": 6,
    "Outcome Economics & Finance": 4,
    "Data & AI Lifecycle": 6,
    "Experience Quality & Market Readiness": 4
  },
  gates: [
    { id:"G1", label:"Outcome traceability ≥ 4", params:["cust.outcome_trace"], logical:"AND", threshold:4.0 },
    { id:"G2", label:"Lead time ≥ 4 AND Release safety ≥ 4", params:["deliv.lead_time","deliv.release_safety"], logical:"AND", threshold:4.0 },
    { id:"G3", label:"SLOs & MTTR ≥ 4", params:["reliab.slos_product","reliab.mttr_budget"], logical:"AND", threshold:4.0 },
    { id:"G4", label:"Customer proximity & KPI literacy ≥ 4", params:["cust.proximity","cust.kpi_literacy"], logical:"AND", threshold:4.0 },
    { id:"G5", label:"Strategy→OKR ≥ 3.5", params:["strat.okr_link"], logical:"AND", threshold:3.5 },
    { id:"G6", label:"Cost-to-serve & Squad budget ≥ 3.5", params:["econ.cost_to_serve","econ.squad_budget"], logical:"AND", threshold:3.5 }
  ],
  caps: [
    { label:"Cap 2.4 if Lead time < 3 or Release < 3", params:["deliv.lead_time","deliv.release_safety"], logic:"OR", cap:2.4, lt:3.0 },
    { label:"Cap 2.9 if Customer proximity ≤ 2", params:["cust.proximity"], logic:"LE", cap:2.9, value:2.0 },
    { label:"Cap 3.0 if Outcome traceability ≤ 2", params:["cust.outcome_trace"], logic:"LE", cap:3.0, value:2.0 }
  ],
  core24: [
    "strat.okr_link","strat.portfolio_review",
    "cust.proximity","cust.outcome_trace",
    "prod.discovery","prod.gtm_readiness",
    "arch.obs_by_design","arch.api_product",
    "eng.test_strategy","eng.cicd","eng.iac_gitops","eng.cloud_enable",
    "deliv.lead_time","deliv.release_safety","deliv.flow_efficiency",
    "reliab.mttr_budget","reliab.slos_product","sec.secure_coding",
    "docs.adrs_quality","org.team_autonomy",
    "econ.cost_to_serve","econ.squad_budget",
    "data.data_sla_lineage","xp.perf_budgets_rum"
  ],
  fullModel: {
    pillars: [
      { name:"Strategy & Executive Alignment", parameters:["strat.okr_link","strat.portfolio_review","strat.exec_narrative","strat.decision_reversible"] },
      { name:"Customer & Outcome Alignment", parameters:["cust.proximity","cust.kpi_literacy","cust.problem_framing","cust.outcome_trace"] },
      { name:"Product Strategy, Discovery & GTM", parameters:["prod.discovery","prod.prioritisation","prod.roadmapping","prod.gtm_readiness"] },
      { name:"Architecture & Extensibility", parameters:["arch.modularity","arch.evolutionary","arch.api_product","arch.obs_by_design"] },
      { name:"Engineering & Platform Automation", parameters:["eng.test_strategy","eng.code_review_gates","eng.dev_workflow","eng.cicd","eng.iac_gitops","eng.cloud_enable"] },
      { name:"Delivery Flow & Velocity", parameters:["deliv.lead_time","deliv.release_safety","deliv.flow_efficiency","deliv.planning_adapt"] },
      { name:"Reliability, Security & Compliance", parameters:["reliab.incident_mgmt","reliab.mttr_budget","reliab.slos_product","reliab.anomaly","sec.secure_coding","sec.privacy_data","sec.compliance_evidence","sec.runtime_ir"] },
      { name:"Documentation, Decisioning & Traceability", parameters:["docs.code_api_docs","docs.knowledge_onboarding","docs.adrs_quality","docs.audit_trace"] },
      { name:"Organisation, Leadership & Autonomy", parameters:["org.role_triad","org.team_autonomy","org.growth_calibration","org.leadership_behaviour"] },
      { name:"Outcome Economics & Finance", parameters:["econ.cost_to_serve","econ.squad_budget","econ.pricing_levers","econ.finops"] },
      { name:"Data & AI Lifecycle", parameters:["data.data_sla_lineage","data.model_lifecycle","data.responsible_ai","data.analytics_selfserve"] },
      { name:"Experience Quality & Market Readiness", parameters:["xp.perf_budgets_rum","xp.accessibility","xp.i18n_l10n","xp.support_integration"] }
    ],
    parameters: {
      "deliv.lead_time": { label:"Lead time for change", checks:[
        {type:"check",  w:18, label:"DORA/VCS export available (90d)"},
        {type:"scale5", w:22, label:"P95 lead time (lower is better)", scaleRef:"p95_lead_time", purpose:"Lower time ⇒ faster learning cycles."},
        {type:"check",  w:14, label:"WIP limits enforced"},
        {type:"check",  w:12, label:"Blocker ageing alerts"},
        {type:"check",  w:10, label:"Small PR policy"},
        {type:"check",  w:8,  label:"Pair/mob or PR-buddy rotation"},
        {type:"check",  w:8,  label:"Trunk-based or short-lived branches"},
        {type:"check",  w:8,  label:"Weekly review of slowest 10% PRs"}
      ]},
      "eng.test_strategy": { label:"Test strategy", checks:[
        {type:"check",  w:18, label:"Test pyramid ratios documented"},
        {type:"check",  w:16, label:"CI enforces min test gates"},
        {type:"check",  w:12, label:"Contract tests between services"},
        {type:"check",  w:10, label:"Test data mgmt (synthetic/anonymised)"},
        {type:"check",  w:10, label:"Flake tracking & quarantine"},
        {type:"check",  w:10, label:"Performance tests for critical paths"},
        {type:"check",  w:8,  label:"AI-assisted/mutation testing used"},
        {type:"scale5", w:16, label:"Median CI feedback time (lower is better)", scaleRef:"ci_feedback_time", purpose:"Tight loop enables small batches."}
      ]},
      "reliab.mttr_budget": { label:"MTTR & error budgets", checks:[
        {type:"check",  w:16, label:"Error budgets defined per service"},
        {type:"check",  w:14, label:"Budget burn dashboard live"},
        {type:"check",  w:12, label:"Budget policy (throttle/gate) documented"},
        {type:"check",  w:14, label:"≥2 policy activations last quarter"},
        {type:"scale5", w:22, label:"Incident MTTR (lower is better)", scaleRef:"mttr_scale", purpose:"Faster recovery protects outcomes."},
        {type:"check",  w:8,  label:"Auto-page/auto-ticket wired"},
        {type:"check",  w:8,  label:"Budget breaches reviewed in planning"},
        {type:"check",  w:6,  label:"Incident playbooks link to budget view"}
      ]},
      "reliab.slos_product": { label:"SLOs & product impact", checks:[
        {type:"check",   w:16, label:"SLOs defined (latency/errors/availability)"},
        {type:"check",   w:14, label:"SLOs declared in code/config"},
        {type:"check",   w:14, label:"Error budget tied to release gating"},
        {type:"check",   w:12, label:"Customer impact quantified (rev at risk)"},
        {type:"check",   w:10, label:"Runbooks link from SLO alerts"},
        {type:"check",   w:10, label:"SLO reviews in PM & on-call rituals"},
        {type:"scale100",w:24, label:"SLO coverage % (higher is better)", scaleRef:"slo_coverage_pct", purpose:"Wider coverage ⇒ reliability by design."}
      ]},
      "cust.proximity": { label:"Customer proximity", checks:[
        {type:"scale5",  w:28, label:"Engineer–customer hours (higher is better)", scaleRef:"eng_cust_hours", purpose:"Direct exposure prevents rework."},
        {type:"check",   w:16, label:"Engineers join discovery/shadow sessions"},
        {type:"check",   w:12, label:"Notes linked to backlog items"},
        {type:"check",   w:12, label:"Quarterly pipeline of sessions planned"},
        {type:"check",   w:10, label:"Post-release sessions / support ride-alongs"},
        {type:"check",   w:8,  label:"Recordings accessible to squad"},
        {type:"check",   w:7,  label:"Finding→change linkage logged"},
        {type:"check",   w:7,  label:"Quarterly roll-up of insights & actions"}
      ]},
      "cust.outcome_trace": { label:"Outcome traceability (PR→Feature→Event→KPI)", checks:[
        {type:"check",   w:16, label:"Event schema in PRs (owner, fields, KPI)"},
        {type:"check",   w:14, label:"Deploy SHA joined to event stream"},
        {type:"check",   w:12, label:"Flag/experiment ID linked to PR"},
        {type:"check",   w:12, label:"KPI chart linked in PR/ticket"},
        {type:"check",   w:12, label:"Automated lineage view exists"},
        {type:"scale100",w:22, label:"Lineage coverage % (higher is better)", scaleRef:"lineage_coverage_pct", purpose:"Attribution coverage."},
        {type:"check",   w:7,  label:"Attribution notes: expected vs actual delta"},
        {type:"check",   w:5,  label:"Event data quality checks & alerts"}
      ]},
      "eng.cicd": { label:"CI/CD maturity", checks:[
        {type:"check",  w:16, label:"Pipeline as code with reviews"},
        {type:"check",  w:16, label:"Automated deploy to prod/staging"},
        {type:"check",  w:14, label:"Post-deploy verification (smoke/health/KPIs)"},
        {type:"check",  w:12, label:"Feature flags supported"},
        {type:"check",  w:10, label:"Canary/blue-green available"},
        {type:"check",  w:10, label:"Automated rollback hook"},
        {type:"scale5", w:12, label:"Deployment frequency (higher is better)", scaleRef:"deploy_frequency", purpose:"Smaller batches, lower risk."},
        {type:"scale5", w:10, label:"Change failure rate (lower is better)", scaleRef:"change_failure_rate", purpose:"Safety of delivery."}
      ]},
      "econ.cost_to_serve": { label:"Cost-to-serve visibility", checks:[
        {type:"check",   w:18, label:"Tagging standards implemented"},
        {type:"check",   w:14, label:"Dashboard: cost per request/segment"},
        {type:"check",   w:12, label:"Allocation method documented"},
        {type:"check",   w:12, label:"Trends vs SLO compliance visible"},
        {type:"check",   w:10, label:"Alerts on anomaly spikes"},
        {type:"check",   w:10, label:"Monthly review in squad & product forums"},
        {type:"scale100",w:14, label:"Tagging coverage % (higher is better)", scaleRef:"tagging_coverage_pct", purpose:"Transparency of spend."},
        {type:"check",   w:10, label:"Accuracy spot-checks performed"}
      ]},

      /* Remaining parameters (auto-profiled) */
      "strat.okr_link": { label:"Strategy → OKR linkage", checks:[
        {label:"Strategy tree documented & versioned"},{label:"≥80% squads have OKRs with owners & dates"},
        {label:"OKR quality rubric ≥ 3/5 per squad"},{label:"Quarterly OKR reviews with minutes"},
        {label:"Each KR links to instrumented metric"},{label:"Dependencies mapped; cross-team alignment"},
        {label:"Outcome deltas recorded post-quarter"},{label:"OKR registry searchable (tags)"}
      ]},
      "strat.portfolio_review": { label:"Portfolio bet review", checks:[
        {label:"Quarterly portfolio review held"},{label:"Bets framed with expected KPI uplift ranges"},
        {label:"Evidence pack template used"},{label:"% budget reallocated based on evidence"},
        {label:"Kill/continue decisions logged"},{label:"Risks/assumptions register updated"},
        {label:"Scenario analysis for top bets"},{label:"Portfolio dashboard org-visible"}
      ]},
      "strat.exec_narrative": { label:"Executive single narrative", checks:[
        {label:"Narrative links customer/tech/finance"},{label:"Versioned & refreshed quarterly"},
        {label:"Referenced in exec reviews/QBRs"},{label:"KPIs aligned to narrative themes"},
        {label:"Org-wide accessible/searchable"},{label:"Feedback loop to update"}
      ]},
      "strat.decision_reversible": { label:"Decision cadence & reversibility", checks:[
        {label:"ADRs mandatory for key decisions"},{label:"Decision latency tracked"},
        {label:"Reversal protocol defined"},{label:"Reversal yield measured"},
        {label:"Sunset/stop criteria documented"},{label:"Periodic retro on major decisions"}
      ]},
      "cust.kpi_literacy": { label:"KPI literacy", checks:[
        {label:"KPI registry with owners & formulas"},{label:"KPI quiz ≥ threshold"},
        {label:"Work items link to target KPI"},{label:"KPI dashboards in rituals"},
        {label:"Pre-release KPI forecast captured"},{label:"Post-release delta reviewed"}
      ]},
      "cust.problem_framing": { label:"Problem framing", checks:[
        {label:"Opportunity solution tree maintained"},{label:"Assumptions log with tests"},
        {label:"Impact sizing documented"},{label:"Customer evidence attached"},
        {label:"Alternatives compared"},{label:"Triad-approved problem statement"}
      ]},
      "prod.discovery": { label:"Discovery & experiments", checks:[
        {label:"Experiment template with hypothesis & MDE"},{label:"Decision log links outcomes to experiments"},
        {label:"Interview schedule & participant sourcing"},{label:"Guardrail metrics defined"},
        {label:"A/B or cohort platform with audit"},{label:"Median time-to-insight ≤ 14 days"},
        {label:"Quarterly kill-rate reported"},{label:"Opportunity solution trees up to date"}
      ]},
      "prod.prioritisation": { label:"Prioritisation method", checks:[
        {label:"Impact/risk/confidence/TTV scored"},{label:"Option value or sequencing captured"},
        {label:"Assumptions & ranges explicit"},{label:"Result ties to strategy/OKRs"},
        {label:"Periodic re-prioritisation"},{label:"Decision log linked"}
      ]},
      "prod.roadmapping": { label:"Roadmapping", checks:[
        {label:"Outcome-based roadmap"},{label:"Dependencies & risks mapped"},
        {label:"Replan cycle ≤ quarterly"},{label:"Scenario/guardrails defined"},
        {label:"Capacity assumptions listed"},{label:"Public, versioned roadmap"}
      ]},
      "prod.gtm_readiness": { label:"Go-to-market readiness", checks:[
        {label:"Launch playbook approved"},{label:"Cohorting plan & ramp schedule"},
        {label:"Enablement docs/demo/training"},{label:"Support runbook & taxonomy ready"},
        {label:"Pricing/packaging w/ telemetry"},{label:"Readiness gates passed"},
        {label:"Rollback/comms plan rehearsed"},{label:"Post-launch metrics owner set"}
      ]},
      "arch.modularity": { label:"Modularity", checks:[
        {label:"Domain/capability map defined"},{label:"Service/module boundaries documented"},
        {label:"Ownership per module clear"},{label:"Change blast radius measured"},
        {label:"Dependency graph maintained"},{label:"Refactoring backlog exists"}
      ]},
      "arch.evolutionary": { label:"Evolutionary architecture", checks:[
        {label:"Fitness functions defined"},{label:"Fitness tests in CI"},
        {label:"Architecture runway documented"},{label:"Policy failures tracked"},
        {label:"Refactor budget set"},{label:"Architecture reviews regular"}
      ]},
      "arch.api_product": { label:"API productisation", checks:[
        {label:"OpenAPI/IDL versioned"},{label:"Contract tests in CI"},
        {label:"SLAs/SLOs defined"},{label:"API portal with docs/examples"},
        {label:"SDKs/client libraries maintained"},{label:"Usage analytics dashboard"},
        {label:"Quota/auth policies enforced"},{label:"Onboarding time ≤ target"}
      ]},
      "arch.obs_by_design": { label:"Observability by design", checks:[
        {label:"Golden signals selected per service"},{label:"SLOs defined in code/config"},
        {label:"Tracing enabled on critical paths"},{label:"Logs/metrics/traces correlation (traceID)"},
        {label:"Dashboards reviewed in on-call & planning"},{label:"Alert runbooks linked"},
        {label:"Telemetry coverage reported"},{label:"Synthetic checks or RUM enabled"}
      ]},
      "eng.code_review_gates": { label:"Code review & gates", checks:[
        {label:"Peer review required"},{label:"Static checks/lint/format enforced"},
        {label:"Quality/security gates on PR"},{label:"AI assist guardrails"},
        {label:"Review SLA tracked"},{label:"Rollback/test evidence in PR"}
      ]},
      "eng.dev_workflow": { label:"Dev workflow", checks:[
        {label:"Dev containers or cloud IDE"},{label:"PR previews with seeded data"},
        {label:"One-command bootstrap"},{label:"Local/prod parity documented"},
        {label:"Toolchain version pinning"},{label:"Setup time ≤ target"}
      ]},
      "eng.iac_gitops": { label:"IaC & GitOps", checks:[
        {label:"Infra provisioned via code"},{label:"Infra changes via PR only"},
        {label:"GitOps controller & drift detection"},{label:"Policy as code with audit"},
        {label:"Secrets management integrated & scanned"},{label:"Ephemeral envs via PR"},
        {label:"Infra cost tags enforced"},{label:"Drift incidents tracked with MTTR"}
      ]},
      "eng.cloud_enable": { label:"Cloud & stack enablement", checks:[
        {label:"Paved path templates (service/worker/job/UI)"},{label:"Managed services catalogue"},
        {label:"Golden path docs with SLA"},{label:"Per-squad infra control with guardrails"},
        {label:"Standard telemetry baked into templates"},{label:"PR preview envs with URLs"},
        {label:"Adoption metrics published"},{label:"Legacy stack decommission rules"}
      ]},
      "deliv.release_safety": { label:"Release cadence & safety", checks:[
        {label:"Feature flags in production"},{label:"Canary with automated health gates"},
        {label:"Rollback rehearsal ≤ 15 min"},{label:"Blast radius control (cohorting/%)"},
        {label:"Deployment frequency targets"},{label:"Release freeze rules tied to SLO burn"},
        {label:"CAB equivalence pack (if regulated)"},{label:"Post-release KPI check ≤ 24h"}
      ]},
      "deliv.flow_efficiency": { label:"Flow efficiency & WIP", checks:[
        {label:"Value stream map maintained"},{label:"Flow efficiency metric tracked"},
        {label:"Constraint register with owners"},{label:"Auto-flags for blocked >24h"},
        {label:"Swimlanes & policies for expedite"},{label:"Arrival/departure rate dashboard"},
        {label:"Queue age visualised"},{label:"Monthly Kaizen on top constraint"}
      ]},
      "deliv.planning_adapt": { label:"Planning cadence & adaptability", checks:[
        {label:"Quarterly OKRs set & tracked"},{label:"Decision records maintained"},
        {label:"Weekly evidence review (metrics)"},{label:"Replan rules documented"},
        {label:"Stakeholder comms cadence"},{label:"Risk/assumption updates"}
      ]},
      "reliab.incident_mgmt": { label:"Incident management", checks:[
        {label:"On-call rota & escalation"},{label:"Blameless RCA template used"},
        {label:"Runbooks per top alerts"},{label:"Drills/table-tops held"},
        {label:"Action items tracked to closure"},{label:"Incident metrics dashboard"}
      ]},
      "reliab.anomaly": { label:"Anomaly detection", checks:[
        {label:"Alert thresholds tuned"},{label:"Change-aware alerting (deploy link)"},
        {label:"False positive rate monitored"},{label:"Context enrichment (runbook/owner)"},
        {label:"ML/heuristics evaluated"},{label:"Alert fatigue reviews"}
      ]},
      "sec.secure_coding": { label:"Secure coding & supply chain", checks:[
        {label:"SAST/DAST in CI with gates"},{label:"Dependency scanning & license policy"},
        {label:"SBOM per build stored"},{label:"Signed builds/provenance"},
        {label:"Secrets scanners in CI/repos"},{label:"Threat models maintained"},
        {label:"Security training ≥ threshold"},{label:"Vuln SLA tracking & exceptions"}
      ]},
      "sec.privacy_data": { label:"Privacy & data handling", checks:[
        {label:"Data maps & lawful basis recorded"},{label:"PII tracing by flow"},
        {label:"Retention/deletion jobs automated"},{label:"Consent checks enforced"},
        {label:"DPIAs completed & stored"},{label:"Privacy incident runbook"}
      ]},
      "sec.compliance_evidence": { label:"Compliance evidence", checks:[
        {label:"Controls mapped to ISO/SOC"},{label:"Evidence as code (artifacts)"},
        {label:"Evidence freshness dashboard"},{label:"Sampling window defined"},
        {label:"Immutable audit trail"},{label:"Alerts on stale/missing evidence"}
      ]},
      "sec.runtime_ir": { label:"Runtime security & IR", checks:[
        {label:"SIEM integrated with product"},{label:"Playbooks & containment steps"},
        {label:"MTTD/MTTR security tracked"},{label:"Drills with KPIs"},
        {label:"Forensics capability defined"},{label:"Post-incident learning captured"}
      ]},
      "docs.code_api_docs": { label:"Code & API docs", checks:[
        {label:"Docs as code (in repo)"},{label:"Freshness checks in CI"},
        {label:"Usage analytics"},{label:"API examples validated"},
        {label:"Docs ownership listed"},{label:"SLA for doc updates"}
      ]},
      "docs.knowledge_onboarding": { label:"Knowledge sharing & onboarding", checks:[
        {label:"Onboarding path with checkpoints"},{label:"Time to first PR tracked"},
        {label:"Recorded walkthroughs"},{label:"Glossary of systems"},
        {label:"Self-serve labs/sandboxes"},{label:"Feedback loop on path"}
      ]},
      "docs.adrs_quality": { label:"ADRs & decision quality", checks:[
        {label:"ADR template with IDs & owners"},{label:"Decision latency tracked"},
        {label:"Reversal decisions recorded"},{label:"ADRs link to expected impact"},
        {label:"Decision quality review"},{label:"Discoverable/indexed"},
        {label:"Cross-team visibility"},{label:"Deprecated ADRs mark successors"}
      ]},
      "docs.audit_trace": { label:"Audit & traceability", checks:[
        {label:"User & system action logging"},{label:"Searchable within minutes"},
        {label:"Tamper-evident storage"},{label:"Least privilege enforced"},
        {label:"Retention policy documented"},{label:"Access audit reports"}
      ]},
      "org.role_triad": { label:"Role clarity & triad", checks:[
        {label:"EM/Product/Design triad named"},{label:"Decision rights documented"},
        {label:"Triad rituals (weekly)"},{label:"Escalation routes"},
        {label:"Role backfills planned"},{label:"Outcome ownership in goals"}
      ]},
      "org.team_autonomy": { label:"Team autonomy & ownership", checks:[
        {label:"Decision rights matrix (RACI)"},{label:"Squad owns on-call & incidents"},
        {label:"Squad owns service catalogue entries"},{label:"Infra controls with guardrails"},
        {label:"Low-risk changes approved in squad"},{label:"Autonomy score surveyed"},
        {label:"Escalation paths documented"},{label:"Ops cost prompts in planning"}
      ]},
      "org.growth_calibration": { label:"Growth & calibration", checks:[
        {label:"Lattice with competencies"},{label:"Evidence-based calibration"},
        {label:"Peer/skip calibration"},{label:"Calibration transparency"},
        {label:"Promotion packet template"},{label:"Calibration cadence defined"}
      ]},
      "org.leadership_behaviour": { label:"Leadership behaviour", checks:[
        {label:"Blocker removal SLA"},{label:"AMAs/surveys (listening)"},
        {label:"Systems thinking training"},{label:"Outcome-based goals"},
        {label:"Recognise learning, not just output"},{label:"Visible retros/actions"}
      ]},
      "econ.squad_budget": { label:"Squad budget accountability", checks:[
        {label:"Budget envelope defined"},{label:"Guardrails (limits/approvals)"},
        {label:"Monthly variance tracking"},{label:"Spend vs outcome review"},
        {label:"Reallocate within envelope"},{label:"Quarterly reconciliation"},
        {label:"Cost forecasts in planning"},{label:"Experiment spend tracked"}
      ]},
      "econ.pricing_levers": { label:"Pricing & value levers", checks:[
        {label:"Telemetry inputs to pricing"},{label:"Pricing experiment framework"},
        {label:"Change cycle time measured"},{label:"Cohort guardrails defined"},
        {label:"Packaging linked to outcomes"},{label:"Revenue impact tracked"}
      ]},
      "econ.finops": { label:"FinOps practice", checks:[
        {label:"Tagging coverage ≥ threshold"},{label:"Policy engine (alerts/suggestions)"},
        {label:"Savings tracked & attributed"},{label:"Budget vs forecast dashboards"},
        {label:"Rightsizing/RI playbooks"},{label:"Monthly FinOps review"}
      ]},
      "data.data_sla_lineage": { label:"Data quality SLAs & lineage", checks:[
        {label:"Data contracts defined (schema+SLAs)"},{label:"Lineage graph (source→sink→dashboard)"},
        {label:"Freshness/completeness monitors"},{label:"Breach routing to owners"},
        {label:"Backfills automated/scripted"},{label:"Ownership metadata complete"},
        {label:"Test datasets/sandbox defined"},{label:"Quarterly data review with product"}
      ]},
      "data.model_lifecycle": { label:"Model lifecycle & monitoring", checks:[
        {label:"Model registry with versions & lineage"},{label:"Drift/perf monitors with alerts"},
        {label:"Rollback/disable automation"},{label:"Feature store documented"},
        {label:"Shadow/canary deploys"},{label:"Retraining cadence & data SLAs"}
      ]},
      "data.responsible_ai": { label:"Responsible AI", checks:[
        {label:"Model cards completed"},{label:"Bias/fairness tests stored"},
        {label:"Human-in-the-loop defined"},{label:"Appeal/override route"},
        {label:"PII/consent checks"},{label:"Audit trail preserved"}
      ]},
      "data.analytics_selfserve": { label:"Analytics self-serve", checks:[
        {label:"Access control & catalog"},{label:"Dashboards per squad"},
        {label:"Analytics DAU/MAU telemetry"},{label:"Query templates"},
        {label:"Training/how-tos"},{label:"Query latency SLAs"}
      ]},
      "xp.perf_budgets_rum": { label:"Performance budgets & RUM", checks:[
        {label:"Perf budgets per page/flow"},{label:"Budgets enforced in CI"},
        {label:"RUM instrumented on key flows"},{label:"Perf dashboards with cohorts"},
        {label:"PR perf regression auto-flags"},{label:"Perf SLOs tied to KPIs"},
        {label:"Synthetic checks for critical flows"},{label:"Perf remediation backlog"}
      ]},
      "xp.accessibility": { label:"Accessibility & inclusion", checks:[
        {label:"WCAG targets & audits scheduled"},{label:"Automated a11y linters in CI"},
        {label:"Manual audits on critical flows"},{label:"Inclusive research participants"},
        {label:"A11y debt backlog & SLA"},{label:"Assistive tech test plan"}
      ]},
      "xp.i18n_l10n": { label:"Internationalisation & localisation", checks:[
        {label:"i18n frameworks in code"},{label:"Locale files & workflows"},
        {label:"Currency/timezone handling"},{label:"Localisation QA process"},
        {label:"Market toggles/feature flags"},{label:"Locale bug rate tracked"}
      ]},
      "xp.support_integration": { label:"Support integration", checks:[
        {label:"Ticket taxonomy aligns to backlog"},{label:"Deflection & CSAT shared"},
        {label:"Auto-label/route to squads"},{label:"Support runbooks per issue"},
        {label:"Feedback loop into roadmap"},{label:"Quarterly CS×Eng review"}
      ]}
    }
  }
};

/* ---------- Backfill weights/slider meta ---------- */
const TAPER8=[20,15,15,15,10,10,10,5], TAPER6=[20,20,15,15,15,15];
function patchModel(){
  const P = MODEL.fullModel.parameters;
  Object.keys(P).forEach(pid=>{
    PARAM_META[pid] = PARAM_META[pid] || {};
    if(!PARAM_META[pid].purpose){
      const pref = pid.split('.')[0];
      PARAM_META[pid].purpose = DEFAULT_PURPOSE_BY_PREFIX[pref] || "Purpose: see checks below.";
    }
  });
  for(const pid of Object.keys(P)){
    const def = P[pid];
    def.checks.forEach(ch=>{ if(!ch.type) ch.type="check"; });
    const hasW = def.checks.some(ch=> typeof ch.w==="number");
    if(!hasW){
      const n=def.checks.length; let prof=(n===8?TAPER8:(n===6?TAPER6:null));
      if(!prof){
        prof = Array.from({length:n},(_,i)=> Math.max(8, Math.round(100*Math.pow(0.88,i))));
        const s=prof.reduce((a,b)=>a+b,0); prof=prof.map(x=>Math.round(100*x/s));
        const d=100-prof.reduce((a,b)=>a+b,0); if(d) prof[0]+=d;
      }
      def.checks.forEach((ch,i)=> ch.w = prof[i]);
    } else {
      const s = def.checks.reduce((a,ch)=>a+(ch.w||0),0);
      if(s>0) def.checks.forEach(ch=> ch.w = +(ch.w*100/s).toFixed(2));
    }
    def.checks.forEach(ch=>{
      if(ch.type==="check"){
        const L=(ch.label||"").toLowerCase();
        if(/coverage %|slo coverage|lineage|tagging/.test(L)){ ch.type="scale100"; }
        else if(/coverage|%|adoption|frequency|rate|p95|median|mttr|lead time|time to|setup time/.test(L)){ ch.type="scale5"; }
      }
      if((ch.type==="scale5" || ch.type==="scale100") && !ch.scaleRef){
        ch.scaleRef = (ch.type==="scale100") ? "generic_0_100" : "generic_0_5";
      }
      if((ch.type==="scale5" || ch.type==="scale100") && !ch.purpose){
        const sc = SCALE_CATALOG[ch.scaleRef]; if(sc) ch.purpose = sc.purpose;
      }
    });
  }
}
patchModel();

/* ---------- State & view ---------- */
const STORAGE_KEYS = { core:"oemm_core24_seq", full:"oemm_full12_seq" };
let currentModule="core", currentView="pillar", singleMode=false, singleKey=null;
const formArea = document.getElementById("formArea");
function b64(s){ return btoa(unescape(encodeURIComponent(s))).replace(/=+$/,''); }
function fmt(n,d=1){ return (n==null||isNaN(n)) ? "—" : (+n).toFixed(d); }
function indexToScale(idx){
  if(idx==null||isNaN(idx)) return null;
  if(idx<=25) return 1 + (idx/25);
  if(idx<=50) return 2 + ((idx-25)/25);
  if(idx<=80) return 3 + ((idx-50)/30);
  return 4 + ((idx-80)/20);
}
function band(scale){
  if(scale==null) return "—";
  if(scale<2) return "Level 1 – Traditional";
  if(scale<2.5) return "Level 2 – Emerging";
  if(scale<=3) return "Level 3 – Agile max";
  if(scale<=4) return "Level 4 – Outcome oriented";
  return "Level 5 – Outcome engineered";
}
function getSaved(){ return JSON.parse(localStorage.getItem(STORAGE_KEYS[currentModule]) || "{}"); }
function setSaved(S){ localStorage.setItem(STORAGE_KEYS[currentModule], JSON.stringify(S)); }

/* ---------- Render ---------- */
function render(){
  formArea.innerHTML="";
  if(singleMode){ renderTiles(); }
  else { if(currentView==="pillar") renderByPillar(); else renderByTier(); }
  attachHandlers();
  // Removed auto-compute and timestamp refresh - these should only happen when compute button is clicked
}
function visibleParamIds(){
  const all = MODEL.fullModel.pillars.flatMap(p=>p.parameters);
  if(currentModule==="core"){ const set=new Set(MODEL.core24); return all.filter(id=>set.has(id)); }
  return all;
}
function renderByPillar(){
  const vis = new Set(visibleParamIds());
  MODEL.fullModel.pillars.forEach(block=>{
    const params = block.parameters.filter(p=>vis.has(p));
    if(!params.length) return;
    const card = document.createElement("div");
    card.className="pillar-card";
    card.innerHTML = `
      <header style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex;gap:8px;align-items:baseline">
          <h3 class="h3">${block.name}</h3>
          <span class="pill">Weight: ${MODEL.weights[block.name]}</span>
        </div>
        <span class="tiny">${params.length} items</span>
      </header>
      <div></div>`;
    const inner = card.lastElementChild;
    params.forEach(pid=> inner.appendChild(renderParam(block.name,pid)));
    formArea.appendChild(card);
  });
}
function renderByTier(){
  const vis = new Set(visibleParamIds());
  const tiers = {};
  vis.forEach(pid=>{ const t=PARAM_META[pid]?.tier||6; (tiers[t]=tiers[t]||[]).push(pid); });
  Object.keys(tiers).sort((a,b)=>a-b).forEach(t=>{
    const ids = tiers[t];
    const card = document.createElement("div");
    card.className="pillar-card";
    card.innerHTML = `
      <header style="display:flex;justify-content:space-between;align-items:center">
        <div class="titleWrap">
          <h3 class="h3">Tier ${t}</h3>
          <span class="tierTag">Low→High sequence</span>
        </div>
        <span class="tiny">${ids.length} items</span>
      </header>
      <div></div>`;
    const inner = card.lastElementChild;
    ids.forEach(pid=>{
      const pill = MODEL.fullModel.pillars.find(p=>p.parameters.includes(pid))?.name || "—";
      inner.appendChild(renderParam(pill,pid,true));
    });
    formArea.appendChild(card);
  });
}
function renderParam(pillarName, pid, showPillarChip=false){
  const def = MODEL.fullModel.parameters[pid];
  const meta = PARAM_META[pid] || {};
  const key = b64(pid);
  const wrap = document.createElement("div");
  wrap.className="item";
  wrap.innerHTML = `
    <header>
      <div class="titleWrap">
        ${meta.popular?'<span class="ico star" title="Popular ★" data-pop="'+pid+'">★</span>':''}
        <div style="font-weight:700">${def.label}</div>
        ${showPillarChip?`<span class="pill">${pillarName}</span>`:""}
        <span class="tierTag">Tier ${meta.tier||"—"}</span>
        <div class="icons">
          ${ (meta.dependsOn && meta.dependsOn.length) ? `<span class="ico chain" title="Dependencies" data-dep="${pid}">⛓️</span>` : "" }
          <span class="ico info" title="Details" data-info="${pid}">ⓘ</span>
        </div>
      </div>
      <span class="score-badge" id="badge-${key}">—</span>
    </header>
    <div class="tiny" style="margin-top:2px"><code style="font-family:var(--font-mono);font-size:.75rem;color:#0369a1">${pid}</code></div>
    <div class="progress" style="margin:8px 0"><div id="bar-${key}" class="bar" style="width:0%"></div></div>
    <div class="tiny" id="meta-${key}">Compliance: —% • Index: — • Scale: —</div>
    <div class="checks" id="checks-${key}"></div>
  `;
  const area = wrap.querySelector(`#checks-${key}`);
  const saved = getSaved()[pid] || {};
  def.checks.forEach((ch,i)=>{
    const row = document.createElement("div"); row.className="row";
    const type = ch.type || "check";
    const w = (typeof ch.w==="number")? ch.w : 0;
    const inputId = `${key}-${i}`;
    let control="";
    if(type==="check"){
      control = `
        <div class="field" style="min-width:320px">
          <label for="${inputId}">${ch.label}</label>
          <div class="row" style="align-items:center;gap:8px">
            <input id="${inputId}" type="checkbox" data-type="check" data-param="${pid}" data-index="${i}" />
            <span class="chip">Yes/No</span>
          </div>
        </div>`;
    } else if(type==="scale5"){
      const val = saved[i]?.v ?? 0;
      control = `
        <div class="field">
          <label for="${inputId}">${ch.label}</label>
          <div class="row" style="align-items:center;gap:8px">
            <input id="${inputId}" type="range" min="0" max="5" step="0.5" value="${val}" data-type="scale5" data-param="${pid}" data-index="${i}" aria-describedby="${inputId}-desc"/>
            <span class="chip">0–5</span>
            <button class="ico info" title="Scale info" data-scale="${ch.scaleRef||''}" data-scale-owner="${pid}" data-scale-idx="${i}">ⓘ</button>
          </div>
          <div id="${inputId}-desc" class="tiny">${ch.purpose||""}</div>
        </div>`;
    } else {
      const val = saved[i]?.v ?? 0;
      control = `
        <div class="field">
          <label for="${inputId}">${ch.label}</label>
          <div class="row" style="align-items:center;gap:8px">
            <input id="${inputId}" type="range" min="0" max="100" step="5" value="${val}" data-type="scale100" data-param="${pid}" data-index="${i}" aria-describedby="${inputId}-desc"/>
            <span class="chip">0–100%</span>
            <button class="ico info" title="Scale info" data-scale="${ch.scaleRef||''}" data-scale-owner="${pid}" data-scale-idx="${i}">ⓘ</button>
          </div>
          <div id="${inputId}-desc" class="tiny">${ch.purpose||""}</div>
        </div>`;
    }
    row.innerHTML = `
      <div style="flex:1">${control}</div>
      <span class="chip">w: ${w}%</span>
      <label class="na"><input type="checkbox" data-na="1" data-param="${pid}" data-index="${i}"/> N/A</label>
    `;
    area.appendChild(row);

    const ctrl = row.querySelector(`#${CSS.escape(inputId)}`);
    if(saved[i]){
      if((ctrl?.dataset.type)==="check") ctrl.checked = !!saved[i].v;
      else if(ctrl) ctrl.value = saved[i].v;
      const na = row.querySelector(`[data-na="1"]`);
      if(saved[i].na){ na.checked = true; if(ctrl) ctrl.disabled = true; }
    }
  });
  return wrap;
}

/* ---------- Popovers ---------- */
const overlay = document.getElementById("overlay");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
document.getElementById("modalClose").addEventListener("click", ()=> overlay.style.display="none");
overlay.addEventListener("click", e=>{ if(e.target===overlay) overlay.style.display="none"; });


function pillarCardsHTML(byPillar){
  let out = '';
  Object.keys(MODEL.weights).forEach(p=>{
    const idx = byPillar[p]; if(idx==null) return;
    const scl = indexToScale(idx);
    const pct = Math.max(0, Math.min(100, idx));
    const state = scl>=4?'score-good':(scl>=3?'score-warn':'score-bad');
    out += `
      <div class="pillar-card">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex; gap:8px; align-items:baseline">
            <strong>${p}</strong><span class="pill">Weight: ${MODEL.weights[p]}</span>
          </div>
          <span class="score-badge ${state}">${fmt(scl,1)}</span>
        </div>
        <div class="progress" style="margin-top:8px"><div class="bar" style="width:${pct}%"></div></div>
        <div class="tiny">Index: ${fmt(idx,1)}</div>
      </div>`;
  });
  if(!out) out = '<p>No pillar data.</p>';
  return out;
}
function nextStepsHTML(results){
  let html = "";
  const saved = getSaved();
  visibleParamIds().forEach(pid=>{
    const def = MODEL.fullModel.parameters[pid];
    const recs = [];
    def.checks.forEach((ch,i)=>{
      const s = saved[pid]?.[i];
      if(!s || s.na) return;
      if(ch.type==="check" && !s.v){ recs.push(`• ${ch.label}`); }
      if(ch.type==="scale5" && (s.v||0) < 3){ recs.push(`• Improve "${ch.label}" (currently ${s.v||0}/5)`); }
      if(ch.type==="scale100" && (s.v||0) < 60){ recs.push(`• Improve "${ch.label}" (currently ${s.v||0}%)`); }
    });
    if(recs.length){ html += `<p><b>${def.label}</b> (${pid})<br/>${recs.join("<br/>")}</p>`; }
  });
  if(!html) html = "<p>No immediate actions detected. Raise thresholds for stretch.</p>";
  return html;
}
function nextLevelTarget(finalIndex){
  if(finalIndex<25) return {level:2, targetIdx:25};
  if(finalIndex<50) return {level:3, targetIdx:50};
  if(finalIndex<75) return {level:4, targetIdx:75};
  if(finalIndex<100) return {level:5, targetIdx:100};
  return {level:5, targetIdx:finalIndex};
}
function scopeLabel(){
  try { return (currentModule==="core") ? "Core 24" : "Full 12 Pillars"; }
  catch(e){ return "Core 24"; }
}
const PILLAR_OUTCOMES = {
  "Strategy & Executive Alignment":"Shared priorities, faster decisions, funding aligned to outcomes.",
  "Customer & Outcome Alignment":"Clear problem statements, better adoption, higher NPS and retention.",
  "Product Strategy, Discovery & GTM":"Higher hit‑rate, leaner bets, faster market feedback.",
  "Engineering Effectiveness":"Higher deployment frequency, lower MTTR, quality up with cost under control.",
  "Architecture & Platform":"Modularity, resilience, and speed for new product work.",
  "Data & Insights":"Reliable, timely data driving product and commercial choices."
};
function generateNarrative(results){
  const byPillar = results.byPillar;
  const pairs = Object.keys(byPillar).map(k=>({name:k, idx:byPillar[k], weight:MODEL.weights[k]||0})).filter(x=>x.idx!=null);
  const strengths = [...pairs].sort((a,b)=>b.idx-a.idx).slice(0,3);
  const gaps = [...pairs].sort((a,b)=>a.idx-b.idx).slice(0,3);
  const failedGates = results.gates.filter(g=>!g.pass);
  const activeCaps = results.caps.filter(c=>c.trigger);
  const target = nextLevelTarget(results.finalIndex||0);
  const delta = Math.max(0,(target.targetIdx - (results.finalIndex||0)));
  const totalW = gaps.reduce((s,g)=>s+(g.weight||1),0) || 1;
  const alloc = gaps.map(g=>({name:g.name, lift: Math.round(delta * ((g.weight||1)/totalW)) }));
  function list(items){ return items.map(it=>`<li><b>${it.name}</b> — Index ${fmt(it.idx,1)}${it.weight!=null?` (w${it.weight})`:""}</li>`).join(""); }
  const outcomes = gaps.map(g=>`<li><b>${g.name}</b>: ${PILLAR_OUTCOMES[g.name] || "Improved flow and business impact."}</li>`).join("");
  return `
  <div class="narrative" id="narrText">
    <div class="callout"><div class="tiny"><i>Preliminary report based on <b>${scopeLabel()}</b>. A thorough report will include deeper analysis and evidence.</i></div>
      <p>Current maturity: <b>${band(results.finalScale)}</b> (Scale ${fmt(results.finalScale,1)}, Index ${fmt(results.finalIndex,1)}). Next target: <b>Level ${target.level}</b> at Index ~${target.targetIdx} (gap ~${fmt(delta,1)}).</p>
    </div>
    <div><b>Key drivers</b><ul>${list(strengths)}</ul></div>
    <div><b>Primary gaps</b><ul>${list(gaps)}</ul>
      ${failedGates.length?`<p>Failed gates: ${failedGates.map(g=>g.label).join(", ")}.</p>`:""}
      ${activeCaps.length?`<p>Active caps: ${activeCaps.map(c=>c.label).join(", ")}.</p>`:""}
    </div>
    <div><b>Plan to reach next level</b>
      <p>Raise pillar indices by approximately:</p>
      <ul>${alloc.map(x=>`<li><b>${x.name}</b> +${x.lift}</li>`).join("")}</ul>
      <p>Concrete next steps:</p>
      ${nextStepsHTML(results)}
    </div>
    <div><b>What this unlocks</b><ul>${outcomes}</ul></div>
    <div class="copyRow"><button class="btn" id="btnCopyNarrative" data-target="narrText">Copy narrative</button></div>
  </div>`;
}
function generateExecutiveSummary(results){
  const bandTxt = band(results.finalScale);
  const idx = results.finalIndex||0;
  const scale = results.finalScale||0;
  const target = nextLevelTarget(idx);
  const gap = Math.max(0, target.targetIdx - idx);
  const gatesPassCount = results.gates.filter(g=>g.pass).length;

  const pairs = Object.keys(results.byPillar).map(k=>({name:k, idx:results.byPillar[k], weight:MODEL.weights[k]||0})).filter(x=>x.idx!=null);
  const strengths = [...pairs].sort((a,b)=>b.idx-a.idx).slice(0,3);
  const gaps = [...pairs].sort((a,b)=>a.idx-b.idx).slice(0,3);

  const totalW = gaps.reduce((s,g)=>s+(g.weight||1),0) || 1;
  const lifts = gaps.map(g=>({name:g.name, lift: Math.round(gap * ((g.weight||1)/totalW)) }));

  const failedGates = results.gates.filter(g=>!g.pass).map(g=>g.label);
  const activeCaps = results.caps.filter(c=>c.trigger).map(c=>c.label);

  const li = (arr) => arr.map(x=>`<li>${x}</li>`).join("");
  const liKPI = (items) => items.map(x=>`<li><b>${x.k}</b>: ${x.v}</li>`).join("");

  const html = `
  <div class="execsum" id="execText">
    <div class="callout">
      <h4>TL;DR</h4>
      <div class="tiny"><i>Preliminary report based on <b>${scopeLabel()}</b>. A thorough report will include deeper analysis, evidence, and the full 12‑pillar view if selected.</i></div>
      <ul>
        ${liKPI([
          {k:"Current", v:`Band ${bandTxt}, Scale ${fmt(scale,1)}/5, Index ${fmt(idx,1)}/100`},
          {k:"Target", v:`Level ${target.level} (Index ~${target.targetIdx})`},
          {k:"Gap", v:`~${fmt(gap,1)} points`},
          {k:"Gates", v:`${gatesPassCount}/${results.gates.length} passed`}
        ])}
        <li><b>Ask</b>: £___, ___ FTE, approve ___ policy.</li>
        <li><b>Payoff</b>: Revenue ↑, risk ↓, speed ↑.</li>
      </ul>
    </div>

    <div>
      <h4>Where we are now</h4>
      <ul>
        ${liKPI([
          {k:"Index", v: fmt(idx,1)},
          {k:"Scale", v: fmt(scale,1)},
          {k:"Band", v: bandTxt},
          {k:"Gates/Caps", v: `${gatesPassCount}/${results.gates.length} gates, ${activeCaps.length} caps active`}
        ])}
      </ul>
    </div>

    <div>
      <h4>What is working</h4>
      <ul>${strengths.map(s=>`<li><b>${s.name}</b> — Index ${fmt(s.idx,1)} (w${s.weight})</li>`).join("")}</ul>
    </div>

    <div>
      <h4>What is not working</h4>
      <ul>${gaps.map(s=>`<li><b>${s.name}</b> — Index ${fmt(s.idx,1)} (w${s.weight})</li>`).join("")}</ul>
      ${failedGates.length?`<p>Failed gates: ${failedGates.join(", ")}.</p>`:""}
      ${activeCaps.length?`<p>Active caps: ${activeCaps.join(", ")}.</p>`:""}
    </div>

    <div>
      <h4>Why gaps exist</h4>
      <ul>
        <li>Process: missing or inconsistent practices surfaced in low‑scoring checks.</li>
        <li>Platform: constraints in automation, testability, or resilience.</li>
        <li>Data: freshness/coverage issues lowering decision confidence.</li>
      </ul>
    </div>

    <div>
      <h4>Plan to next level (90 days)</h4>
      <ul>
        ${lifts.map(x=>`<li>Lift <b>${x.name}</b> by ~${x.lift} index points. Owner [____]. Milestone [____].</li>`).join("")}
      </ul>
      <p><b>Concrete next steps</b>:</p>
      ${nextStepsHTML(results)}
    </div>

    <div>
      <h4>Business impact forecast</h4>
      <ul>
        ${gaps.map(g=>`<li><b>${g.name}</b>: ${PILLAR_OUTCOMES[g.name] || "Improved flow and business impact."}</li>`).join("")}
      </ul>
    </div>

    <div>
      <h4>Decisions required today</h4>
      <ul>
        <li>Funding and roles: approve budget and backfill plan.</li>
        <li>Sequencing: confirm scope and order of workstreams.</li>
        <li>Policy: agree release, guardrails, and governance cadence.</li>
      </ul>
    </div>

    <div class="copyRow">
      <button class="btn" id="btnCopyExec" data-target="execText">Copy executive summary</button>
    </div>
  </div>`;
  return html;
}
/* ---------- Nano LLM: heuristic text realiser (no external APIs) ---------- */
const NanoLLM = { sent(s){ if(!s) return ""; s = s.trim(); if(!s) return ""; const last = s[s.length-1]; return /[.!?]$/.test(last) ? s : s + "."; } };

/* ---------- Full report composer ---------- */
function llmStyleReport(results){
  const scope = scopeLabel();
  const bandTxt = band(results.finalScale);
  const idx = results.finalIndex||0;
  const scale = results.finalScale||0;
  const target = nextLevelTarget(idx);
  const gap = Math.max(0, target.targetIdx - idx);
  const gatesPass = results.gates.filter(g=>g.pass).length;
  const failedGates = results.gates.filter(g=>!g.pass).map(g=>g.label);
  const activeCaps = results.caps.filter(c=>c.trigger).map(c=>c.label);

  const pairs = Object.keys(results.byPillar).map(k=>({name:k, idx:results.byPillar[k], weight:MODEL.weights[k]||0})).filter(x=>x.idx!=null);
  const strengths = [...pairs].sort((a,b)=>b.idx-a.idx).slice(0,3);
  const gaps = [...pairs].sort((a,b)=>a.idx-b.idx).slice(0,3);

  const totalW = gaps.reduce((s,g)=>s+(g.weight||1),0) || 1;
  const lifts = gaps.map(g=>({name:g.name, lift: Math.round(gap * ((g.weight||1)/totalW)), idx:g.idx }));

  const stepsHTML = nextStepsHTML(results);
  const stepsTxt = stepsHTML.replace(/<[^>]+>/g," ").replace(/\s+/g," ").split("• ").map(s=>s.trim()).filter(s=>s);

  // Get current date for report
  const reportDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
<div class="structured-report">
  <!-- Report Header -->
  <div class="report-header">
    <h1>Engineering Excellence Maturity Assessment</h1>
    <div class="report-meta">
      <p><strong>Assessment Scope:</strong> ${scope}</p>
      <p><strong>Report Date:</strong> ${reportDate}</p>
      <p><strong>Overall Band:</strong> ${bandTxt} (${scale.toFixed(1)}/5.0, Index: ${idx.toFixed(1)}/100)</p>
    </div>
  </div>

  <!-- Executive Summary -->
  <section class="report-section">
    <h2>📊 Executive Summary</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <h3>Current State</h3>
        <p>The organisation is currently assessed at <strong>Band ${bandTxt}</strong> with a scale score of <strong>${scale.toFixed(1)} out of 5</strong> and an index of <strong>${idx.toFixed(1)} out of 100</strong>.</p>
      </div>
      
      <div class="summary-card">
        <h3>Target & Gap</h3>
        <p>The target is <strong>Level ${target.level}</strong>, approximated as an index of <strong>${target.targetIdx}</strong>, which implies a gap of about <strong>${gap.toFixed(1)} points</strong>.</p>
      </div>
      
      <div class="summary-card">
        <h3>Gate Status</h3>
        <p><strong>${gatesPass}/${results.gates.length} gates passed</strong>${failedGates.length ? `. Outstanding: ${failedGates.join(", ")}` : " ✅"}</p>
        ${activeCaps.length ? `<p><strong>Active caps:</strong> ${activeCaps.join(", ")}</p>` : ""}
      </div>
    </div>
  </section>

  <!-- Strengths & Gaps Analysis -->
  <section class="report-section">
    <h2>🎯 Maturity Analysis</h2>
    
    <div class="analysis-grid">
      <div class="strengths-panel">
        <h3>💪 Key Strengths</h3>
        ${strengths.length ? `
        <ul class="strength-list">
          ${strengths.map(s => `
            <li>
              <strong>${s.name}</strong>
              <span class="score">Index: ${s.idx.toFixed(1)}</span>
            </li>
          `).join('')}
        </ul>
        <p class="insight">These strengths provide a solid foundation for the next phase of maturity development.</p>
        ` : '<p>No significant strengths identified in current assessment.</p>'}
      </div>
      
      <div class="gaps-panel">
        <h3>🔍 Primary Gaps</h3>
        ${gaps.length ? `
        <ul class="gaps-list">
          ${gaps.map(g => `
            <li>
              <strong>${g.name}</strong>
              <span class="score">Index: ${g.idx.toFixed(1)}</span>
            </li>
          `).join('')}
        </ul>
        <p class="insight">These gaps materially affect predictability, speed, and business outcomes.</p>
        ` : '<p>No significant gaps identified in current assessment.</p>'}
      </div>
    </div>
    
    <div class="root-causes">
      <h4>🔧 Root Cause Analysis</h4>
      <p>These gaps typically stem from a blend of process inconsistency, platform constraints that reduce automation or resilience, and data freshness or coverage issues that lower decision confidence.</p>
    </div>
  </section>

  <!-- 90-Day Action Plan -->
  <section class="report-section">
    <h2>🚀 90-Day Action Plan</h2>
    
    <div class="plan-overview">
      <p><strong>Focus Strategy:</strong> Concentrated lifts in the lowest-scoring pillars to achieve maximum impact.</p>
    </div>
    
    ${lifts.length ? `
    <div class="pillar-lifts">
      <h3>Pillar Improvement Targets</h3>
      <ul class="lift-targets">
        ${lifts.map(x => `
          <li>
            <strong>${x.name}:</strong> Increase by roughly <strong>${x.lift} index points</strong>
            <small>(Current: ${x.idx.toFixed(1)})</small>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${stepsTxt.length ? `
    <div class="concrete-actions">
      <h3>Concrete Next Steps</h3>
      <ul class="action-list">
        ${stepsTxt.slice(0, 12).map(step => `<li>${step}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </section>

  <!-- Expected Outcomes -->
  <section class="report-section">
    <h2>📈 Expected Outcomes</h2>
    ${gaps.length ? `
    <div class="outcomes-grid">
      ${gaps.map(g => `
        <div class="outcome-card">
          <h4>${g.name}</h4>
          <p>${PILLAR_OUTCOMES[g.name] || "Improved flow, quality, and commercial impact."}</p>
        </div>
      `).join('')}
    </div>
    ` : '<p>Improved flow, quality, and commercial impact across all areas.</p>'}
    
    <div class="overall-impact">
      <h4>Overall Impact</h4>
      <p>With these actions, we anticipate measurable improvements in deployment frequency, lead time, and MTTR alongside higher adoption and reduced operational risk.</p>
    </div>
  </section>

  <!-- Decisions Required -->
  <section class="report-section">
    <h2>⚡ Decisions Required</h2>
    <ul class="decisions-list">
      <li><strong>Funding & Roles:</strong> Confirm budget allocation and team assignments</li>
      <li><strong>Sequencing & Trade-offs:</strong> Approve prioritization and scope decisions</li>
      <li><strong>Policy Changes:</strong> Agree on release, guardrails, and governance cadence updates</li>
    </ul>
  </section>

  <!-- Report Footer -->
  <div class="report-footer">
    <hr>
    <p><em>This preliminary report is based on ${scope}. For detailed analysis and implementation guidance, consult the full assessment results and supporting documentation.</em></p>
  </div>
</div>
  `.trim();
}
function openTabbedModal(title, tabs){
  modalTitle.textContent = title;
  const tabBtns = tabs.map((t,i)=>`<button class="tab ${i===0?"active":""}" data-tab="${t.id}" role="tab" aria-selected="${i===0}">${t.title}</button>`).join("");
  const tabPanes = tabs.map((t,i)=>`<section id="tab-${t.id}" class="tabpanel ${i===0?"active":""}" role="tabpanel">${t.html}</section>`).join("");
  modalContent.innerHTML = `<div class="tabs"><div class="tablist" role="tablist">${tabBtns}</div>${tabPanes}</div>`;
  overlay.style.display = "flex";
  
  // Simple direct button binding with detailed logging
  function setupButtonHandlers(){
    console.log("=== Setting up button handlers ===");
    const modal = document.getElementById("modalContent");
    console.log("modalContent:", modal);
    
    // Check if Full Report tab is active
    const fullTab = modal.querySelector("#tab-full");
    console.log("Full tab found:", fullTab);
    
    // Try to find buttons immediately
    const genBtn = document.getElementById("btnGenFull");
    const copyBtn = document.getElementById("btnCopyFull");  
    const dlBtn = document.getElementById("btnDownloadFull");
    
    console.log("Buttons found directly by ID:");
    console.log("- btnGenFull:", genBtn);
    console.log("- btnCopyFull:", copyBtn);
    console.log("- btnDownloadFull:", dlBtn);
    
    // Try to find buttons within modalContent
    const genBtnModal = modal ? modal.querySelector("#btnGenFull") : null;
    const copyBtnModal = modal ? modal.querySelector("#btnCopyFull") : null;
    const dlBtnModal = modal ? modal.querySelector("#btnDownloadFull") : null;
    
    console.log("Buttons found in modalContent:");
    console.log("- btnGenFull:", genBtnModal);
    console.log("- btnCopyFull:", copyBtnModal); 
    console.log("- btnDownloadFull:", dlBtnModal);
    
    // Set up Generate Report button
    if (genBtnModal) {
      console.log("Setting up Generate Report button handler");
      genBtnModal.onclick = function(e) {
        console.log(">>> Generate Report CLICKED! <<<");
        try {
          const res = compute(true);
          const reportHTML = llmStyleReport(res);
          const el = modal.querySelector("#fullText");
          console.log("Report generated, length:", reportHTML.length);
          if(el) { 
            // Clear any existing content and styling issues
            el.innerHTML = "";
            el.style.whiteSpace = "normal";
            el.style.fontFamily = "inherit";
            
            // Create a new div to hold the structured report
            const reportDiv = document.createElement("div");
            reportDiv.className = "html-report-container";
            reportDiv.innerHTML = reportHTML;
            
            // Append to the container
            el.appendChild(reportDiv);
            console.log("Report content set to #fullText with proper HTML rendering");
          }
        } catch (err) {
          console.error("Generate report error:", err);
        }
      };
    }
    
    // Set up Copy button  
    if (copyBtnModal) {
      console.log("Setting up Copy Report button handler");
      copyBtnModal.onclick = function(e) {
        console.log(">>> Copy Report CLICKED! <<<");
        try {
          const el = modal.querySelector("#fullText");
          if (el && el.innerHTML) {
            // Convert HTML to markdown-like text for copying
            const textContent = el.innerText || el.textContent || "";
            const textarea = document.createElement("textarea");
            textarea.value = textContent;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            copyBtnModal.textContent = "Copied!";
            setTimeout(() => copyBtnModal.textContent = "Copy full report", 1200);
            console.log("Text copied to clipboard");
          } else {
            console.log("No text to copy - generate report first");
          }
        } catch (err) {
          console.error("Copy error:", err);
        }
      };
    }
    
    // Set up Download button
    if (dlBtnModal) {
      console.log("Setting up Download button handler"); 
      dlBtnModal.onclick = function(e) {
        console.log(">>> Download CLICKED! <<<");
        try {
          const el = modal.querySelector("#fullText");
          // Convert HTML to markdown-like text for download
          const content = el ? (el.innerText || el.textContent || "No report generated") : "No report generated";
          const blob = new Blob([content], {type: "text/markdown"});
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "moderneer-report.md";
          a.click();
          URL.revokeObjectURL(url);
          console.log("Download initiated");
        } catch (err) {
          console.error("Download error:", err);
        }
      };
    }
    
    console.log("=== Button setup complete ===");
  }
  
  // Call setup immediately and with a small delay to ensure DOM is ready
  setupButtonHandlers();
  setTimeout(setupButtonHandlers, 100);
  
  const modal = document.getElementById("modalContent");
  if (modal) {
    modal.querySelector(".tablist").addEventListener("click", (e)=>{
      const btn = e.target.closest(".tab"); if(!btn) return;
      const id = btn.dataset.tab;
      modal.querySelectorAll(".tab").forEach(b=>{ b.classList.toggle("active", b===btn); b.setAttribute("aria-selected", b===btn ? "true" : "false"); });
      modal.querySelectorAll(".tabpanel").forEach(p=> p.classList.remove("active"));
      const pane = modal.querySelector("#tab-"+id); if(pane) pane.classList.add("active");
      // Re-setup button handlers after tab switch to ensure they work
      setupButtonHandlers();
    });
  }
}/* ---------- Analyst Lens helpers ---------- */
const PILLAR_EXECUTE = ["Engineering Effectiveness","Architecture & Platform","Data & Insights"];
const PILLAR_VISION  = ["Strategy & Executive Alignment","Product Strategy, Discovery & GTM","Customer & Outcome Alignment"];
const PILLAR_LAYER = {
  "Strategy & Executive Alignment":"Differentiation",
  "Customer & Outcome Alignment":"Differentiation",
  "Product Strategy, Discovery & GTM":"Innovation",
  "Engineering Effectiveness":"Differentiation",
  "Architecture & Platform":"Record",
  "Data & Insights":"Record"
};
const SEVEN_S_MAP = {
  "Strategy & Executive Alignment":"Strategy",
  "Customer & Outcome Alignment":"Shared Values",
  "Product Strategy, Discovery & GTM":"Skills",
  "Engineering Effectiveness":"Systems",
  "Architecture & Platform":"Structure",
  "Data & Insights":"Systems"
};
function avgPillars(byPillar, names){
  const w = (window.MODEL && window.MODEL.weights) || {};
  let s=0, sw=0;
  names.forEach(n=>{ if(byPillar[n]!=null){ const wt = Math.max(1, w[n]||1); s += byPillar[n]*wt; sw += wt; }});
  return sw? s/sw : 0;
}
function analystMetrics(results){
  const exec = avgPillars(results.byPillar, PILLAR_EXECUTE);
  const vis  = avgPillars(results.byPillar, PILLAR_VISION);
  return {execute:exec, vision:vis};
}
function layerAverages(results){
  const by = results.byPillar || {};
  const buckets = {Record:[],Differentiation:[],Innovation:[]};
  Object.keys(by).forEach(k=>{ const layer = PILLAR_LAYER[k]||"Differentiation"; buckets[layer].push(by[k]); });
  const avg = k=> buckets[k].length? buckets[k].reduce((a,b)=>a+b,0)/buckets[k].length : 0;
  return {Record:avg("Record"),Differentiation:avg("Differentiation"),Innovation:avg("Innovation")};
}
function sevenS(results){
  const by = results.byPillar || {};
  const acc = {};
  Object.keys(by).forEach(k=>{ const s = SEVEN_S_MAP[k]||"Systems"; (acc[s]=acc[s]||[]).push(by[k]); });
  const out = {};
  Object.keys(acc).forEach(k=> out[k] = acc[k].reduce((a,b)=>a+b,0)/acc[k].length);
  const order = ["Strategy","Structure","Systems","Skills","Staff","Style","Shared Values"];
  return order.map(k=>({name:k, idx: out[k]||0}));
}
function valueEffortBoard(results){
  const by = results.byPillar || {};
  const w = (window.MODEL && window.MODEL.weights) || {};
  const pairs = Object.keys(by).map(k=>({name:k, idx:by[k], weight:w[k]||1})).filter(x=>x.idx!=null);
  const sortedAsc = [...pairs].sort((a,b)=>a.idx-b.idx);
  const gaps = sortedAsc.slice(0,4);
  const tgt = (window.nextLevelTarget? window.nextLevelTarget(results.finalIndex||0) : {targetIdx: Math.min(100,(results.finalIndex||0)+10)});
  const gap = Math.max(0,(tgt.targetIdx - (results.finalIndex||0)));
  const totalW = gaps.reduce((s,g)=>s+(g.weight||1),0) || 1;
  return gaps.map(g=>{
    const lift = Math.round(gap * ((g.weight||1)/totalW));
    const value = (g.weight||1) * lift;
    const effort = 100 - g.idx;
    let bucket = "fillins";
    if(value>=effort && effort<40) bucket="quick";
    else if(value>=effort && effort>=40) bucket="bigbets";
    else if(value<effort && effort<40) bucket="fillins";
    else bucket="avoid";
    return {name:g.name, value, effort, bucket};
  });
}
function analystHTML(results){
  const m = analystMetrics(results);
  const layers = layerAverages(results);
  const seven = sevenS(results);
  const board = valueEffortBoard(results);
  const quadSVG = `
  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
    <rect x="0" y="0" width="100" height="100" fill="white" stroke="#ddd"></rect>
    <line x1="50" y1="0" x2="50" y2="100" stroke="#ccc" stroke-width="0.5"></line>
    <line x1="0" y1="50" x2="100" y2="50" stroke="#ccc" stroke-width="0.5"></line>
    <text x="95" y="98" font-size="4" text-anchor="end" fill="#666">Vision</text>
    <text x="2" y="5" font-size="4" fill="#666" transform="rotate(-90 2,5)">Execute</text>
    <circle cx="${Math.max(2, Math.min(98, m.vision))}" cy="${100 - Math.max(2, Math.min(98, m.execute))}" r="3" fill="var(--color-primary)"></circle>
  </svg>`;
  const boardBuckets = {
    quick: board.filter(x=>x.bucket==="quick"),
    bigbets: board.filter(x=>x.bucket==="bigbets"),
    fillins: board.filter(x=>x.bucket==="fillins"),
    avoid: board.filter(x=>x.bucket==="avoid")
  };
  return `
  <div class="analyst" id="analystText">
    <div>
      <h4>MQ-style Quadrant (internal)</h4>
      <div class="quad">${quadSVG}</div>
      <div class="tiny">Point = average of Execute pillars (${PILLAR_EXECUTE.join(", ")}) vs Vision pillars (${PILLAR_VISION.join(", ")}).</div>
    </div>
    <div>
      <h4>Pace-Layered heatmap</h4>
      <div class="heat-grid">
        <div class="hdr">Layer</div><div class="hdr">Index</div><div class="hdr">Tags</div><div class="hdr">Guidance</div>
        <div>Record</div><div><div class="bar"><div class="fill" style="width:${layers.Record.toFixed(0)}%;background:var(--color-success)"></div></div></div><div><span class="tag">stability</span></div><div>Protect & Modernize</div>
        <div>Differentiation</div><div><div class="bar"><div class="fill" style="width:${layers.Differentiation.toFixed(0)}%;background:var(--color-primary)"></div></div></div><div><span class="tag">flow</span></div><div>Exploit</div>
        <div>Innovation</div><div><div class="bar"><div class="fill" style="width:${layers.Innovation.toFixed(0)}%;background:var(--color-accent)"></div></div></div><div><span class="tag">bets</span></div><div>Experiment</div>
      </div>
    </div>
    <div>
      <h4>McKinsey 7‑S mapping</h4>
      <div class="spider">
        ${seven.map(s=>`<div>${s.name}</div><div class="track"><div class="fill" style="width:${s.idx.toFixed(0)}%;background:var(--color-primary)"></div></div>`).join("")}
      </div>
      <div class="tiny">Mapping is heuristic. Adjust SEVEN_S_MAP for your context.</div>
    </div>
    <div>
      <h4>Value vs Effort</h4>
      <div class="board">
        <div class="cell"><h5>Quick wins</h5>${boardBuckets.quick.map(i=>`<div>• ${i.name}</div>`).join("") || "<div>—</div>"}</div>
        <div class="cell"><h5>Big bets</h5>${boardBuckets.bigbets.map(i=>`<div>• ${i.name}</div>`).join("") || "<div>—</div>"}</div>
        <div class="cell"><h5>Fill‑ins</h5>${boardBuckets.fillins.map(i=>`<div>• ${i.name}</div>`).join("") || "<div>—</div>"}</div>
        <div class="cell"><h5>Avoid</h5>${boardBuckets.avoid.map(i=>`<div>• ${i.name}</div>`).join("") || "<div>—</div>"}</div>
      </div>
    </div>
    <div class="copyRow">
      <button class="btn" id="btnCopyAnalyst" data-target="analystText">Copy analyst lens</button>
    </div>
  </div>`;
}

function generateRadarChart(results) {
  console.log('Generating radar chart with results:', results);
  console.log('Available pillars in byPillar:', Object.keys(results.byPillar || {}));
  
  // Get the actual pillar names from the results.byPillar object
  const pillarNames = Object.keys(results.byPillar || {});
  
  // Map pillar names to their scores
  const pillarScores = pillarNames.map(pillar => {
    const score = results.byPillar[pillar] || 0;
    console.log(`Pillar: ${pillar}, Score: ${score}`);
    return { name: pillar, score: score };
  });
  
  // Ensure we have exactly 12 pillars for the radar chart
  while (pillarScores.length < 12) {
    pillarScores.push({ name: `Pillar ${pillarScores.length + 1}`, score: 0 });
  }
  
  console.log('Final pillar scores:', pillarScores);
  
  // SVG dimensions
  const size = 400;
  const center = size / 2;
  const maxRadius = 160;
  
  // Calculate points for radar chart
  const numPillars = pillarScores.length;
  const angleStep = (2 * Math.PI) / numPillars;
  
  // Generate radar grid circles
  const circles = [1, 2, 3, 4, 5].map(level => 
    `<circle cx="${center}" cy="${center}" r="${(level * maxRadius) / 5}" 
     fill="none" stroke="#E2E8F0" stroke-width="1" />`
  ).join('');
  
  // Generate radar grid lines  
  const gridLines = pillarScores.map((pillar, i) => {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    const x = center + Math.cos(angle) * maxRadius;
    const y = center + Math.sin(angle) * maxRadius;
    return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" 
            stroke="#E2E8F0" stroke-width="1" />`;
  }).join('');
  
  // Generate labels
  const labels = pillarScores.map((pillar, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const labelRadius = maxRadius + 20;
    const x = center + Math.cos(angle) * labelRadius;
    const y = center + Math.sin(angle) * labelRadius;
    
    // Adjust text anchor based on position
    let anchor = 'middle';
    if (x < center - 10) anchor = 'end';
    else if (x > center + 10) anchor = 'start';
    
    // Shorten text for better display
    const shortName = pillar.name.length > 25 ? pillar.name.substring(0, 22) + "..." : pillar.name;
    
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" 
            font-size="10" font-weight="600" fill="#475569" 
            dominant-baseline="middle">${shortName}</text>`;
  }).join('');
  
  // Generate score points and polygon
  const scorePoints = pillarScores.map((pillar, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const radius = (pillar.score / 100) * maxRadius; // Assuming scores are 0-100
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    return { x, y, score: pillar.score };
  });
  
  // Create polygon path
  const polygonPath = scorePoints.map(point => `${point.x},${point.y}`).join(' ');
  
  // Generate score dots
  const scoreDots = scorePoints.map((point, i) => 
    `<circle cx="${point.x}" cy="${point.y}" r="4" 
     fill="url(#radarGradient)" stroke="white" stroke-width="2" />
     <title>${pillarScores[i].name}: ${point.score.toFixed(1)}</title>`
  ).join('');
  
  const radarSvg = `
    <div class="radar-chart-container" style="text-align: center; margin: 20px 0;">
      <h3>${numPillars}-Pillar Maturity Radar</h3>
      <svg viewBox="0 0 ${size} ${size}" style="max-width: 500px; height: auto;">
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563EB" />
            <stop offset="100%" stop-color="#06B6D4" />
          </linearGradient>
          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563EB" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#06B6D4" stop-opacity="0.1" />
          </linearGradient>
        </defs>
        
        <!-- Grid circles -->
        ${circles}
        
        <!-- Grid lines -->
        ${gridLines}
        
        <!-- Score level labels -->
        <text x="${center - maxRadius + 10}" y="${center - 5}" font-size="10" fill="#64748B">0</text>
        <text x="${center - maxRadius * 0.6 + 10}" y="${center - 5}" font-size="10" fill="#64748B">25</text>
        <text x="${center - maxRadius * 0.2 + 10}" y="${center - 5}" font-size="10" fill="#64748B">50</text>
        <text x="${center + maxRadius * 0.2 + 10}" y="${center - 5}" font-size="10" fill="#64748B">75</text>
        <text x="${center + maxRadius * 0.6 + 10}" y="${center - 5}" font-size="10" fill="#64748B">100</text>
        
        <!-- Score polygon -->
        <polygon points="${polygonPath}" 
         fill="url(#radarFill)" stroke="url(#radarGradient)" stroke-width="2" />
        
        <!-- Score dots -->
        ${scoreDots}
        
        <!-- Labels -->
        ${labels}
      </svg>
      
      <!-- Legend/scores table -->
      <div class="radar-legend" style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 0.85rem;">
        ${pillarScores.map(pillar => `
          <div style="display: flex; justify-content: space-between; padding: 4px 8px; background: #F8FAFC; border-radius: 6px;">
            <span>${pillar.name}</span>
            <strong style="color: #2563EB;">${pillar.score.toFixed(1)}</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  return radarSvg;
}

function buildReportTabs(results){
  const overallHTML = `
    <div class="kpis">
      <div class="kpi"><div class="tiny">Overall (index 0–100)</div><strong>${fmt(results.finalIndex,1)}</strong></div>
      <div class="kpi"><div class="tiny">Overall (scale 1–5)</div><strong>${fmt(results.finalScale,1)}</strong></div>
      <div class="kpi"><div class="tiny">Band</div><strong>${band(results.finalScale)}</strong></div>
      <div class="kpi"><div class="tiny">Gates passed</div><strong>${results.gates.filter(g=>g.pass).length}/${results.gates.length}</strong></div>
    </div>
  `;
  let gatesHTML = `<div style="display:grid;gap:10px">`;
  results.gates.forEach(g=>{
    const cls = g.pass? "score-good" : "score-bad";
    gatesHTML += `<div class="pillar-card"><div style="display:flex;justify-content:space-between;align-items:center"><div>${g.label}</div><span class="score-badge ${cls}">${g.pass?"PASS":"FAIL"}</span></div></div>`;
  });
  gatesHTML += `<div class="tiny">Caps</div>`;
  results.caps.forEach(c=>{
    const cls = c.trigger? "score-bad" : "score-good";
    gatesHTML += `<div class="pillar-card"><div style="display:flex;justify-content:space-between;align-items:center"><div>${c.label}</div><span class="score-badge ${cls}">${c.trigger?"ACTIVE":"—"}</span></div></div>`;
  });
  gatesHTML += `</div>`;
  const pillarHTML = pillarCardsHTML(results.byPillar);
  const detailsHTML = nextStepsHTML(results);
  const fullTab = `
    <div class="fullreport">
      <div class="toolbar">
        <button class="btn" id="btnGenFull">Generate full report</button>
        <button class="btn" id="btnCopyFull" data-target="fullText">Copy full report</button>
        <button class="btn" id="btnDownloadFull">Download .md</button>
      </div>
      <div class="report" id="fullText">(click "Generate full report")</div>
    </div>`;
  return [
    {id:"overall", title:"Overall", html: overallHTML},
    {id:"gates", title:"Critical Gates & Caps", html: gatesHTML},
    {id:"pillars", title:"Pillar Overview", html: pillarHTML},
    {id:"radar", title:"Radar Chart", html: generateRadarChart(results)},
    {id:"next", title:"Further Details", html: detailsHTML},
    {id:"exec", title:"Executive Summary", html: generateExecutiveSummary(results)},
    {id:"narrative", title:"Narrative", html: generateNarrative(results)},
    {id:"full", title:"Full Report", html: fullTab},
    {id:"analyst", title:"Analyst Lens", html: analystHTML(results)}
  ];
}
function openModal(title, html){ modalTitle.textContent = title; modalContent.innerHTML = html; overlay.style.display="flex"; }
function paramInfoHTML(pid){
  const def = MODEL.fullModel.parameters[pid]; const meta = PARAM_META[pid] || {};
  const scaleItems = def.checks.map((ch,i)=>({ch,i})).filter(x=> x.ch.type==="scale5" || x.ch.type==="scale100");
  let scalesHTML = "";
  if(scaleItems.length){
    scalesHTML = `<h4 style="margin:8px 0 4px 0">Scales & anchors</h4>`;
    scaleItems.forEach(({ch,i})=>{
      const sc = SCALE_CATALOG[ch.scaleRef||""] || null;
      const label = ch.label + (sc?` — <em>${sc.label}</em>`:"");
      const purpose = ch.purpose || (sc?sc.purpose:"");
      const anchors = sc? `<ul style="margin:6px 0 0 18px">${sc.anchors.map(a=>`<li>${a}</li>`).join("")}</ul>` : "";
      scalesHTML += `<div style="margin:8px 0"><strong>${label}</strong><div class="tiny">${purpose}</div>${anchors}</div>`;
    });
  }
  const deps = (meta.dependsOn||[]).map(d=>`<code style="font-family:var(--font-mono)">${d}</code>`).join(", ");
  return `
    <div class="tiny" style="margin-bottom:6px"><code style="font-family:var(--font-mono)">${pid}</code></div>
    <p>${meta.purpose || "No description available."}</p>
    ${meta.popular?`<p class="tiny">★ Popular: commonly adopted / high ROI</p>`:""}
    ${meta.dependsOn && meta.dependsOn.length ? `<p><strong>Depends on:</strong> ${deps}</p>`:""}
    ${scalesHTML}
  `;
}
document.getElementById("btnHelp").addEventListener("click", ()=>{
  openModal("Moderneer • Help / Legend", `
    <p>Assess via <b>checkboxes</b> & <b>scales</b> with clear <b>purpose</b> and <b>anchors</b>.</p>
    <ul style="margin:8px 0 0 18px">
      <li><b>Modules:</b> Core 24 (baseline) vs Full 12 Pillars (comprehensive).</li>
      <li><b>Views:</b> By Pillar vs By Tier (sequence low→high). <b>Tier ≠ Score level</b>.</li>
      <li><b>Icons:</b> ★ popular; ⛓️ dependencies; ⓘ details.</li>
      <li><b>N/A:</b> Exclude non-applicable sub-items.</li>
      <li><b>Weights:</b> Each sub-item shows its weight (w:%).</li>
      <li><b>Index→Scale:</b> 0–25→1..2, 25–50→2..3, 50–80→3..4, 80–100→4..5.</li>
      <li><b>Gates & Caps:</b> Key gates cap overall at ≤3; other caps may apply.</li>
      <li><b>Save/Load/Export:</b> Stored locally; export JSON to share.</li>
    </ul>
  `);
});

/* ---------- Events & persistence ---------- */
function attachHandlers(){
  formArea.addEventListener("click", e=>{
    const t=e.target;
    if(t.matches('[data-info]')){ const pid=t.getAttribute('data-info'); openModal(MODEL.fullModel.parameters[pid].label, paramInfoHTML(pid)); }
    if(t.matches('[data-pop]')){ const pid=t.getAttribute('data-pop'); openModal(MODEL.fullModel.parameters[pid].label, paramInfoHTML(pid)); }
    if(t.matches('[data-dep]')){
      const pid=t.getAttribute('data-dep'); const meta = PARAM_META[pid]||{}; const current = compute(true);
      let html = `<div class="tiny" style="margin-bottom:6px"><code style="font-family:var(--font-mono)">${pid}</code></div>`;
      if(!meta.dependsOn || !meta.dependsOn.length){ html += "<p>No dependencies.</p>"; }
      else{
        html += "<ul style='margin:8px 0 0 18px'>";
        meta.dependsOn.forEach(d=>{
          const scl = current.perParam?.[d]?.scale ?? null;
          const label = MODEL.fullModel.parameters[d]?.label || d;
          html += `<li><strong>${label}</strong> <span class="tiny">(${d})</span> — status: <b>${fmt(scl,1)}</b></li>`;
        });
        html += "</ul>";
      }
      openModal("Dependencies", html);
    }
    if(t.matches('[data-scale]')){
      const ref=t.getAttribute('data-scale'); const sc = SCALE_CATALOG[ref] || null;
      if(!sc){ openModal("Scale", "<p>No scale info available.</p>"); return; }
      openModal(sc.label, `<p>${sc.purpose}</p><ul style="margin:8px 0 0 18px">${sc.anchors.map(a=>`<li>${a}</li>`).join("")}</ul>`);
    }
  });
  formArea.addEventListener("change", e=>{
    const t=e.target;
    if(t.matches('[data-na="1"]')){
      const ctrl = t.closest(".row").querySelector('[data-param][data-index]:not([data-na])');
      if(ctrl){ ctrl.disabled = t.checked; }
    }
    compute();
  });
}
function saveAll(){ alert("Saved locally."); }
function loadAll(){ render(); alert("Loaded (if previously saved)."); }
function resetAll(){ if(!confirm("Clear all selections for this module?")) return; localStorage.removeItem(STORAGE_KEYS[currentModule]); render(); }


/* ---------- Report Builder ---------- */
function buildReport(results){
  let html = `<h3>Overall</h3>
    <p>You are at <b>Scale ${fmt(results.finalScale,1)}</b> (${band(results.finalScale)}).</p>
    <p>Overall Index: ${fmt(results.finalIndex,1)}</p>`;

  html += `<h3>Critical Gates & Caps</h3><ul>`;
  results.gates.forEach(g=>{
    html += `<li>${g.label}: <b>${g.pass ? "PASS" : "FAIL"}</b></li>`;
  });
  results.caps.forEach(c=>{
    html += `<li>${c.label}: ${c.trigger ? "<b>ACTIVE</b>" : "—"}</li>`;
  });
  html += `</ul>`;

  html += `<h3>Pillar Overview</h3>`;
  Object.keys(results.byPillar).forEach(p=>{
    const idx = results.byPillar[p];
    if(idx==null) return;
    html += `<p><b>${p}</b>: Index ${fmt(idx,1)} (Scale ${fmt(indexToScale(idx),1)})</p>`;
  });

  html += `<h3>Next Steps</h3>`;
  const saved = getSaved();
  visibleParamIds().forEach(pid=>{
    const def = MODEL.fullModel.parameters[pid];
    const recs = [];
    def.checks.forEach((ch,i)=>{
      const s = saved[pid]?.[i];
      if(!s || s.na) return;
      if(ch.type==="check" && !s.v){
        recs.push(`• ${ch.label}`);
      }
      if(ch.type==="scale5" && (s.v||0) < 3){
        recs.push(`• Improve "${ch.label}" (currently ${s.v||0}/5)`);
      }
      if(ch.type==="scale100" && (s.v||0) < 60){
        recs.push(`• Improve "${ch.label}" (currently ${s.v||0}%)`);
      }
    });
    if(recs.length){
      html += `<p><b>${def.label}</b> (${pid})<br/>${recs.join("<br/>")}</p>`;
    }
  });

  return html;
}

// Wait for DOM to be fully loaded before adding event listeners
document.addEventListener('DOMContentLoaded', function() {
  const btnCompute = document.getElementById("btnCompute");
  const btnReport = document.getElementById("btnReport");
  const btnSave = document.getElementById("btnSave");
  const btnLoad = document.getElementById("btnLoad");
  const btnReset = document.getElementById("btnReset");
  const btnExport = document.getElementById("btnExport");

  if (btnCompute) btnCompute.addEventListener("click", ()=>{
    compute();
    // Reset change tracking after compute
    if (window.resetChangeTracking) {
      setTimeout(() => window.resetChangeTracking(), 100);
    }
  });
  if (btnReport) btnReport.addEventListener("click", ()=>{ const results = compute(true); openTabbedModal("Detailed Report", buildReportTabs(results)); });
  if (btnSave) btnSave.addEventListener("click", saveAll);
  if (btnLoad) btnLoad.addEventListener("click", loadAll);
  if (btnReset) btnReset.addEventListener("click", resetAll);
  if (btnExport) btnExport.addEventListener("click", ()=>{
    const payload = { module:currentModule, view:currentView, ts:new Date().toISOString(), selections:getSaved(), results:compute(true) };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`moderneer_oemm_${currentModule}_${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  });
});
document.getElementById("btnCore").addEventListener("click", ()=>{
  currentModule="core";
  document.getElementById("btnCore").classList.add("active");
  document.getElementById("btnFull").classList.remove("active");
  render();
});
document.getElementById("btnFull").addEventListener("click", ()=>{
  currentModule="full";
  document.getElementById("btnFull").classList.add("active");
  document.getElementById("btnCore").classList.remove("active");
  render();
});
document.getElementById("btnViewPillar").addEventListener("click", ()=>{
  currentView="pillar";
  document.getElementById("btnViewPillar").classList.add("active");
  document.getElementById("btnViewTier").classList.remove("active");
  render();
});
document.getElementById("btnViewTier").addEventListener("click", ()=>{
  currentView="tier";
  document.getElementById("btnViewTier").classList.add("active");
  document.getElementById("btnViewPillar").classList.remove("active");
  render();
});

// Mode toggle
document.getElementById("btnModeAll").addEventListener("click", ()=>{
  singleMode=false;
  document.getElementById("btnModeAll").classList.add("active");
  document.getElementById("btnModeSingle").classList.remove("active");
  render();
});
document.getElementById("btnModeSingle").addEventListener("click", ()=>{
  singleMode=true;
  document.getElementById("btnModeSingle").classList.add("active");
  document.getElementById("btnModeAll").classList.remove("active");
  render();
});


/* ---------- Modular single mode ---------- */
function renderTiles(){
  const vis = new Set(visibleParamIds());
  if(currentView==="pillar"){
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="tile-grid" id="tileGrid"></div>`;
    const grid = wrap.firstElementChild;
    MODEL.fullModel.pillars.forEach(block=>{
      const params = block.parameters.filter(p=>vis.has(p));
      if(!params.length) return;
      const div = document.createElement("div");
      div.className = "tile";
      div.innerHTML = `
        <h4>${block.name}</h4>
        <div class="meta">
          <span class="pill">Weight ${MODEL.weights[block.name]}</span>
          <span class="pill">${params.length} items</span>
        </div>
        <button class="btn btn-primary" data-pillar="${block.name}">Open</button>`;
      grid.appendChild(div);
    });
    formArea.appendChild(wrap);
    grid.addEventListener("click", (e)=>{
      const btn = e.target.closest("[data-pillar]"); if(!btn) return;
      singleKey = btn.dataset.pillar;
      renderSinglePillar(singleKey);
    });
  } else {
    const tiers = {}; vis.forEach(pid=>{ const t=PARAM_META[pid]?.tier||6; (tiers[t]=tiers[t]||[]).push(pid); });
    const wrap = document.createElement("div"); wrap.innerHTML = `<div class="tile-grid" id="tileGrid"></div>`;
    const grid = wrap.firstElementChild;
    Object.keys(tiers).sort((a,b)=>a-b).forEach(t=>{
      const ids = tiers[t];
      const div = document.createElement("div");
      div.className="tile";
      div.innerHTML = `
        <h4>Tier ${t}</h4>
        <div class="meta"><span class="pill">${ids.length} items</span></div>
        <button class="btn btn-primary" data-tier="${t}">Open</button>`;
      grid.appendChild(div);
    });
    formArea.appendChild(wrap);
    grid.addEventListener("click", (e)=>{
      const btn = e.target.closest("[data-tier]"); if(!btn) return;
      singleKey = +btn.dataset.tier;
      renderSingleTier(singleKey);
    });
  }
}
function renderSinglePillar(name){
  formArea.innerHTML = "";
  const block = MODEL.fullModel.pillars.find(p=>p.name===name);
  const vis = new Set(visibleParamIds());
  const params = block.parameters.filter(p=>vis.has(p));
  const card = document.createElement("div"); card.className="pillar-card";
  card.innerHTML = `
    <header class="stepper">
      <div class="titleWrap"><h3 class="h3">${block.name}</h3><span class="pill">Weight: ${MODEL.weights[block.name]}</span></div>
      <div class="btns">
        <button class="btn" id="btnBackTiles">Back</button>
        <button class="btn" id="btnPrev">Prev</button>
        <button class="btn btn-primary" id="btnNext">Next</button>
      </div>
    </header>
    <div id="singleContainer"></div>`;
  formArea.appendChild(card);
  const inner = card.querySelector("#singleContainer");
  params.forEach(pid=> inner.appendChild(renderParam(block.name,pid,false)));
  document.getElementById("btnBackTiles").onclick = ()=> renderTiles();
  const blocks = MODEL.fullModel.pillars.filter(p=>p.parameters.some(x=>vis.has(x)));
  const idx = blocks.findIndex(b=>b.name===name);
  document.getElementById("btnPrev").onclick = ()=>{ const prev = blocks[(idx-1+blocks.length)%blocks.length]; renderSinglePillar(prev.name); };
  document.getElementById("btnNext").onclick = ()=>{ const next = blocks[(idx+1)%blocks.length]; renderSinglePillar(next.name); };
}
function renderSingleTier(t){
  formArea.innerHTML = "";
  const vis = new Set(visibleParamIds());
  const ids = []; vis.forEach(pid=>{ const tt=PARAM_META[pid]?.tier||6; if(tt===t) ids.push(pid); });
  const card = document.createElement("div"); card.className="pillar-card";
  card.innerHTML = `
    <header class="stepper">
      <div class="titleWrap"><h3 class="h3">Tier ${t}</h3><span class="tierTag">Low→High sequence</span></div>
      <div class="btns">
        <button class="btn" id="btnBackTiles">Back</button>
        <button class="btn" id="btnPrev">Prev</button>
        <button class="btn btn-primary" id="btnNext">Next</button>
      </div>
    </header>
    <div id="singleContainer"></div>`;
  formArea.appendChild(card);
  const inner = card.querySelector("#singleContainer");
  ids.forEach(pid=>{
    const pill = MODEL.fullModel.pillars.find(p=>p.parameters.includes(pid))?.name || "—";
    inner.appendChild(renderParam(pill,pid,true));
  });
  document.getElementById("btnBackTiles").onclick = ()=> renderTiles();
  const tiers = Array.from(new Set(Array.from(vis).map(pid=>PARAM_META[pid]?.tier||6))).sort((a,b)=>a-b);
  const idx = tiers.indexOf(t);
  document.getElementById("btnPrev").onclick = ()=>{ const prev = tiers[(idx-1+tiers.length)%tiers.length]; renderSingleTier(prev); };
  document.getElementById("btnNext").onclick = ()=>{ const next = tiers[(idx+1)%tiers.length]; renderSingleTier(next); };
}
/* ---------- Compute ---------- */

// --- persistent compute timestamp helpers ---
const COMPUTE_STAMP_KEY = (typeof STORAGE_KEY!=="undefined" ? STORAGE_KEY : "oemm") + ":lastCompute";
function saveComputeStamp(ts){
  try{ localStorage.setItem(COMPUTE_STAMP_KEY, String(ts||Date.now())); }catch(_){}
}
function readComputeStamp(){
  try{ const v = localStorage.getItem(COMPUTE_STAMP_KEY); return v? Number(v) : null; }catch(_){ return null; }
}
function fmtStamp(ts){
  if(!ts) return "never";
  const t = new Date(ts);
  const pad = n=>String(n).padStart(2,"0");
  return `${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
}
function refreshComputeStampLabel(){
  const el = document.getElementById("lastCompute");
  if(!el) return;
  el.textContent = "Last compute: " + fmtStamp(readComputeStamp());
}


function refreshVisibleRows(){
  const saved = getSaved();
  document.querySelectorAll('.row .comp').forEach(comp=>{
    // find owning param and index
    const row = comp.closest('.row');
    const input = row.querySelector('[data-param][data-index]');
    if(!input) return;
    const pid = input.dataset.param, i = input.dataset.index;
    const def = MODEL.fullModel.parameters[pid];
    if(!def) return;
    const rec = (saved[pid]||{})[i];
    const ch = def.checks[i];
    let num=0, den=0;
    if(rec && !rec.na){
      const w = (typeof ch.w==="number")? ch.w : 0;
      let val = 0;
      if(ch.type==="check") val = rec.v?1:0;
      else if(ch.type==="scale5") val = (rec.v||0)/5;
      else val = (rec.v||0)/100;
      num += w*val; den+=w;
    }
    const index = den>0 ? (num/den)*100 : 0;
    const scale = indexToScale(index);
    comp.innerHTML = `Compliance: ${fmt((den? (num/den) : 0)*100,0)}% · Index: ${fmt(index,1)} · Scale: ${fmt(scale,1)}`;
  });
}


function setLastCompute(){
  const el = document.getElementById("lastCompute");
  if(!el) return;
  const t = new Date();
  const pad = n=>String(n).padStart(2,"0");
  const stamp = `${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
  el.textContent = "Last compute: " + stamp;
}


function collectCompliance(){
  // Merge saved with current DOM values, then compute from saved for ALL visible params
  const saved = getSaved();
  // 1) Overlay any currently rendered controls onto saved
  document.querySelectorAll('[data-param][data-index]:not([data-na])').forEach(ctrl=>{
    const pid = ctrl.dataset.param, i = ctrl.dataset.index;
    saved[pid] = saved[pid] || {};
    const type = ctrl.dataset.type;
    let v = 0;
    if(type==="check") v = ctrl.checked ? 1 : 0;
    else if(type==="scale5") v = parseFloat(ctrl.value||"0");
    else v = parseFloat(ctrl.value||"0");
    const naEl = ctrl.closest(".row").querySelector('[data-na="1"]');
    const na = !!(naEl && naEl.checked);
    saved[pid][i] = { v, na };
  });
  setSaved(saved);

  // 2) Compute compliance per param from SAVED, not from DOM
  const out = {};
  const visSet = new Set(visibleParamIds());
  visSet.forEach(pid=>{
    const def = MODEL.fullModel.parameters[pid];
    if(!def) return;
    const recs = saved[pid] || {};
    let num = 0, den = 0;
    def.checks.forEach((ch,i)=>{
      const w = (typeof ch.w==="number")? ch.w : 0;
      const rec = recs[i];
      if(rec?.na) return;
      let val = 0;
      if(rec){
        if(ch.type==="check") val = rec.v?1:0;
        else if(ch.type==="scale5") val = (rec.v||0)/5;
        else val = (rec.v||0)/100;
      }
      num += w * val; den += w;
    });
    const idx = den>0 ? (num/den)*100 : 0;
    out[pid] = { index: idx, scale: indexToScale(idx) };
  });
  return out;
}

function compute(silent=false){
  const comp = collectCompliance();
  if(!silent){
    Object.keys(comp).forEach(pid=>{
      const idx=comp[pid].index, scl=comp[pid].scale;
      const key=b64(pid);
      const meta=document.getElementById(`meta-${key}`);
      const bar=document.getElementById(`bar-${key}`);
      const badge=document.getElementById(`badge-${key}`);
      if(meta) meta.textContent = `Compliance: ${fmt(idx,0)}% • Index: ${fmt(idx,0)} • Scale: ${fmt(scl,1)}`;
      if(bar) bar.style.width = `${Math.max(0,Math.min(100,idx))}%`;
      if(badge){
        badge.textContent = fmt(scl,1);
        badge.className = "score-badge " + (scl>=4?"score-good":scl>=3?"score-warn":"score-bad");
      }
    });
  }
  const byPillar = {};
  MODEL.fullModel.pillars.forEach(p=>{
    const ids = p.parameters.filter(id => visibleParamIds().includes(id));
    if(!ids.length) return;
    const idxs = ids.map(id => comp[id]?.index).filter(v=>v!=null);
    const avg = idxs.length ? idxs.reduce((a,c)=>a+c,0)/idxs.length : null;
    byPillar[p.name] = avg;
  });
  let sumW=0, sumWx=0;
  Object.keys(byPillar).forEach(p=>{
    const idx = byPillar[p];
    if(idx!=null){ sumW += MODEL.weights[p]||0; sumWx += (MODEL.weights[p]||0)*idx; }
  });
  const overallIndexPre = sumW? (sumWx/sumW) : null;
  const overallScalePre = indexToScale(overallIndexPre);
  const gates = MODEL.gates.map(g=>{
    const vals = g.params.map(pid => comp[pid]?.scale ?? null);
    const pass = vals.every(v=>v!=null) && ((g.logical==="AND") ? vals.every(v=>v>=g.threshold) : vals.some(v=>v>=g.threshold));
    return { id:g.id, label:g.label, pass };
  });
  const allPass = gates.every(x=>x.pass);
  let afterGatesScale = overallScalePre;
  if(afterGatesScale!=null && !allPass) afterGatesScale = Math.min(afterGatesScale,3.0);
  const caps = MODEL.caps.map(c=>{
    const vals = c.params.map(pid => comp[pid]?.scale ?? null);
    let trigger=false;
    if(vals.every(v=>v!=null)){
      if(c.logic==="OR"){ trigger = (vals[0] < c.lt) || (vals[1] < c.lt); }
      else if(c.logic==="LE"){ trigger = (vals[0] <= c.value); }
    }
    return { label:c.label, trigger, cap:c.cap };
  });
  let finalScale = afterGatesScale;
  caps.forEach(c=>{ if(c.trigger) finalScale = Math.min(finalScale, c.cap); });
  const finalIndex = (()=>{
    if(finalScale==null) return null;
    if(finalScale<=2) return (finalScale-1)*25;
    if(finalScale<=3) return 25 + (finalScale-2)*25;
    if(finalScale<=4) return 50 + (finalScale-3)*30;
    return 80 + (finalScale-4)*20;
  })();
  if(!silent){
    document.getElementById("overallIndex").textContent = fmt(finalIndex,1);
    document.getElementById("overallScale").textContent = fmt(finalScale,1);
    document.getElementById("overallBand").textContent = band(finalScale);
    document.getElementById("gatesPassed").textContent = allPass ? "All" : `${gates.filter(x=>x.pass).length}/${MODEL.gates.length}`;
    renderGateCaps(gates,caps); renderBreakdown(byPillar);
    
    // Update compute timestamp only when actually computing (not during render)
    setLastCompute();
  }
  return { perParam: comp, byPillar, overallIndexPre, overallScalePre, afterGatesScale, finalScale, finalIndex, gates, caps };
}
function renderGateCaps(gates,caps){
  const box=document.getElementById("gateList"); box.innerHTML="";
  gates.forEach(g=>{
    const row=document.createElement("div"); row.className="pillar-card";
    const cls = g.pass?"score-good":"score-bad";
    row.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div>${g.label}</div><span class="score-badge ${cls}">${g.pass?"PASS":"FAIL"}</span></div>`;
    box.appendChild(row);
  });
  const sep=document.createElement("div"); sep.className="tiny"; sep.style.marginTop="8px"; sep.textContent="Caps";
  box.appendChild(sep);
  caps.forEach(c=>{
    const row=document.createElement("div"); row.className="pillar-card";
    row.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div>${c.label}</div><span class="score-badge ${c.trigger?"score-bad":"score-good"}">${c.trigger?"ACTIVE":"—"}</span></div>`;
    box.appendChild(row);
  });
}
function renderBreakdown(byPillar){
  const cont=document.getElementById("pillarBreakdown"); cont.innerHTML="";
  Object.keys(MODEL.weights).forEach(p=>{
    const idx = byPillar[p]; if(idx==null) return;
    const scl = indexToScale(idx); const pct = Math.max(0,Math.min(100,idx));
    const state = scl>=4?"score-good":(scl>=3?"score-warn":"score-bad");
    const card=document.createElement("div"); card.className="pillar-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="display:flex; gap:8px; align-items:baseline">
          <strong>${p}</strong><span class="pill">Weight: ${MODEL.weights[p]}</span>
        </div>
        <span class="score-badge ${state}">${fmt(scl,1)}</span>
      </div>
      <div class="progress" style="margin-top:8px"><div class="bar" style="width:${pct}%"></div></div>
      <div class="tiny">Index: ${fmt(idx,1)}</div>
    `;
    cont.appendChild(card);
  });
}

/* Make functions globally available */
window.setLastCompute = setLastCompute;

/* Init */
render();
