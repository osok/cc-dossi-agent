import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import styles from './AgentNode.module.css';

interface AgentNodeData {
  label: string;
  codename?: string;
  portraitUrl?: string;
  phase?: string;
}

/**
 * Custom React Flow node rendering agent portrait thumbnail + name.
 * Satisfies: FR-REL-003 (interactive nodes), FR-REL-009 (click navigation)
 */
export default function AgentNode({ data }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData;

  return (
    <div className={styles.agentNode}>
      <Handle type="target" position={Position.Left} className={styles.handle} />

      <div className={styles.portrait}>
        {nodeData.portraitUrl ? (
          <img
            src={nodeData.portraitUrl}
            alt={nodeData.label}
            className={styles.portraitImage}
          />
        ) : (
          <svg width="40" height="40" viewBox="0 0 80 80" fill="none" style={{ opacity: 0.3 }}>
            <circle cx="40" cy="28" r="16" fill="var(--color-ink-faded)" />
            <ellipse cx="40" cy="62" rx="24" ry="16" fill="var(--color-ink-faded)" />
          </svg>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.name}>{nodeData.label}</div>
        {nodeData.codename && (
          <div className={styles.codename}>{nodeData.codename}</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  );
}
