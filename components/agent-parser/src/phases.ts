import type { ParsedAgent, WorkflowPhase } from './types.js';

/**
 * Phase detection keywords per Appendix D.
 * Each phase has an array of regex patterns that signal that phase.
 */
const PHASE_KEYWORDS: Record<Exclude<WorkflowPhase, 'unassigned'>, RegExp[]> = {
  requirements: [
    /\brequirements?\b/i,
    /\bREQ-/,
    /\bstakeholder\b/i,
    /\bneeds\b/i,
    /acceptance criteria/i,
    /elicit/i,
  ],
  architecture: [
    /\barchitect\b/i,
    /\bADR\b/,
    /technology choice/i,
    /quality attributes/i,
    /phase:\s*"?architecture/i,
  ],
  design: [
    /\bdesign\b/i,
    /design-docs\//i,
    /phase:\s*"?design/i,
    /\btemplate\b/i,
    /\borchestrator\b/i,
  ],
  implementation: [
    /\bdeveloper\b/i,
    /\bcoder\b/i,
    /\bimplement/i,
    /phase:\s*"?(?:development|implementation)/i,
  ],
  review: [
    /\breview/i,
    /code-reviewer/i,
    /\bREVIEW_PASS\b/,
    /\bREVIEW_FAIL\b/,
    /phase:\s*"?review/i,
  ],
  testing: [
    /\btest\b/i,
    /test-coder/i,
    /\bcoverage\b/i,
    /phase:\s*"?testing/i,
    /test plan/i,
    /test runner/i,
  ],
  documentation: [
    /\bdocumentation\b/i,
    /\bdocs\b/i,
    /user-docs\//i,
    /developer-docs\//i,
    /phase:\s*"?documentation/i,
  ],
};

/**
 * Detect the workflow phase for a parsed agent.
 * Uses keyword frequency analysis and explicit phase declarations.
 *
 * @param parsed - Parsed agent data
 * @returns Detected workflow phase (or 'unassigned' if no clear match)
 *
 * Satisfies: FR-PIPE-003
 */
export function detectPhase(parsed: ParsedAgent): WorkflowPhase {
  const text = parsed.raw_markdown;
  const scores: Record<string, number> = {};

  for (const [phase, patterns] of Object.entries(PHASE_KEYWORDS)) {
    scores[phase] = 0;
    for (const pattern of patterns) {
      const matches = text.match(new RegExp(pattern.source, pattern.flags + 'g'));
      if (matches) {
        scores[phase] += matches.length;
      }
    }
  }

  // Boost score for explicit phase declaration in log entry output
  const phaseMatch = text.match(/["']phase["']\s*:\s*["'](\w+)["']/i);
  if (phaseMatch) {
    const declared = phaseMatch[1].toLowerCase();
    if (declared in scores) {
      scores[declared] += 20; // Strong signal
    }
    // Map "development" to "implementation"
    if (declared === 'development' && 'implementation' in scores) {
      scores['implementation'] += 20;
    }
  }

  // Also check agent name for phase hints
  const name = parsed.frontmatter.name.toLowerCase();
  if (name.includes('architect')) scores['architecture'] = (scores['architecture'] || 0) + 15;
  if (name.includes('design')) scores['design'] = (scores['design'] || 0) + 15;
  if (name.includes('developer')) scores['implementation'] = (scores['implementation'] || 0) + 15;
  if (name.includes('review')) scores['review'] = (scores['review'] || 0) + 15;
  if (name.includes('test')) scores['testing'] = (scores['testing'] || 0) + 15;
  if (name.includes('document')) scores['documentation'] = (scores['documentation'] || 0) + 15;
  if (name.includes('requirement')) scores['requirements'] = (scores['requirements'] || 0) + 15;

  // Find highest scoring phase
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length > 0 && sorted[0][1] > 0) {
    return sorted[0][0] as WorkflowPhase;
  }

  return 'unassigned';
}
