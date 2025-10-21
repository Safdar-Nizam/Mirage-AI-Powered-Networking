import { useEffect, useRef, useState, useCallback } from 'react';
import { Contact, Profile } from '../lib/supabase';

type NetworkGraphProps = {
  contacts: Contact[];
  profile: Profile | null;
  onContactClick: (contactId: string) => void;
  onAICatchup: (contactId: string) => void;
  selectedCategoryId?: string | null;
  randomSeed?: number;
};

type TreeNode = {
  id: string;
  contact: Contact | null;
  x: number;
  y: number;
  cardOffsetX: number;
  children: TreeNode[];
  layer: number;
  angle: number;
};

const CARD_WIDTH = 120;
const CARD_HEIGHT = 85;
const MIN_CARD_MARGIN = 24;
const MAX_CARD_OFFSET = 12;

const RING3_CENTER_RADIUS = 380;
const RING3_MIN_RADIUS = RING3_CENTER_RADIUS - 24;
const RING3_MAX_RADIUS = RING3_CENTER_RADIUS + 56;
const RING3_BASE_LINK = 60;
const RING3_MIN_ANGULAR_GAP = 6 * (Math.PI / 180);
const RING3_COLLISION_PADDING = 4;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getJitter(nodeId: string): number {
  const hash = hashString(nodeId);
  const normalized = (hash % 1000) / 1000;
  return -18 + (normalized * 42);
}

export default function NetworkGraph({ contacts, profile, onContactClick, onAICatchup, selectedCategoryId, randomSeed }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (selectedCategoryId && randomSeed) {
      const NUM_SECTORS = 12;
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      const sector1 = Math.floor(seededRandom(randomSeed) * NUM_SECTORS);
      let sector2 = Math.floor(seededRandom(randomSeed + 1) * NUM_SECTORS);

      while (sector2 === sector1 || Math.abs(sector2 - sector1) === 1 || Math.abs(sector2 - sector1) === NUM_SECTORS - 1) {
        sector2 = Math.floor(seededRandom(randomSeed + sector2 + 1) * NUM_SECTORS);
      }

      setSelectedBranches([sector1, sector2]);
    } else {
      setSelectedBranches(null);
    }
  }, [selectedCategoryId, randomSeed]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    setTransform({ x: centerX, y: centerY, k: 1 });
  }, [dimensions]);

  useEffect(() => {
    if (contacts.length === 0) {
      setTree(null);
      return;
    }

    const root: TreeNode = {
      id: 'root',
      contact: null,
      x: 0,
      y: 0,
      cardOffsetX: 0,
      children: [],
      layer: 0,
      angle: 0,
    };

    const layer1Contacts = contacts.filter(c => c.layer === 1);
    const layer2Contacts = contacts.filter(c => c.layer === 2);
    const layer3Contacts = contacts.filter(c => c.layer === 3);

    const radii = { 1: 140, 2: 260, 3: 380 };

    const minSeparation = { 1: 0.4, 2: 0.3, 3: 0.25 };

    layer1Contacts.forEach((contact, i) => {
      const totalNodes = layer1Contacts.length;
      const angleStep = (2 * Math.PI) / Math.max(totalNodes, 6);
      const effectiveStep = Math.max(angleStep, minSeparation[1]);
      const angle = i * effectiveStep;

      const node: TreeNode = {
        id: contact.id,
        contact,
        x: Math.cos(angle) * radii[1],
        y: Math.sin(angle) * radii[1],
        cardOffsetX: 0,
        children: [],
        layer: 1,
        angle,
      };
      root.children.push(node);
    });

    layer2Contacts.forEach((contact) => {
      const parentId = contact.parent_contact_id;
      let parentNode = root.children.find(n => n.id === parentId);

      if (!parentNode && root.children.length > 0) {
        parentNode = root.children[0];
      }

      if (parentNode) {
        const siblingIndex = parentNode.children.length;
        const totalSiblings = layer2Contacts.filter(c => c.parent_contact_id === parentNode!.id).length || 1;
        const spread = Math.min(0.6, minSeparation[2] * totalSiblings);
        const offset = (siblingIndex - (totalSiblings - 1) / 2) * (spread / Math.max(totalSiblings, 1));
        const angle = parentNode.angle + offset;

        const node: TreeNode = {
          id: contact.id,
          contact,
          x: Math.cos(angle) * radii[2],
          y: Math.sin(angle) * radii[2],
          cardOffsetX: 0,
          children: [],
          layer: 2,
          angle,
        };
        parentNode.children.push(node);
      }
    });

    const ring3Nodes: TreeNode[] = [];

    layer3Contacts.forEach((contact) => {
      const parentId = contact.parent_contact_id;
      let parentNode: TreeNode | undefined;

      root.children.forEach(l1 => {
        const found = l1.children.find(n => n.id === parentId);
        if (found) parentNode = found;
      });

      if (!parentNode && root.children.length > 0 && root.children[0].children.length > 0) {
        parentNode = root.children[0].children[0];
      }

      if (parentNode) {
        const siblingIndex = parentNode.children.length;
        const totalSiblings = layer3Contacts.filter(c => c.parent_contact_id === parentNode!.id).length || 1;
        const spread = Math.min(0.5, minSeparation[3] * totalSiblings);
        const offset = (siblingIndex - (totalSiblings - 1) / 2) * (spread / Math.max(totalSiblings, 1));
        const angle = parentNode.angle + offset;

        const jitter = getJitter(contact.id);
        const linkDistance = RING3_BASE_LINK + jitter;
        const initialRadius = RING3_CENTER_RADIUS + (jitter * 0.5);
        const clampedRadius = Math.max(RING3_MIN_RADIUS, Math.min(RING3_MAX_RADIUS, initialRadius));

        const node: TreeNode = {
          id: contact.id,
          contact,
          x: Math.cos(angle) * clampedRadius,
          y: Math.sin(angle) * clampedRadius,
          cardOffsetX: 0,
          children: [],
          layer: 3,
          angle,
        };
        parentNode.children.push(node);
        ring3Nodes.push(node);
      }
    });

    resolveRing3Collisions(ring3Nodes);

    setTree(root);
  }, [contacts]);

  const resolveRing3Collisions = (ring3Nodes: TreeNode[]) => {
    const MAX_ITERATIONS = 50;
    const nodeRadius = 8 + RING3_COLLISION_PADDING;

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      let hasCollision = false;

      ring3Nodes.sort((a, b) => a.angle - b.angle);

      for (let i = 0; i < ring3Nodes.length; i++) {
        const nodeA = ring3Nodes[i];

        for (let j = i + 1; j < ring3Nodes.length; j++) {
          const nodeB = ring3Nodes[j];

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = nodeRadius * 2 + 2;

          if (distance < minDistance) {
            hasCollision = true;
            const overlap = minDistance - distance;
            const angle = Math.atan2(dy, dx);

            const pushX = Math.cos(angle) * overlap * 0.5;
            const pushY = Math.sin(angle) * overlap * 0.5;

            nodeA.x -= pushX;
            nodeA.y -= pushY;
            nodeB.x += pushX;
            nodeB.y += pushY;

            const radiusA = Math.sqrt(nodeA.x * nodeA.x + nodeA.y * nodeA.y);
            const radiusB = Math.sqrt(nodeB.x * nodeB.x + nodeB.y * nodeB.y);
            const clampedRadiusA = Math.max(RING3_MIN_RADIUS, Math.min(RING3_MAX_RADIUS, radiusA));
            const clampedRadiusB = Math.max(RING3_MIN_RADIUS, Math.min(RING3_MAX_RADIUS, radiusB));

            const angleA = Math.atan2(nodeA.y, nodeA.x);
            const angleB = Math.atan2(nodeB.y, nodeB.x);

            nodeA.x = Math.cos(angleA) * clampedRadiusA;
            nodeA.y = Math.sin(angleA) * clampedRadiusA;
            nodeA.angle = angleA;

            nodeB.x = Math.cos(angleB) * clampedRadiusB;
            nodeB.y = Math.sin(angleB) * clampedRadiusB;
            nodeB.angle = angleB;
          }
        }
      }

      for (let i = 0; i < ring3Nodes.length - 1; i++) {
        const nodeA = ring3Nodes[i];
        const nodeB = ring3Nodes[i + 1];

        let angleDiff = nodeB.angle - nodeA.angle;
        if (angleDiff < 0) angleDiff += 2 * Math.PI;

        if (angleDiff < RING3_MIN_ANGULAR_GAP) {
          hasCollision = true;
          const adjustment = (RING3_MIN_ANGULAR_GAP - angleDiff) * 0.5;

          const radiusA = Math.sqrt(nodeA.x * nodeA.x + nodeA.y * nodeA.y);
          const radiusB = Math.sqrt(nodeB.x * nodeB.x + nodeB.y * nodeB.y);

          const newAngleA = nodeA.angle - adjustment;
          const newAngleB = nodeB.angle + adjustment;

          nodeA.x = Math.cos(newAngleA) * radiusA;
          nodeA.y = Math.sin(newAngleA) * radiusA;
          nodeA.angle = newAngleA;

          nodeB.x = Math.cos(newAngleB) * radiusB;
          nodeB.y = Math.sin(newAngleB) * radiusB;
          nodeB.angle = newAngleB;
        }
      }

      if (!hasCollision) break;
    }

    ring3Nodes.forEach(node => {
      const radius = Math.sqrt(node.x * node.x + node.y * node.y);
      const targetRadius = RING3_CENTER_RADIUS * 0.3 + radius * 0.7;
      const clampedRadius = Math.max(RING3_MIN_RADIUS, Math.min(RING3_MAX_RADIUS, targetRadius));
      const angle = Math.atan2(node.y, node.x);

      node.x = Math.cos(angle) * clampedRadius;
      node.y = Math.sin(angle) * clampedRadius;
      node.angle = angle;
    });
  };

  useEffect(() => {
    return () => {};
  }, [contacts]);

  const isNodeInSelectedBranches = useCallback((node: TreeNode) => {
    if (!selectedBranches || !selectedCategoryId) return true;

    const NUM_SECTORS = 12;
    const sectorAngle = (2 * Math.PI) / NUM_SECTORS;
    let angle = node.angle;
    if (angle < 0) angle += 2 * Math.PI;

    const nodeSector = Math.floor(angle / sectorAngle);
    return nodeSector === selectedBranches[0] || nodeSector === selectedBranches[1];
  }, [selectedBranches, selectedCategoryId]);

  const resolveCardCollisions = useCallback((nodes: TreeNode[], zoom: number) => {
    if (zoom < 1.2) return nodes;

    const nodesWithCards = nodes.map(node => ({ ...node, cardOffsetX: 0 }));
    const cardWidthAtZoom = CARD_WIDTH * zoom;
    const minMarginAtZoom = MIN_CARD_MARGIN * zoom;

    for (let i = 0; i < nodesWithCards.length; i++) {
      for (let j = i + 1; j < nodesWithCards.length; j++) {
        const nodeA = nodesWithCards[i];
        const nodeB = nodesWithCards[j];

        if (nodeA.layer !== nodeB.layer) continue;

        const dx = (nodeB.x + nodeB.cardOffsetX) - (nodeA.x + nodeA.cardOffsetX);
        const dy = nodeB.y - nodeA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const minDist = (cardWidthAtZoom + minMarginAtZoom) / zoom;

        if (dist < minDist) {
          const overlap = minDist - dist;
          const angle = Math.atan2(dy, dx);
          const tangentAngle = angle + Math.PI / 2;

          const pushX = Math.cos(tangentAngle) * overlap * 0.5;

          nodeA.cardOffsetX = Math.max(-MAX_CARD_OFFSET, Math.min(MAX_CARD_OFFSET, nodeA.cardOffsetX - pushX));
          nodeB.cardOffsetX = Math.max(-MAX_CARD_OFFSET, Math.min(MAX_CARD_OFFSET, nodeB.cardOffsetX + pushX));
        }
      }
    }

    return nodesWithCards;
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.5, transform.k + delta), 4);
    setTransform(prev => ({ ...prev, k: newScale }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'svg' || target.tagName === 'g' || target.classList.contains('graph-background')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const collectAllNodes = (node: TreeNode): TreeNode[] => {
    const nodes: TreeNode[] = [];
    node.children.forEach(child => {
      nodes.push(child);
      child.children.forEach(grandchild => {
        nodes.push(grandchild);
        grandchild.children.forEach(greatGrandchild => {
          nodes.push(greatGrandchild);
        });
      });
    });
    return nodes;
  };

  const shouldShowCard = (node: TreeNode): boolean => {
    if (transform.k < 1.2) return false;

    const nodesInLayer = tree ? collectAllNodes(tree).filter(n => n.layer === node.layer) : [];
    const circumference = 2 * Math.PI * (node.layer === 1 ? 140 : node.layer === 2 ? 260 : 380);
    const cardSpaceNeeded = (CARD_WIDTH + MIN_CARD_MARGIN) * nodesInLayer.length;

    if (cardSpaceNeeded > circumference * transform.k * 0.8) {
      return hoveredNode === node.id;
    }

    return true;
  };

  const renderNode = (node: TreeNode, adjustedNode?: TreeNode) => {
    if (!node.contact) return null;

    const finalNode = adjustedNode || node;
    const nodeSize = node.layer === 1 ? 16 : node.layer === 2 ? 12 : 8;
    const nodeColor = node.layer === 1 ? '#008080' : node.layer === 2 ? '#FF7A00' : '#98A2B3';
    const showCard = shouldShowCard(node);
    const inSelectedBranch = isNodeInSelectedBranches(node);
    const nodeOpacity = inSelectedBranch ? 1 : 0.25;

    const initials = node.contact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const cardScale = Math.min(1, 1 / transform.k);

    return (
      <g key={node.id} opacity={nodeOpacity}>
        <defs>
          <clipPath id={`clip-${node.id}`}>
            <circle cx={finalNode.x + finalNode.cardOffsetX} cy={finalNode.y} r={nodeSize} />
          </clipPath>
        </defs>
        {node.contact.photo_url ? (
          <>
            <image
              href={node.contact.photo_url}
              x={finalNode.x + finalNode.cardOffsetX - nodeSize}
              y={finalNode.y - nodeSize}
              width={nodeSize * 2}
              height={nodeSize * 2}
              clipPath={`url(#clip-${node.id})`}
              style={{ cursor: 'pointer' }}
              onClick={() => onContactClick(node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            />
            <circle
              cx={finalNode.x + finalNode.cardOffsetX}
              cy={finalNode.y}
              r={nodeSize}
              fill="none"
              stroke={nodeColor}
              strokeWidth={2}
              style={{ cursor: 'pointer' }}
              onClick={() => onContactClick(node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              tabIndex={0}
              role="button"
              aria-label={`Open messages with ${node.contact?.name} (Layer ${node.layer})`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onContactClick(node.id);
                }
              }}
            />
          </>
        ) : (
          <circle
            cx={finalNode.x + finalNode.cardOffsetX}
            cy={finalNode.y}
            r={nodeSize}
            fill={nodeColor}
            stroke={nodeColor === '#FF7A00' ? '#E66E00' : undefined}
            strokeWidth={nodeColor === '#FF7A00' ? 1.5 : 0}
            style={{
              filter: nodeColor === '#FF7A00' ? 'drop-shadow(0 0 4px rgba(255, 122, 0, 0.4))' : undefined,
              cursor: 'pointer',
            }}
            onClick={() => onContactClick(node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            tabIndex={0}
            role="button"
            aria-label={`Open messages with ${node.contact?.name} (Layer ${node.layer})`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onContactClick(node.id);
              }
            }}
          />
        )}
        {showCard && (
          <g transform={`translate(${finalNode.x + finalNode.cardOffsetX}, ${finalNode.y - nodeSize - 10}) scale(${cardScale})`}>
            <foreignObject
              x={-60}
              y={-75}
              width={120}
              height={70}
              style={{ overflow: 'visible', pointerEvents: 'auto' }}
            >
              <div
                className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 text-center"
                style={{ transformOrigin: 'center' }}
              >
                <div className="text-xs font-semibold text-gray-900 truncate mb-0.5">
                  {node.contact.name}
                </div>
                {node.contact.profession && (
                  <div className="text-[10px] text-gray-600 truncate mb-2">
                    {node.contact.profession}
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAICatchup(node.id);
                  }}
                  className="text-[10px] px-2 py-1 bg-[#FF7A00] text-white rounded hover:bg-[#E66E00] transition-colors"
                  aria-label={`Generate AI catch-up for ${node.contact.name}`}
                  tabIndex={0}
                >
                  AI Catch-up
                </button>
              </div>
            </foreignObject>
          </g>
        )}
      </g>
    );
  };

  const renderLinks = (node: TreeNode) => {
    const links: JSX.Element[] = [];

    node.children.forEach(child => {
      links.push(
        <line
          key={`${node.id}-${child.id}`}
          x1={node.x}
          y1={node.y}
          x2={child.x}
          y2={child.y}
          stroke="#D1D5DB"
          strokeWidth={1}
          opacity={0.4}
        />
      );
      links.push(...renderLinks(child));
    });

    return links;
  };

  const renderTree = (node: TreeNode) => {
    const allNodes = collectAllNodes(node);
    const adjustedNodes = resolveCardCollisions(allNodes, transform.k);

    return adjustedNodes.map(adjustedNode => {
      const originalNode = allNodes.find(n => n.id === adjustedNode.id)!;
      return renderNode(originalNode, adjustedNode);
    });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-50"
      style={{
        overflow: 'hidden',
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <rect
          className="graph-background"
          x={0}
          y={0}
          width={dimensions.width}
          height={dimensions.height}
          fill="transparent"
        />
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {tree && (
            <>
              {renderLinks(tree)}

              <circle
                cx={0}
                cy={0}
                r={10}
                fill="#006D6D"
                stroke="#004D4D"
                strokeWidth={2}
              />
              {profile && (
                <text
                  x={0}
                  y={20}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-gray-700"
                  style={{ fontSize: `${12 / transform.k}px` }}
                >
                  You
                </text>
              )}

              {renderTree(tree)}
            </>
          )}

          {contacts.length === 0 && (
            <text
              x={0}
              y={0}
              textAnchor="middle"
              className="text-sm fill-gray-500"
            >
              No contacts to display
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}
