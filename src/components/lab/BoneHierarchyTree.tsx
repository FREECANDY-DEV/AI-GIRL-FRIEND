import { useState } from 'react';
import { BONE_HIERARCHY, BoneNode } from '../../types/animation';
import {
  ChevronRight,
  ChevronDown,
  Filter,
  Shield,
  Hand,
  Footprints,
  Smile,
  Lock,
  Unlock,
  Layers,
} from 'lucide-react';

interface BoneHierarchyTreeProps {
  selectedBone: string;
  onSelectBone: (boneId: string) => void;
  lockedBones?: Set<string>;
  onToggleLockBone?: (boneId: string) => void;
}

const CATEGORY_ICONS = {
  torso: Shield,
  arm: Hand,
  leg: Footprints,
  head: Smile,
};

export function BoneHierarchyTree({
  selectedBone,
  onSelectBone,
  lockedBones = new Set(),
  onToggleLockBone,
}: BoneHierarchyTreeProps) {
  const [filterCategory, setFilterCategory] = useState<'all' | 'torso' | 'arm' | 'leg' | 'head'>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    Hips: true,
    Spine: true,
    Spine1: true,
    Spine2: true,
    LeftShoulder: true,
    RightShoulder: true,
    LeftUpLeg: true,
    RightUpLeg: true,
  });

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const filteredBones =
    filterCategory === 'all'
      ? BONE_HIERARCHY
      : BONE_HIERARCHY.filter((b) => b.category === filterCategory);

  const renderNode = (node: BoneNode, level: number = 0) => {
    const children = BONE_HIERARCHY.filter((b) => b.parent === node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isSelected = selectedBone === node.id;
    const isLocked = lockedBones.has(node.id);
    const CategoryIcon = CATEGORY_ICONS[node.category] || Shield;

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={() => onSelectBone(node.id)}
          style={{ paddingLeft: `${level * 10 + 4}px` }}
          className={`flex items-center justify-between py-1 px-1.5 rounded cursor-pointer text-[11px] transition ${
            isSelected
              ? 'bg-blue-600 text-white font-bold shadow-sm'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id);
                }}
                className="p-0.5 text-slate-400 hover:text-slate-200"
              >
                {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              </button>
            ) : (
              <span className="w-3 inline-block text-center text-slate-600 text-[10px]">•</span>
            )}

            <CategoryIcon
              size={12}
              className={
                node.category === 'arm'
                  ? 'text-amber-400'
                  : node.category === 'leg'
                  ? 'text-emerald-400'
                  : node.category === 'head'
                  ? 'text-purple-400'
                  : 'text-blue-400'
              }
            />
            <span className="truncate text-[10.5px]">{node.label}</span>
          </div>

          <div className="flex items-center gap-1">
            {onToggleLockBone && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLockBone(node.id);
                }}
                className={`p-0.5 rounded transition ${
                  isLocked ? 'text-red-400 bg-red-950/60' : 'text-slate-500 hover:text-slate-300'
                }`}
                title={isLocked ? 'Bone Locked' : 'Lock Bone'}
              >
                {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
              </button>
            )}

            <span
              className={`text-[8.5px] px-1 py-0.2 rounded font-mono uppercase ${
                node.category === 'arm'
                  ? 'bg-amber-500/20 text-amber-300'
                  : node.category === 'leg'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : node.category === 'head'
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {node.id}
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col border-l border-slate-800/80 ml-2 my-0.5">
            {children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootNodes = BONE_HIERARCHY.filter((b) => !b.parent);

  return (
    <div className="flex flex-col bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-xs">
      {/* Expandable/Collapsible Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between pb-1.5 cursor-pointer border-b border-slate-800/80 select-none"
      >
        <span className="font-bold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={13} className="text-blue-400" />
          Rig Anatomy
        </span>

        <div className="flex items-center gap-1">
          {/* Category Quick Filter */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded border border-slate-800 text-[9px]"
          >
            {(['all', 'torso', 'arm', 'leg', 'head'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-1 py-0.2 rounded capitalize transition ${
                  filterCategory === cat
                    ? 'bg-blue-500 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button className="text-slate-400 hover:text-slate-200 p-0.5">
            {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="max-h-40 overflow-y-auto pr-1 mt-1.5 flex flex-col gap-0.5 custom-scrollbar">
          {filterCategory === 'all'
            ? rootNodes.map((root) => renderNode(root))
            : filteredBones.map((b) => renderNode(b, 0))}
        </div>
      )}
    </div>
  );
}

