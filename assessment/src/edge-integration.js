/**
 * Edge Assessment Integration
 * Handles loading Edge-generated assessment.json files and syncing with the static assessment UI
 */

// Global variable to store loaded Edge assessment data
window.EDGE_ASSESSMENT = null;

/**
 * Load and parse Edge assessment.json file
 * @param {File} file - The uploaded file
 * @returns {Promise<Object>} Parsed assessment data
 */
export async function loadEdgeAssessment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const assessment = JSON.parse(e.target.result);
        
        // Validate Edge assessment format
        if (!assessment.pillars || !Array.isArray(assessment.pillars)) {
          throw new Error('Invalid Edge assessment format: missing pillars array');
        }
        
        console.log('✅ Edge assessment loaded:', {
          company: assessment.company_name,
          repo: assessment.repo_name,
          generated: assessment.generated_at_utc,
          pillars: assessment.pillars.length,
          overallScore: assessment.overall_score
        });
        
        // Store globally for export
        window.EDGE_ASSESSMENT = assessment;
        
        // Update assessment context banner
        try {
          const { updateAssessmentContext, extractContextFromAssessment } = await import('./context-manager.js');
          const context = extractContextFromAssessment(assessment);
          updateAssessmentContext(context);
        } catch (err) {
          console.warn('Could not update context banner:', err);
        }
        
        resolve(assessment);
      } catch (error) {
        console.error('❌ Error parsing Edge assessment:', error);
        reject(new Error('Failed to parse assessment file: ' + error.message));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Map Edge parameter IDs to static assessment parameter IDs
 * Edge format: "strat.okr_link", "cust.proximity"
 * Static format: May use same or need mapping
 */
function mapEdgeParameterId(edgeParamId) {
  // For now, assume they match. Add mapping here if needed.
  return edgeParamId;
}

/**
 * Extract user answers from Edge assessment and populate the UI
 * @param {Object} edgeAssessment - The Edge assessment data
 * @param {Function} getSaved - Function to get current saved state
 * @param {Function} setSaved - Function to update saved state
 */
export function populateFromEdgeAssessment(edgeAssessment, getSaved, setSaved) {
  if (!edgeAssessment || !edgeAssessment.pillars) {
    throw new Error('Invalid Edge assessment data');
  }
  
  const savedState = getSaved();
  let updatedCount = 0;
  
  // Iterate through pillars and parameters
  edgeAssessment.pillars.forEach(pillar => {
    if (!pillar.parameters || !Array.isArray(pillar.parameters)) return;
    
    pillar.parameters.forEach(param => {
      const paramId = mapEdgeParameterId(param.parameter_id);
      
      if (!param.checks || !Array.isArray(param.checks)) return;
      
      // Initialize parameter object if not exists
      if (!savedState[paramId]) {
        savedState[paramId] = {};
      }
      
      // Map each check to the UI
      param.checks.forEach((check, checkIndex) => {
        const checkData = {
          v: null,  // value
          na: false,  // Never auto-disable - user must manually check N/A
          evidence: check.evidence_excerpt || check.answer || '',
          answer: check.answer || '',
          manual_review_required: check.manual_review_required || false  // Track this separately
        };
        
        // Convert score to appropriate format based on check_type
        if (check.score !== null && check.score !== undefined) {
          // Check type determines how to interpret the score
          if (check.check_type === 'check') {
            // Boolean check: Edge should only have 0 or 100, but handle any value > 0 as true
            checkData.v = check.score > 0;
          } else if (check.check_type === 'scale5') {
            // Scale 0-5: score is 0-100, convert to 0-5
            checkData.v = Math.min(5, Math.max(0, (check.score / 100) * 5));
          } else if (check.check_type === 'scale100') {
            // Scale 0-100: use score directly
            checkData.v = Math.min(100, Math.max(0, check.score));
          }
          // If we have a score, this was LLM assessed successfully
        }
        // Note: We intentionally don't set na=true for manual_review_required
        // The control should remain enabled so user can provide the value
        
        savedState[paramId][checkIndex] = checkData;
        updatedCount++;
      });
    });
  });
  
  // Save updated state
  setSaved(savedState);
  
  console.log(`✅ Populated ${updatedCount} checks from Edge assessment`);
  return updatedCount;
}

/**
 * Export assessment data in Edge format
 * @param {Object} currentSelections - Current UI selections from getSaved()
 * @param {Object} computedResults - Results from compute()
 * @param {Object} MODEL - The assessment MODEL
 * @param {Object} PARAM_META - Parameter metadata
 * @returns {Object} Edge-formatted assessment
 */
export function exportToEdgeFormat(currentSelections, computedResults, MODEL, PARAM_META) {
  const ctx = window.ASSESSMENT_CONTEXT || {};
  const edgeAssessment = window.EDGE_ASSESSMENT || {
    version: "3.0.0",
    schema_version: "3.0.0",
    generated_at_utc: new Date().toISOString(),
    company_name: ctx.companyName || null,
    repo_name: ctx.repoName || "Static Assessment Export",
    repo_url: ctx.repoUrl || "",
    assessment_type: "manual",
    overall_score: Math.round(computedResults.finalIndex || 0),
    overall_confidence: 0.9,
    pillars: []
  };
  
  // Update overall score and metadata
  edgeAssessment.overall_score = Math.round(computedResults.finalIndex || 0);
  edgeAssessment.generated_at_utc = new Date().toISOString();
  edgeAssessment.company_name = ctx.companyName || edgeAssessment.company_name;
  edgeAssessment.repo_name = ctx.repoName || edgeAssessment.repo_name;
  
  // Build pillars array
  const pillars = [];
  
  if (MODEL && MODEL.fullModel && MODEL.fullModel.pillars) {
    MODEL.fullModel.pillars.forEach(pillar => {
      const pillarScore = computedResults.byPillar && computedResults.byPillar[pillar.name] 
        ? Math.round(computedResults.byPillar[pillar.name]) 
        : 0;
      
      const pillarData = {
        pillar_id: pillar.id || pillar.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        pillar_name: pillar.name,
        pillar_score: pillarScore,
        parameters: []
      };
      
      // Add parameters
      if (pillar.parameters && Array.isArray(pillar.parameters)) {
        pillar.parameters.forEach(paramId => {
          const paramDef = MODEL.fullModel.parameters[paramId];
          const paramMeta = PARAM_META[paramId] || {};
          const paramSelections = currentSelections[paramId] || {};
          
          if (!paramDef) return;
          
          const paramScore = computedResults.perParam && computedResults.perParam[paramId]
            ? Math.round(computedResults.perParam[paramId].index || 0)
            : 0;
          
          const paramData = {
            parameter_id: paramId,
            parameter_label: paramMeta.label || paramId,
            parameter_score: paramScore,
            checks: []
          };
          
          // Add checks
          const checks = paramMeta.checks || paramDef.checks || [];
          checks.forEach((checkDef, checkIndex) => {
            const selection = paramSelections[checkIndex] || {};
            
            let score = null;
            if (selection.v !== undefined && selection.v !== null && !selection.na) {
              if (checkDef.type === 'check') {
                score = selection.v ? 100 : 0;
              } else if (checkDef.type === 'scale5') {
                score = Math.round((selection.v / 5) * 100);
              } else if (checkDef.type === 'scale100') {
                score = Math.round(selection.v);
              }
            }
            
            const checkData = {
              check_id: `${paramId}.check_${checkIndex}`,
              check_label: checkDef.label || `Check ${checkIndex + 1}`,
              check_type: checkDef.type || 'check',
              weight: checkDef.w || 0,
              answer: selection.answer || (score !== null ? `User answered: ${selection.v}` : ''),
              evidence_excerpt: selection.evidence || '',
              score: score,
              confidence: score !== null ? 1.0 : 0,
              evidence_quality: score !== null ? "manual" : "none",
              files_analyzed: [],
              manual_review_required: selection.na || score === null
            };
            
            paramData.checks.push(checkData);
          });
          
          pillarData.parameters.push(paramData);
        });
      }
      
      pillars.push(pillarData);
    });
  }
  
  edgeAssessment.pillars = pillars;
  
  return edgeAssessment;
}

/**
 * Add evidence tooltips to check elements in the UI
 * @param {HTMLElement} checkElement - The check row element
 * @param {string} evidence - The evidence text to show
 * @param {string} type - Icon type: 'warning' for manual review, 'success' for LLM assessed
 */
export function addEvidenceTooltip(checkElement, evidence, type = 'warning') {
  if (!evidence || !checkElement) return;
  
  // Find the label or control area
  const labelElement = checkElement.querySelector('label');
  if (!labelElement) return;
  
  // Choose icon and color based on type
  const iconConfig = {
    warning: { icon: '⚠️', color: '#EF4444', label: 'Manual review needed' },
    success: { icon: '✅', color: '#22C55E', label: 'LLM assessed' }
  };
  
  const config = iconConfig[type] || iconConfig.warning;
  
  // Create icon with tooltip
  const tooltipIcon = document.createElement('span');
  tooltipIcon.className = `evidence-icon evidence-icon-${type}`;
  tooltipIcon.innerHTML = config.icon;
  tooltipIcon.title = `${config.label}: ${evidence}`;
  tooltipIcon.style.cssText = `
    margin-left: 8px;
    cursor: help;
    font-size: 1em;
    vertical-align: middle;
    opacity: 0.7;
    transition: opacity 0.2s;
  `;
  
  // Add hover effect
  tooltipIcon.addEventListener('mouseenter', function() {
    this.style.opacity = '1';
  });
  
  tooltipIcon.addEventListener('mouseleave', function() {
    this.style.opacity = '0.7';
  });
  
  // Add tooltip container for better UX
  const tooltip = document.createElement('div');
  tooltip.className = 'evidence-tooltip';
  tooltip.innerHTML = `<strong style="color: ${config.color};">${config.label}</strong><br>${evidence}`;
  tooltip.style.cssText = `
    display: none;
    position: absolute;
    background: #1F2937;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    max-width: 300px;
    z-index: 1000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    line-height: 1.4;
  `;
  
  tooltipIcon.addEventListener('mouseenter', function(e) {
    document.body.appendChild(tooltip);
    const rect = this.getBoundingClientRect();
    tooltip.style.display = 'block';
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 5) + 'px';
  });
  
  tooltipIcon.addEventListener('mouseleave', function() {
    if (tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
  });
  
  labelElement.appendChild(tooltipIcon);
}
