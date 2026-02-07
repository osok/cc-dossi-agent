import { useState, isValidElement } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import type { AgentData, ParsedSection } from '@agent-dossier/parser';
import styles from './DossierSections.module.css';

/**
 * Custom react-markdown components that render fenced code blocks
 * tagged as `markdown` or `md` as formatted markdown instead of raw code.
 */
const markdownComponents = {
  code({ className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match?.[1];

    if (lang === 'markdown' || lang === 'md') {
      return (
        <div className={styles.renderedMarkdown} data-md-rendered="">
          <Markdown remarkPlugins={[remarkGfm]}>
            {String(children).replace(/\n$/, '')}
          </Markdown>
        </div>
      );
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre({ children, ...props }: any) {
    const child = Array.isArray(children) ? children[0] : children;
    if (isValidElement(child) && (child.props as any)?.['data-md-rendered'] !== undefined) {
      return <>{children}</>;
    }
    return <pre {...props}>{children}</pre>;
  },
};

interface DossierSectionsProps {
  agent: AgentData;
}

const SECTION_ORDER: Array<{ key: string; label: string }> = [
  { key: 'behavior', label: 'Behavior' },
  { key: 'key_decisions', label: 'Key Decision Areas' },
  { key: 'constraints', label: 'Constraints' },
  { key: 'inputs', label: 'Inputs' },
  { key: 'outputs', label: 'Outputs' },
  { key: 'success_criteria', label: 'Success Criteria' },
  { key: 'memory_integration', label: 'Memory Integration' },
  { key: 'cross_references', label: 'Cross References' },
  { key: 'return_format', label: 'Return Format' },
  { key: 'console_output', label: 'Console Output' },
  { key: 'log_entry', label: 'Log Entry' },
];

/**
 * Collapsible section panels for dossier content.
 * Satisfies: FR-DOSSIER-009 to FR-DOSSIER-012 (section display)
 */
export default function DossierSections({ agent }: DossierSectionsProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Get sections in defined order, then any extra sections not in the order
  const orderedSections: Array<{ key: string; label: string; section: ParsedSection }> = [];

  for (const { key, label } of SECTION_ORDER) {
    const section = agent.mapped_sections[key];
    if (section) {
      orderedSections.push({ key, label, section });
    }
  }

  // Add any sections not in the predefined order
  for (const [key, section] of Object.entries(agent.mapped_sections)) {
    if (section && !SECTION_ORDER.some((s) => s.key === key)) {
      orderedSections.push({
        key,
        label: section.heading || key,
        section,
      });
    }
  }

  // Also show mission briefing if enriched
  const missionBriefing = agent.enrichment?.mission_briefing;

  const isEnriched = agent.enrichment !== null;

  return (
    <div className={styles.sections}>
      {missionBriefing && (
        <div className={styles.briefing}>
          <div className={styles.briefingHeader}>
            <h3 className={styles.sectionHeading}>Mission Briefing</h3>
            {isEnriched && (
              <span className={styles.aiEnhancedBadge} title="Content enhanced by AI enrichment">
                AI Enhanced
              </span>
            )}
          </div>
          <p className={styles.briefingText}>{missionBriefing}</p>
        </div>
      )}

      {/* Show AI Enhanced badge at top if enriched but no mission briefing */}
      {isEnriched && !missionBriefing && (
        <div className={styles.enrichedNotice}>
          <span className={styles.aiEnhancedBadge} title="Content enhanced by AI enrichment">
            AI Enhanced
          </span>
        </div>
      )}

      {orderedSections.map(({ key, label, section }) => (
        <div key={key} className={styles.section}>
          <button
            className={styles.sectionHeading}
            onClick={() => toggleSection(key)}
            aria-expanded={!collapsed[key]}
          >
            <span>{label}</span>
            <span className={styles.toggle}>{collapsed[key] ? '+' : '-'}</span>
          </button>
          {!collapsed[key] && (
            <div className={styles.sectionContent}>
              <div className={styles.markdownContent}>
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >{section.content}</Markdown>
              </div>
              {section.tables.length > 0 && section.tables.map((table, i) => (
                <table key={i} className={styles.table}>
                  <thead>
                    <tr>
                      {table.headers.map((h, j) => (
                        <th key={j}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td key={k}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
