import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { AgentData, AgentRelationship } from '@agent-dossier/parser';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getPortraitUrl } from '../../api/portraits';
import AgentNode from './AgentNode';
import styles from './RelationshipMap.module.css';

const nodeTypes = { agentNode: AgentNode };

const EDGE_COLORS: Record<string, string> = {
  invokes: '#4A6741',
  references: '#2E5090',
  reports_to: '#5B4A8A',
  reviews: '#8B4513',
  provides_to: '#8B6914',
};

interface RelationshipMapProps {
  agents: AgentData[];
  relationships: AgentRelationship[];
  projectId: string;
  savedPositions?: Record<string, { x: number; y: number }>;
}

/**
 * Interactive React Flow relationship graph.
 * Satisfies: FR-REL-001 to FR-REL-010, ADR-003
 */
export default function RelationshipMap({
  agents,
  relationships,
  projectId,
  savedPositions,
}: RelationshipMapProps) {
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const updateMapPositions = useProjectStore((s) => s.updateMapPositions);
  const selectedStyle = useSettingsStore((s) => s.selectedStyle);

  // Build initial nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 120 });

    // Create nodes
    const flowNodes: Node[] = agents.map((agent) => {
      const portraitUrl = agent.portraits[selectedStyle]
        ? getPortraitUrl(projectId, agent.frontmatter.name, selectedStyle)
        : undefined;

      const node: Node = {
        id: agent.frontmatter.name,
        type: 'agentNode',
        data: {
          label: agent.frontmatter.name,
          codename: agent.enrichment?.codename,
          portraitUrl,
          phase: agent.phase,
        },
        position: savedPositions?.[agent.frontmatter.name] ?? { x: 0, y: 0 },
      };

      g.setNode(agent.frontmatter.name, { width: 180, height: 60 });
      return node;
    });

    // Create edges
    const flowEdges: Edge[] = relationships.map((rel) => {
      g.setEdge(rel.source_agent, rel.target_agent);
      return {
        id: rel.id,
        source: rel.source_agent,
        target: rel.target_agent,
        label: rel.relationship_type,
        style: { stroke: EDGE_COLORS[rel.relationship_type] || '#888' },
        labelStyle: {
          fontFamily: "'Special Elite', monospace",
          fontSize: 10,
          fill: '#3A3A3A',
        },
        labelBgStyle: {
          fill: '#E8DCC8',
          fillOpacity: 0.8,
        },
        animated: rel.relationship_type === 'invokes',
      };
    });

    // Apply dagre layout if no saved positions
    if (!savedPositions || Object.keys(savedPositions).length === 0) {
      dagre.layout(g);
      flowNodes.forEach((node) => {
        const dagreNode = g.node(node.id);
        if (dagreNode) {
          node.position = {
            x: dagreNode.x - 90,
            y: dagreNode.y - 30,
          };
        }
      });
    }

    return { initialNodes: flowNodes, initialEdges: flowEdges };
  }, [agents, relationships, projectId, savedPositions, selectedStyle]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Handle node click -> navigate to dossier tab
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const agent = agents.find((a) => a.frontmatter.name === node.id);
      if (agent) {
        setActiveTab(agent.id);
      }
    },
    [agents, setActiveTab]
  );

  // Save positions on node drag end
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateMapPositions({ [node.id]: node.position });
    },
    [updateMapPositions]
  );

  return (
    <div className={styles.mapContainer}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={2}
      >
        <Background gap={20} color="var(--color-paper-edge)" />
        <Controls />
        <MiniMap
          nodeStrokeColor="var(--color-paper-edge)"
          nodeColor="var(--color-paper-light)"
          style={{ background: 'var(--color-paper-base)' }}
        />
      </ReactFlow>
    </div>
  );
}
