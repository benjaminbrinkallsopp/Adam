"use client";

import { useEffect, useState, useCallback } from "react";

interface Person {
  id: string;
  firstName: string;
  lastName: string | null;
  birthDate: string | null;
  deathDate: string | null;
  gender: string | null;
}

interface Relationship {
  id: string;
  parentId: string;
  childId: string;
}

interface TreeNode {
  person: Person;
  children: TreeNode[];
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 70;
const H_GAP = 20;
const V_GAP = 80;

function buildTrees(people: Person[], relationships: Relationship[]): TreeNode[] {
  const childIds = new Set(relationships.map((r) => r.childId));
  const childrenMap = new Map<string, string[]>();

  for (const rel of relationships) {
    const existing = childrenMap.get(rel.parentId) || [];
    existing.push(rel.childId);
    childrenMap.set(rel.parentId, existing);
  }

  const personMap = new Map(people.map((p) => [p.id, p]));

  function buildNode(personId: string, visited: Set<string>): TreeNode | null {
    if (visited.has(personId)) return null;
    visited.add(personId);

    const person = personMap.get(personId);
    if (!person) return null;

    const childIds = childrenMap.get(personId) || [];
    const children: TreeNode[] = [];

    for (const childId of childIds) {
      const childNode = buildNode(childId, visited);
      if (childNode) children.push(childNode);
    }

    return { person, children };
  }

  // Root nodes = people who are not children of anyone
  const roots = people.filter((p) => !childIds.has(p.id));

  // Also include people with no relationships at all
  const relatedIds = new Set([
    ...relationships.map((r) => r.parentId),
    ...relationships.map((r) => r.childId),
  ]);

  const trees: TreeNode[] = [];
  const visited = new Set<string>();

  for (const root of roots) {
    const node = buildNode(root.id, visited);
    if (node) trees.push(node);
  }

  // Add unconnected people as standalone nodes
  for (const person of people) {
    if (!visited.has(person.id)) {
      trees.push({ person, children: [] });
    }
  }

  return trees;
}

function getSubtreeWidth(node: TreeNode): number {
  if (node.children.length === 0) return NODE_WIDTH;
  const childrenWidth = node.children.reduce(
    (sum, child) => sum + getSubtreeWidth(child) + H_GAP,
    -H_GAP
  );
  return Math.max(NODE_WIDTH, childrenWidth);
}

interface NodePosition {
  node: TreeNode;
  x: number;
  y: number;
}

function layoutTree(
  node: TreeNode,
  x: number,
  y: number,
  positions: NodePosition[]
): void {
  positions.push({ node, x, y });

  if (node.children.length === 0) return;

  const totalWidth = node.children.reduce(
    (sum, child) => sum + getSubtreeWidth(child) + H_GAP,
    -H_GAP
  );

  let currentX = x - totalWidth / 2;

  for (const child of node.children) {
    const childWidth = getSubtreeWidth(child);
    const childX = currentX + childWidth / 2;
    layoutTree(child, childX, y + NODE_HEIGHT + V_GAP, positions);
    currentX += childWidth + H_GAP;
  }
}

function PersonNode({ person, x, y }: { person: Person; x: number; y: number }) {
  const bgColor =
    person.gender === "male"
      ? "bg-blue-100 border-blue-300"
      : person.gender === "female"
        ? "bg-pink-100 border-pink-300"
        : "bg-gray-100 border-gray-300";

  return (
    <div
      className={`absolute border-2 rounded-lg p-2 text-center ${bgColor}`}
      style={{
        left: x - NODE_WIDTH / 2,
        top: y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      }}
    >
      <p className="font-medium text-sm truncate">
        {person.firstName} {person.lastName}
      </p>
      {person.birthDate && (
        <p className="text-xs text-gray-500 mt-1">{person.birthDate}</p>
      )}
    </div>
  );
}

export default function TreePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTree() {
      const res = await fetch("/api/tree");
      if (res.ok) {
        const data = await res.json();
        setPeople(data.people);
        setRelationships(data.relationships);
      }
      setLoading(false);
    }
    fetchTree();
  }, []);

  const renderTree = useCallback(() => {
    if (people.length === 0) {
      return (
        <p className="text-gray-500 text-center mt-12">
          Ingen personer i stamtræet endnu.
        </p>
      );
    }

    const trees = buildTrees(people, relationships);
    const allPositions: NodePosition[] = [];

    let offsetX = 0;
    for (const tree of trees) {
      const width = getSubtreeWidth(tree);
      layoutTree(tree, offsetX + width / 2 + 40, 40, allPositions);
      offsetX += width + H_GAP * 3;
    }

    // Calculate canvas size
    const maxX = Math.max(...allPositions.map((p) => p.x + NODE_WIDTH / 2)) + 40;
    const maxY = Math.max(...allPositions.map((p) => p.y + NODE_HEIGHT)) + 40;

    // Build lines from ALL relationships, not just tree structure
    const positionMap = new Map(allPositions.map((p) => [p.node.person.id, p]));
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (const rel of relationships) {
      const parentPos = positionMap.get(rel.parentId);
      const childPos = positionMap.get(rel.childId);
      if (parentPos && childPos) {
        lines.push({
          x1: parentPos.x,
          y1: parentPos.y + NODE_HEIGHT,
          x2: childPos.x,
          y2: childPos.y,
        });
      }
    }

    return (
      <div className="relative overflow-auto" style={{ minWidth: maxX, minHeight: maxY }}>
        <svg
          className="absolute inset-0"
          width={maxX}
          height={maxY}
          style={{ pointerEvents: "none" }}
        >
          {lines.map((line, i) => (
            <path
              key={i}
              d={`M ${line.x1} ${line.y1} C ${line.x1} ${line.y1 + V_GAP / 2}, ${line.x2} ${line.y2 - V_GAP / 2}, ${line.x2} ${line.y2}`}
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="2"
            />
          ))}
        </svg>
        {allPositions.map((pos) => (
          <PersonNode
            key={pos.node.person.id}
            person={pos.node.person}
            x={pos.x}
            y={pos.y}
          />
        ))}
      </div>
    );
  }, [people, relationships]);

  if (loading) {
    return <div className="p-8 text-center">Indlæser stamtræ...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Stamtræ</h1>
      <div className="bg-white rounded-lg shadow p-6 overflow-auto">
        {renderTree()}
      </div>
    </div>
  );
}
