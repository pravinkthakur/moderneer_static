/**
 * Test Fixtures and Data
 * Centralized test data for consistent testing across all test suites
 */

// Site pages and their expected properties
export const SITE_PAGES = {
  home: {
    url: '/',
    title: 'Moderneer | Modernizing Engineering & DevOps',
    file: 'index.html',
    hasAssessment: false,
    expectedElements: ['#header-include', '#footer-include', 'nav', 'main']
  },
  about: {
    url: '/about.html',
    title: 'About | Moderneer',
    file: 'about.html',
    hasAssessment: false,
    expectedElements: ['#header-include', '#footer-include', 'nav', 'main']
  },
  services: {
    url: '/services.html',
    title: 'Services | Moderneer',
    file: 'services.html',
    hasAssessment: false,
    expectedElements: ['#header-include', '#footer-include', 'nav', 'main']
  },
  assessment: {
    url: '/assessment.html',
    title: 'Assessment — Moderneer',
    file: 'assessment.html',
    hasAssessment: false,
    expectedElements: ['h1', '#logout', 'script']
  },
  'self-assessment': {
    url: '/self-assessment.html',
    title: 'Moderneer • Outcome Engineering Maturity',
    file: 'self-assessment.html',
    hasAssessment: true,
    expectedElements: ['.brandbar', '#btnHelp', '#btnCore', '#btnFull', '#btnCompute']
  },
  solutions: {
    url: '/solutions.html',
    title: 'Solutions | Moderneer',
    file: 'solutions.html',
    hasAssessment: false,
    expectedElements: ['#header-include', '#footer-include', 'nav', 'main']
  },
  approach: {
    url: '/approach.html',
    title: 'Approach | Moderneer',
    file: 'approach.html',
    hasAssessment: false,
    expectedElements: ['#header-include', '#footer-include', 'nav', 'main']
  },
  maturity: {
    url: '/maturity.html',
    title: 'Maturity Model | Moderneer',
    file: 'maturity.html',
    hasAssessment: false,
    expectedElements: ['#header-include', '#footer-include', 'nav', 'main']
  },
  'case-studies': {
    url: '/case-studies.html',
    title: 'Case Studies | Moderneer',
    file: 'case-studies.html',
    hasAssessment: false,
    expectedElements: ['#header-include', '#footer-include', 'nav', 'main']
  },
  bootcamps: {
    url: '/bootcamps.html',
    title: 'Bootcamps | Moderneer',
    file: 'bootcamps.html',
    hasAssessment: false,
    expectedElements: ['#header-include', '#footer-include', 'nav', 'main']
  },
  playbooks: {
    url: '/playbooks.html',
    title: 'Playbooks | Moderneer',
    file: 'playbooks.html',
    hasAssessment: false,
    expectedElements: ['#header-include', '#footer-include', 'nav', 'main']
  },
  contact: {
    url: '/contact.html',
    title: 'Contact | Moderneer',
    file: 'contact.html',
    hasAssessment: false,
    expectedElements: ['#header-include', '#footer-include', 'nav', 'main']
  },
  privacy: {
    url: '/privacy.html',
    title: 'Privacy Policy | Moderneer',
    file: 'privacy.html',
    hasAssessment: false,
    expectedElements: ['#header-include', '#footer-include', 'nav', 'main']
  },
  terms: {
    url: '/terms.html',
    title: 'Terms of Service | Moderneer',
    file: 'terms.html',
    hasAssessment: false,
    expectedElements: ['#header-include', '#footer-include', 'nav', 'main']
  }
};

// Navigation links and their properties
export const NAVIGATION_LINKS = [
  { text: 'Home', href: 'index.html', page: 'home' },
  { text: 'About', href: 'about.html', page: 'about' },
  { text: 'Services', href: 'services.html', page: 'services' },
  { text: 'Assessment', href: 'assessment/', page: 'assessment' },
  { text: 'Solutions', href: 'solutions.html', page: 'solutions' },
  { text: 'Approach', href: 'approach.html', page: 'approach' },
  { text: 'Maturity', href: 'maturity.html', page: 'maturity' },
  { text: 'Case Studies', href: 'case-studies.html', page: 'case-studies' },
  { text: 'Bootcamps', href: 'bootcamps.html', page: 'bootcamps' },
  { text: 'Playbooks', href: 'playbooks.html', page: 'playbooks' },
  { text: 'Contact', href: 'contact.html', page: 'contact' }
];

// Footer links
export const FOOTER_LINKS = [
  { text: 'Privacy Policy', href: 'privacy.html' },
  { text: 'Terms of Service', href: 'terms.html' },
  { text: 'Contact', href: 'contact.html' }
];

// Assessment test data
export const ASSESSMENT_DATA = {
  pillars: [
    'Technology & Architecture',
    'DevOps & CI/CD', 
    'Cloud & Infrastructure',
    'Security & Compliance',
    'Monitoring & Observability',
    'Data & Analytics',
    'Team & Culture',
    'Process & Methodology',
    'Quality & Testing',
    'Performance & Scalability',
    'Documentation & Knowledge',
    'Innovation & Emerging Tech'
  ],
  sampleAnswers: {
    'Technology & Architecture': 3,
    'DevOps & CI/CD': 4,
    'Cloud & Infrastructure': 2,
    'Security & Compliance': 3,
    'Monitoring & Observability': 1,
    'Data & Analytics': 3,
    'Team & Culture': 4,
    'Process & Methodology': 3,
    'Quality & Testing': 2,
    'Performance & Scalability': 3,
    'Documentation & Knowledge': 2,
    'Innovation & Emerging Tech': 1
  },
  expectedScoreRange: {
    min: 0,
    max: 60
  }
};

// Test user data
export const TEST_USERS = {
  standard: {
    name: 'Test User',
    email: 'test@moderneer.co.uk',
    company: 'Test Company Ltd'
  },
  enterprise: {
    name: 'Enterprise Admin',
    email: 'admin@enterprise.com',
    company: 'Enterprise Corporation'
  }
};

// Device and viewport configurations
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 }
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  pageLoadTime: 3000, // milliseconds
  firstContentfulPaint: 1500,
  largestContentfulPaint: 2500,
  cumulativeLayoutShift: 0.1,
  firstInputDelay: 100
};

// Accessibility standards
export const ACCESSIBILITY_STANDARDS = {
  level: 'AA',
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'alt-text': { enabled: true },
    'heading-structure': { enabled: true }
  }
};

// Expected version information
export const VERSION_INFO = {
  expectedVersion: '3.1.0',
  expectedBuildPrefix: '241014',
  expectedEnvironment: 'production'
};

// Error page configurations
export const ERROR_PAGES = {
  404: {
    url: '/nonexistent-page.html',
    expectedTitle: '404',
    expectedContent: ['Page Not Found', '404']
  }
};

// External links to validate
export const EXTERNAL_LINKS = [
  // Add any external links that should be validated
];

// Common CSS selectors
export const SELECTORS = {
  navigation: {
    menu: 'nav',
    menuItems: 'nav a',
    mobileToggle: '#nav-toggle',
    activeItem: '[aria-current="page"]'
  },
  header: {
    container: '#header-include',
    logo: 'nav .logo, nav h1',
    navigation: 'nav ul, nav .nav-links'
  },
  footer: {
    container: '#footer-include',
    copyright: '#yr',
    version: '#app-version',
    links: '.footer-content a'
  },
  assessment: {
    container: '.brandbar',
    toolbar: '.toolbar',
    coreButton: '#btnCore',
    fullButton: '#btnFull',
    computeButton: '#btnCompute',
    helpButton: '#btnHelp',
    viewPillarButton: '#btnViewPillar',
    viewTierButton: '#btnViewTier',
    questions: '.question, .pillar-section',
    sliders: 'input[type="range"], .slider',
    buttons: {
      generate: '#btnCompute',
      copy: 'button:has-text("Copy")',
      download: 'button:has-text("Download")'
    },
    modal: '.modal, .help-modal',
    radarChart: '.radar, .chart',
    report: '.results, .scoring-results'
  },
  common: {
    loading: '.loading, .spinner',
    error: '.error, .alert-error',
    success: '.success, .alert-success'
  }
};

// Test timeouts
export const TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  assessment: 60000
};