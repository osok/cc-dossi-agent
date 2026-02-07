import type { AgentData, ProjectData } from '@agent-dossier/parser';

/**
 * Puppeteer-based PDF generation service.
 * Renders dossier HTML in headless Chromium for pixel-perfect PDF output.
 *
 * Satisfies: FR-PDF-001 to FR-PDF-006, ADR-012
 *
 * Note: Puppeteer is imported dynamically to avoid loading Chromium
 * when PDF generation is not needed.
 */
export class PdfGenerator {
  /**
   * Generate a PDF for a single agent dossier.
   */
  async generateDossierPdf(agent: AgentData, project: ProjectData): Promise<Buffer> {
    const html = this.buildDossierHtml(agent, project);
    return this.renderPdf(html);
  }

  /**
   * Generate a multi-page PDF containing all specified agent dossiers.
   */
  async generateAllDossiersPdf(
    agents: AgentData[],
    project: ProjectData,
    includeCover = true
  ): Promise<Buffer> {
    let html = '';

    if (includeCover) {
      html += this.buildCoverPageHtml(project, agents.length);
    }

    for (const agent of agents) {
      html += this.buildDossierHtml(agent, project);
    }

    return this.renderPdf(this.wrapInDocument(html));
  }

  /**
   * Build HTML for a single dossier page.
   * Includes inline CSS for Mission Briefing aesthetic.
   */
  private buildDossierHtml(agent: AgentData, _project: ProjectData): string {
    const codename = agent.enrichment?.codename || '';
    const traits = agent.enrichment?.personality_traits?.join(', ') || '';
    const briefing = agent.enrichment?.mission_briefing || '';
    const tools = agent.frontmatter.tools.map(t => `<span class="badge">${this.escapeHtml(t)}</span>`).join(' ');

    return `
      <div class="dossier-page" style="page-break-before: always;">
        <div class="classified-stamp">CLASSIFIED - AGENT DOSSIER</div>
        <div class="dossier-header">
          <h1 class="agent-name">${this.escapeHtml(agent.frontmatter.name)}</h1>
          ${codename ? `<div class="codename">${this.escapeHtml(codename)}</div>` : ''}
          <p class="description">${this.escapeHtml(agent.frontmatter.description)}</p>
          <div class="tools">${tools}</div>
          ${agent.frontmatter.model ? `<span class="badge model-badge">${this.escapeHtml(agent.frontmatter.model)}</span>` : ''}
        </div>
        ${traits ? `<div class="traits">Traits: ${this.escapeHtml(traits)}</div>` : ''}
        ${briefing ? `<div class="briefing"><h3>Mission Briefing</h3><p>${this.escapeHtml(briefing)}</p></div>` : ''}
        ${this.renderSections(agent)}
      </div>
    `;
  }

  /**
   * Build HTML for the cover page.
   */
  private buildCoverPageHtml(project: ProjectData, agentCount: number): string {
    return `
      <div class="cover-page">
        <div class="classified-stamp">CLASSIFIED</div>
        <h1>${this.escapeHtml(project.name)}</h1>
        <p>Agent Dossier Collection</p>
        <p>${agentCount} Agent${agentCount === 1 ? '' : 's'}</p>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
      </div>
    `;
  }

  /**
   * Render dossier sections as HTML.
   */
  private renderSections(agent: AgentData): string {
    const sections: string[] = [];
    const sectionOrder = [
      ['behavior', 'Behavior'],
      ['key_decisions', 'Key Decision Areas'],
      ['constraints', 'Constraints'],
      ['inputs', 'Inputs'],
      ['outputs', 'Outputs'],
      ['success_criteria', 'Success Criteria'],
    ] as const;

    for (const [key, label] of sectionOrder) {
      const section = agent.mapped_sections[key];
      if (section) {
        sections.push(`
          <div class="section">
            <h3>${label}</h3>
            <div class="section-content">${this.escapeHtml(section.content)}</div>
          </div>
        `);
      }
    }

    return sections.join('\n');
  }

  /**
   * Wrap HTML content in a full document with Mission Briefing styles.
   */
  private wrapInDocument(bodyContent: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Special+Elite&display=swap');

    body {
      font-family: Georgia, serif;
      background: #D4C5A9;
      color: #1A1A1A;
      margin: 0;
      padding: 20px;
    }
    .dossier-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      position: relative;
    }
    .cover-page {
      text-align: center;
      padding: 200px 40px;
      page-break-after: always;
    }
    .classified-stamp {
      font-family: 'Special Elite', monospace;
      color: #8B0000;
      opacity: 0.65;
      font-size: 24px;
      transform: rotate(-5deg);
      text-align: center;
      letter-spacing: 0.15em;
      margin-bottom: 20px;
    }
    .agent-name {
      font-family: 'Special Elite', monospace;
      font-size: 28px;
      margin: 0;
    }
    .codename {
      font-family: 'Special Elite', monospace;
      color: #8B0000;
      font-size: 18px;
      margin: 5px 0;
    }
    .description { margin: 10px 0; font-style: italic; }
    .badge {
      display: inline-block;
      background: #B8A88E;
      border: 1px solid #A89878;
      padding: 2px 8px;
      border-radius: 3px;
      font-family: 'Fira Code', monospace;
      font-size: 12px;
      margin: 2px;
    }
    .section { margin-top: 20px; }
    .section h3 {
      font-family: 'Special Elite', monospace;
      text-decoration: underline;
      border-top: 1px dashed #A89878;
      padding-top: 10px;
    }
    .section-content { white-space: pre-wrap; }
    .traits { font-style: italic; color: #3A3A3A; margin: 10px 0; }
    .briefing { margin: 15px 0; padding: 10px; background: rgba(0,0,0,0.03); }
  </style>
</head>
<body>${bodyContent}</body>
</html>`;
  }

  /**
   * Render HTML to PDF using Puppeteer.
   */
  private async renderPdf(html: string): Promise<Buffer> {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(120_000); // 120s timeout for large projects
      page.setDefaultTimeout(120_000);
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Escape HTML to prevent XSS in generated PDF.
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
