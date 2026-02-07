import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { AgentStats, EnrichmentData } from '@agent-dossier/parser';
import styles from './StatCard.module.css';

// Register Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

interface StatCardProps {
  stats: AgentStats;
  enrichment?: EnrichmentData | null;
}

const STAT_LABELS = ['Scope', 'Autonomy', 'Connections', 'Rigor', 'Complexity'];

/**
 * Radar chart displaying agent RPG stat card.
 * Satisfies: FR-STAT-001 to FR-STAT-006, ADR-011
 */
export default function StatCard({ stats, enrichment }: StatCardProps) {
  const data = {
    labels: STAT_LABELS,
    datasets: [
      {
        label: 'Agent Stats',
        data: [
          stats.scope,
          stats.autonomy,
          stats.connections,
          stats.rigor,
          stats.complexity,
        ],
        backgroundColor: 'var(--color-stat-fill)',
        borderColor: 'var(--color-stat-border)',
        borderWidth: 2,
        pointBackgroundColor: 'var(--color-stat-border)',
        pointBorderColor: 'var(--color-stat-border)',
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          display: false,
        },
        grid: {
          color: 'rgba(139, 115, 85, 0.3)',
        },
        angleLines: {
          color: 'rgba(139, 115, 85, 0.3)',
        },
        pointLabels: {
          font: {
            family: "'Special Elite', monospace",
            size: 10,
          },
          color: '#3A3A3A',
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: { dataIndex: number; raw: unknown }) => {
            const statKeys: (keyof AgentStats)[] = [
              'scope',
              'autonomy',
              'connections',
              'rigor',
              'complexity',
            ];
            const key = statKeys[context.dataIndex];
            const value = context.raw as number;
            const justification = enrichment?.stat_justifications?.[key];

            if (justification) {
              return `${STAT_LABELS[context.dataIndex]}: ${value}/10 - ${justification}`;
            }
            return `${STAT_LABELS[context.dataIndex]}: ${value}/10`;
          },
        },
      },
    },
  };

  const statKeys: (keyof AgentStats)[] = ['scope', 'autonomy', 'connections', 'rigor', 'complexity'];
  const hasJustifications = enrichment?.stat_justifications != null;

  return (
    <div className={styles.statCard}>
      <h3 className={styles.title}>Agent Stats</h3>
      <Radar data={data} options={options} />
      {hasJustifications && (
        <div className={styles.justifications}>
          {statKeys.map((key, i) => {
            const justification = enrichment?.stat_justifications?.[key];
            if (!justification) return null;
            return (
              <div key={key} className={styles.justificationRow} title={justification}>
                <span className={styles.justificationLabel}>{STAT_LABELS[i]}</span>
                <span className={styles.justificationValue}>{stats[key]}/10</span>
                <span className={styles.justificationText}>{justification}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
