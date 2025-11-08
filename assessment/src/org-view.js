/**
 * Organization Multi-Repo View Manager
 * Handles tabbed interface for assessing multiple repositories
 */

// Global state for org assessment
window.ORG_ASSESSMENT = {
  isOrgView: false,
  currentRepoIndex: 0,
  repositories: [],
  assessments: {}, // Store assessment data for each repo
  combined: null // Combined org-level assessment
};

/**
 * Initialize organization view
 */
export function initOrgView() {
  const urlParams = new URLSearchParams(window.location.search);
  const isOrgView = urlParams.get('view') === 'org';
  
  if (!isOrgView) {
    return false;
  }
  
  // Load context from localStorage
  const context = JSON.parse(localStorage.getItem('assessment_context') || '{}');
  
  if (!context.repositories || context.repositories.length === 0) {
    console.warn('No repositories found in context for org view');
    return false;
  }
  
  window.ORG_ASSESSMENT.isOrgView = true;
  window.ORG_ASSESSMENT.repositories = context.repositories;
  window.ORG_ASSESSMENT.orgName = context.orgName;
  
  console.log(`✅ Org view initialized: ${context.orgName} with ${context.repositories.length} repos`);
  
  // Show org tabs
  renderOrgTabs();
  
  // Load first repo by default
  switchToRepo(0);
  
  return true;
}

/**
 * Render repository tabs
 */
function renderOrgTabs() {
  const tabsContainer = document.getElementById('orgRepoTabs');
  const tabList = document.getElementById('orgRepoTabList');
  
  if (!tabsContainer || !tabList) {
    console.warn('Org tabs container not found');
    return;
  }
  
  tabsContainer.style.display = 'block';
  tabList.innerHTML = '';
  
  window.ORG_ASSESSMENT.repositories.forEach((repo, index) => {
    const tab = document.createElement('button');
    tab.className = 'repo-tab';
    tab.dataset.repoIndex = index;
    tab.textContent = repo.name;
    tab.title = repo.fullName;
    
    // Style
    tab.style.cssText = `
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      transition: all 0.2s;
    `;
    
    tab.addEventListener('click', () => switchToRepo(index));
    
    if (index === window.ORG_ASSESSMENT.currentRepoIndex) {
      tab.style.background = '#3b82f6';
      tab.style.color = 'white';
      tab.style.borderColor = '#3b82f6';
    }
    
    tabList.appendChild(tab);
  });
  
  // Add org overview tab handler
  const orgOverviewTab = document.getElementById('orgOverviewTab');
  if (orgOverviewTab) {
    orgOverviewTab.addEventListener('click', showOrgOverview);
  }
}

/**
 * Switch to a specific repository
 */
export function switchToRepo(repoIndex) {
  if (repoIndex < 0 || repoIndex >= window.ORG_ASSESSMENT.repositories.length) {
    console.error(`Invalid repo index: ${repoIndex}`);
    return;
  }
  
  window.ORG_ASSESSMENT.currentRepoIndex = repoIndex;
  const repo = window.ORG_ASSESSMENT.repositories[repoIndex];
  
  console.log(`Switching to repo: ${repo.name}`);
  
  // Update tab styles
  document.querySelectorAll('.repo-tab').forEach((tab, idx) => {
    if (parseInt(tab.dataset.repoIndex) === repoIndex) {
      tab.style.background = '#3b82f6';
      tab.style.color = 'white';
      tab.style.borderColor = '#3b82f6';
    } else if (!tab.classList.contains('org-overview-tab')) {
      tab.style.background = 'white';
      tab.style.color = '#374151';
      tab.style.borderColor = '#e5e7eb';
    }
  });
  
  // Hide org overview
  document.getElementById('orgScoreSummary').style.display = 'none';
  document.getElementById('formArea').style.display = 'block';
  
  // Update context banner
  updateContextForRepo(repo);
  
  // Load or restore assessment for this repo
  loadRepoAssessment(repoIndex);
}

/**
 * Show organization overview (combined view)
 */
function showOrgOverview() {
  console.log('Showing organization overview');
  
  // Update tab styles - deselect all repo tabs
  document.querySelectorAll('.repo-tab:not(.org-overview-tab)').forEach(tab => {
    tab.style.background = 'white';
    tab.style.color = '#374151';
    tab.style.borderColor = '#e5e7eb';
  });
  
  // Hide individual assessment form
  document.getElementById('formArea').style.display = 'none';
  
  // Show org score summary
  const summaryEl = document.getElementById('orgScoreSummary');
  summaryEl.style.display = 'block';
  
  // Calculate org-level scores
  calculateOrgScores();
  
  // Update context banner
  document.getElementById('contextRepoName').textContent = `${window.ORG_ASSESSMENT.orgName} Organization`;
  document.getElementById('contextCompanyName').textContent = `${window.ORG_ASSESSMENT.repositories.length} repositories`;
}

/**
 * Calculate and display organization-level scores
 */
function calculateOrgScores() {
  const repos = window.ORG_ASSESSMENT.repositories;
  const assessments = window.ORG_ASSESSMENT.assessments;
  
  // Count repos with assessment data
  const assessedRepos = repos.filter((_, idx) => assessments[idx]);
  
  if (assessedRepos.length === 0) {
    document.getElementById('orgOverallScore').textContent = '—';
    document.getElementById('orgAvgScore').textContent = '—';
    document.getElementById('orgRepoCount').textContent = `0/${repos.length}`;
    return;
  }
  
  // Calculate average score across all assessed repos
  let totalScore = 0;
  assessedRepos.forEach((repo, idx) => {
    const repoIdx = repos.findIndex(r => r.name === repo.name);
    const assessment = assessments[repoIdx];
    
    // Get overall score from assessment data (you'll need to calculate this from pillar scores)
    const score = calculateOverallScore(assessment);
    totalScore += score;
  });
  
  const avgScore = Math.round(totalScore / assessedRepos.length);
  
  // Display scores
  document.getElementById('orgAvgScore').textContent = avgScore;
  document.getElementById('orgRepoCount').textContent = `${assessedRepos.length}/${repos.length}`;
  
  // If combined org assessment exists, show it
  if (window.ORG_ASSESSMENT.combined) {
    document.getElementById('orgOverallScore').textContent = window.ORG_ASSESSMENT.combined.overall_score || '—';
  } else {
    document.getElementById('orgOverallScore').textContent = avgScore;
  }
}

/**
 * Calculate overall score from assessment data
 */
function calculateOverallScore(assessment) {
  if (!assessment || !assessment.pillars) {
    return 0;
  }
  
  // If assessment has overall_score field, use it (Edge assessments always have this)
  if (assessment.overall_score !== undefined) {
    return assessment.overall_score;
  }
  
  // WARNING: This fallback should rarely be used. Edge assessments always include overall_score.
  // Fallback: Calculate simple average from pillar scores (NOT weighted, NOT tapered)
  // This is only for legacy/malformed data and will NOT match Edge's weighted tapered calculation.
  console.warn('⚠️ Assessment missing overall_score field - using simple pillar average (may be inaccurate)');
  
  const pillarScores = assessment.pillars
    .map(p => p.pillar_score || 0)
    .filter(score => !isNaN(score));
  
  if (pillarScores.length === 0) {
    return 0;
  }
  
  return Math.round(pillarScores.reduce((sum, score) => sum + score, 0) / pillarScores.length);
}

/**
 * Update context banner for a specific repo
 */
function updateContextForRepo(repo) {
  document.getElementById('contextRepoName').textContent = repo.name;
  document.getElementById('contextCompanyName').textContent = `Organization: ${window.ORG_ASSESSMENT.orgName}`;
  document.getElementById('contextMetadata').innerHTML = `Repository ${window.ORG_ASSESSMENT.currentRepoIndex + 1} of ${window.ORG_ASSESSMENT.repositories.length}`;
}

/**
 * Load or restore assessment for a specific repo
 */
function loadRepoAssessment(repoIndex) {
  const repo = window.ORG_ASSESSMENT.repositories[repoIndex];
  
  // Check if we have cached assessment data for this repo
  if (window.ORG_ASSESSMENT.assessments[repoIndex]) {
    console.log(`Restoring cached assessment for ${repo.name}`);
    // TODO: Restore form state from cached data
    return;
  }
  
  // Check localStorage for saved data for this repo
  const savedKey = `oemm_org_${window.ORG_ASSESSMENT.orgName}_repo_${repo.name}`;
  const saved = localStorage.getItem(savedKey);
  
  if (saved) {
    console.log(`Loading saved assessment for ${repo.name}`);
    try {
      const data = JSON.parse(saved);
      window.ORG_ASSESSMENT.assessments[repoIndex] = data;
      // TODO: Populate form with saved data
    } catch (e) {
      console.error('Failed to parse saved assessment:', e);
    }
  } else {
    console.log(`No existing assessment found for ${repo.name}, starting fresh`);
  }
}

/**
 * Save current repo assessment
 */
export function saveCurrentRepoAssessment(data) {
  const repoIndex = window.ORG_ASSESSMENT.currentRepoIndex;
  const repo = window.ORG_ASSESSMENT.repositories[repoIndex];
  
  // Cache in memory
  window.ORG_ASSESSMENT.assessments[repoIndex] = data;
  
  // Save to localStorage
  const savedKey = `oemm_org_${window.ORG_ASSESSMENT.orgName}_repo_${repo.name}`;
  localStorage.setItem(savedKey, JSON.stringify(data));
  
  console.log(`✅ Saved assessment for ${repo.name}`);
}

/**
 * Load combined org assessment (from Edge combined-assessment.json)
 */
export async function loadCombinedOrgAssessment(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validate it's an org assessment
    if (data.assessment_type && data.assessment_type.includes('org')) {
      window.ORG_ASSESSMENT.combined = data;
      console.log('✅ Loaded combined org assessment:', data);
      
      // Update org overview if it's currently shown
      if (document.getElementById('orgScoreSummary').style.display !== 'none') {
        calculateOrgScores();
      }
      
      return true;
    }
    
    console.warn('File does not appear to be an org assessment');
    return false;
    
  } catch (e) {
    console.error('Failed to load combined org assessment:', e);
    return false;
  }
}
