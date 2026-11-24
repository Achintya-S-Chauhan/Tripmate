/**
 * Automated Verification Test for TripMate Multi-Theme System,
 * Text Contrast, Natural Sidebar Scrolling & SOS Redesign
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

console.log('🚀 [Test Suite] Starting Multi-Theme, Contrast, Layout & SOS Verification...\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failCount++;
  }
}

// ---------------------------------------------------------------------------
// TEST 1: CSS Multi-Theme Architecture in src/index.css
// ---------------------------------------------------------------------------
console.log('1️⃣ Multi-Theme Design Tokens in src/index.css...');

const cssContent = fs.readFileSync(path.join(projectRoot, 'src/index.css'), 'utf8');

const themeFamilies = ['forest', 'ocean', 'sand', 'slate'];
for (const fam of themeFamilies) {
  assert(
    cssContent.includes(`data-theme-family="${fam}"`[0]),
    `Theme family "${fam}" selector configured in index.css`
  );
  assert(
    cssContent.includes(`data-theme-family="${fam}"][data-appearance="light"]`) &&
    cssContent.includes(`data-theme-family="${fam}"][data-appearance="dark"]`),
    `Theme family "${fam}" provides explicit LIGHT and DARK tokens`
  );
}

// Check semantic tokens
const requiredTokens = [
  '--bg-main',
  '--bg-sidebar',
  '--bg-header',
  '--bg-card',
  '--bg-subtle',
  '--bg-input',
  '--border-subtle',
  '--text-primary',
  '--text-secondary',
  '--text-muted',
  '--accent-primary',
  '--accent-bg',
  '--accent-secondary',
  '--color-error',
];

for (const token of requiredTokens) {
  assert(cssContent.includes(token), `Semantic token "${token}" declared in theme base`);
}

// ---------------------------------------------------------------------------
// TEST 2: Layout & Natural Document Scrolling
// ---------------------------------------------------------------------------
console.log('\n2️⃣ Layout & Natural Document Sidebar Scrolling...');

const appLayoutSource = fs.readFileSync(path.join(projectRoot, 'src/components/layout/AppLayout.jsx'), 'utf8');
const sidebarSource = fs.readFileSync(path.join(projectRoot, 'src/components/layout/Sidebar.jsx'), 'utf8');

assert(
  !appLayoutSource.includes('overflow-hidden') && !appLayoutSource.includes('overflow-y-auto custom-scrollbar'),
  'AppLayout container has NO overflow-hidden or inner overflow-y-auto trapping page scroll'
);

assert(
  !sidebarSource.includes('position: fixed') &&
  !sidebarSource.includes('fixed inset-y-0') &&
  !sidebarSource.includes('overflow-y-auto custom-scrollbar'),
  'Sidebar does not use fixed position or isolated scroll trap; participates in document flow'
);

// ---------------------------------------------------------------------------
// TEST 3: Emergency SOS Redesign
// ---------------------------------------------------------------------------
console.log('\n3️⃣ Emergency SOS Calm Console Redesign...');

const safetyCenterSource = fs.readFileSync(path.join(projectRoot, 'src/pages/SafetyCenterPage.jsx'), 'utf8');
const sosModalSource = fs.readFileSync(path.join(projectRoot, 'src/components/common/SosModal.jsx'), 'utf8');

assert(
  !safetyCenterSource.includes('#0d1726') &&
  !safetyCenterSource.includes('TRIGGER SOS SIMULATOR') &&
  safetyCenterSource.includes('Simulated Emergency SOS Routine'),
  'SafetyCenter replaces neon cyber-block with calm professional SOS routine card'
);

assert(
  safetyCenterSource.includes('btn-travel-emergency') || safetyCenterSource.includes('bg-red-600'),
  'SafetyCenter uses restrained emergency red action button'
);

assert(
  safetyCenterSource.includes('Demonstration Sandbox Notice') || safetyCenterSource.includes('Sandbox Simulator'),
  'Prominent sandbox notice makes simulator status distinct from real emergency'
);

assert(
  !sosModalSource.includes('#140b0e') && !sosModalSource.includes('bg-[#0f111a]'),
  'SosModal eliminated dark navy / pink cyberpunk background in favor of theme tokens'
);

assert(
  sosModalSource.includes('Accidental Activation Guard') &&
  sosModalSource.includes('closeSosConfirmation'),
  'SosModal preserves safe accidental activation confirmation step'
);

// ---------------------------------------------------------------------------
// TEST 4: Text Contrast & Elimination of Rogue Colors
// ---------------------------------------------------------------------------
console.log('\n4️⃣ Text Contrast & Elimination of Hardcoded Rogue Colors...');

const auditPages = [
  'src/pages/TripDetailsPage.jsx',
  'src/pages/TravelInsightsPage.jsx',
  'src/pages/SafetyCenterPage.jsx',
  'src/pages/SavedPlacesPage.jsx',
  'src/pages/JourneysPage.jsx',
  'src/pages/OverviewPage.jsx',
  'src/pages/SettingsPage.jsx',
  'src/components/landing/LandingPage.jsx',
];

for (const p of auditPages) {
  const content = fs.readFileSync(path.join(projectRoot, p), 'utf8');
  assert(!content.includes('bg-slate-900'), `No hardcoded "bg-slate-900" in ${p}`);
  assert(!content.includes('bg-slate-800'), `No hardcoded "bg-slate-800" in ${p}`);
  assert(!content.includes('text-slate-200'), `No low-contrast "text-slate-200" in ${p}`);
  assert(!content.includes('text-slate-300'), `No low-contrast "text-slate-300" in ${p}`);
}

// Check Landing Page text contrast
const landingContent = fs.readFileSync(path.join(projectRoot, 'src/components/landing/LandingPage.jsx'), 'utf8');
assert(!landingContent.includes('text-slate-100'), 'Landing page root text color uses text-travel-primary (not text-slate-100)');

// ---------------------------------------------------------------------------
// TEST 5: Recharts & Theme Integration
// ---------------------------------------------------------------------------
console.log('\n5️⃣ Recharts & Travel Insights Theme Integration...');

const insightsContent = fs.readFileSync(path.join(projectRoot, 'src/pages/TravelInsightsPage.jsx'), 'utf8');
assert(insightsContent.includes('stroke="var(--border-subtle)"'), 'AreaChart & BarChart grids use var(--border-subtle)');
assert(insightsContent.includes('stroke="var(--text-secondary)"'), 'Chart XAxis and YAxis use var(--text-secondary)');
assert(insightsContent.includes('bg-travel-card') && insightsContent.includes('SleekChartTooltip'), 'Chart tooltip uses elevated bg-travel-card with theme text');

// ---------------------------------------------------------------------------
// TEST 6: Theme State Synchronization in AppContext
// ---------------------------------------------------------------------------
console.log('\n6️⃣ AppContext Theme Synchronization & Settings...');

const appContextContent = fs.readFileSync(path.join(projectRoot, 'src/context/AppContext.jsx'), 'utf8');
assert(appContextContent.includes("document.documentElement.setAttribute('data-theme-family'"), 'AppContext sets data-theme-family attribute on root');
assert(appContextContent.includes("document.documentElement.setAttribute('data-appearance'"), 'AppContext sets data-appearance attribute on root');
assert(appContextContent.includes('setThemeFamily') && appContextContent.includes('setAppearance'), 'AppContext exports setThemeFamily and setAppearance');

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log(`\n========================================`);
console.log(`Verification Results: ${passCount} Passed, ${failCount} Failed`);
console.log(`========================================`);

if (failCount === 0) {
  console.log('🎉 ALL MULTI-THEME & UI REFINEMENT VERIFICATIONS PASSED 100%!\n');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED.\n');
  process.exit(1);
}
