/**
 * XmlTreeNode Component
 * Recursive tree node for XML visualization with diff highlighting
 */

import { useState, useEffect, useRef } from 'react';
import { getDiffStatus } from '../utils/xmlComparer';
import { findNodeByXPath } from '../utils/xmlParser';
import useXmlStore from '../store/useXmlStore';

export default function XmlTreeNode({ node, side, depth = 0 }) {
    const [expanded, setExpanded] = useState(true);
    const elementRef = useRef(null);
    const { diffResults, selectedXPath, setSelectedXPath, fontSize, leftTree, rightTree } = useXmlStore();

    // Determine the 'other' tree for comparison
    const otherTree = side === 'left' ? rightTree : leftTree;

    const hasChildren = node.children && node.children.length > 0;
    const status = getDiffStatus(node.xpath, diffResults, side);

    // Get the counterpart node to check specific differences (attributes vs text)
    let otherNode = null;
    let textChanged = false;
    let attributesChanged = {}; // key -> boolean (true if changed)

    if (status === 'different' && otherTree) {
        otherNode = findNodeByXPath(otherTree, node.xpath);

        if (otherNode) {
            // Check Text
            if (node.textContent !== otherNode.textContent) {
                textChanged = true;
            }
            // Check Attributes
            const allKeys = new Set([...Object.keys(node.attributes), ...Object.keys(otherNode.attributes)]);
            allKeys.forEach(key => {
                if (node.attributes[key] !== otherNode.attributes[key]) {
                    attributesChanged[key] = true;
                }
            });
        }
    }

    const isSelected = selectedXPath === node.xpath;

    // Auto-expand if this node is a parent of the selected node
    useEffect(() => {
        if (selectedXPath && selectedXPath.startsWith(node.xpath) && selectedXPath !== node.xpath) {
            setExpanded(true);
        }
    }, [selectedXPath, node.xpath]);

    // Scroll into view if selected
    useEffect(() => {
        if (isSelected && elementRef.current) {
            elementRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [isSelected]);

    // Color classes based on diff status - Softer, less saturated
    const statusColors = {
        matched: 'bg-green-100/80 border-green-400 text-green-800',
        extra: 'bg-amber-100/80 border-amber-400 text-amber-800',
        missing: 'bg-red-100/80 border-red-400 text-red-800',
        different: 'bg-purple-100/80 border-purple-400 text-purple-800',
        neutral: 'bg-slate-50 border-slate-300 text-slate-700',
    };

    const colorClass = statusColors[status] || statusColors.neutral;

    // Format attributes for display with highlighting
    const attrsDisplay = Object.entries(node.attributes).map(([key, value]) => {
        const isAttrDiff = attributesChanged[key];
        return { key, value, isAttrDiff };
    });

    return (
        <div className="font-mono" style={{ fontSize: `${fontSize}px` }}>
            <div
                ref={elementRef}
                className={`
          flex items-center gap-1 py-1 px-2 rounded-md border cursor-pointer
          transition-all duration-150 relative
          ${colorClass}
          ${isSelected ? 'ring-2 ring-blue-500 shadow-lg z-10 scale-[1.02]' : 'hover:shadow-md hover:scale-[1.01]'}
        `}
                style={{ marginLeft: `${depth * (fontSize * 1.2)}px` }}
                onClick={() => setSelectedXPath(node.xpath)}
            >
                {/* Expand/Collapse toggle */}
                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded"
                    >
                        {expanded ? '▼' : '▶'}
                    </button>
                ) : (
                    <span className="w-5 h-5 flex items-center justify-center text-slate-400">•</span>
                )}

                {/* Element tag */}
                <span className="text-blue-600 font-semibold">&lt;{node.tagName}</span>

                {/* Attributes - with individual highlighting */}
                {attrsDisplay.length > 0 && (
                    <span className="ml-1">
                        {attrsDisplay.map(({ key, value, isAttrDiff }) => (
                            <span
                                key={key}
                                className={isAttrDiff
                                    ? 'bg-orange-100 border border-orange-400/70 rounded px-1 mx-0.5'
                                    : ''}
                            >
                                <span className={isAttrDiff ? 'text-orange-900 font-bold' : 'text-purple-600'}>
                                    {key}
                                </span>
                                <span className="text-slate-500">=</span>
                                <span className={isAttrDiff ? 'text-orange-800 font-semibold' : 'text-purple-600'}>
                                    "{value}"
                                </span>
                            </span>
                        ))}
                    </span>
                )}

                <span className="text-blue-600 font-semibold">&gt;</span>

                {/* Text content (if leaf node or has direct text) - Subtle cyan theme */}
                {node.textContent && !hasChildren && (
                    <span className={`ml-1 truncate max-w-xs ${textChanged
                        ? 'bg-cyan-100 text-cyan-800 border border-cyan-400/70 px-1.5 py-0.5 rounded'
                        : 'text-gray-700'
                        }`}>
                        {node.textContent}
                    </span>
                )}

                {/* Closing tag for leaf nodes */}
                {!hasChildren && (
                    <span className="text-blue-600 font-semibold">&lt;/{node.tagName}&gt;</span>
                )}

                {/* Status badge */}
                {status !== 'neutral' && diffResults && (
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${status === 'matched' ? 'bg-green-500 text-white' :
                        status === 'extra' ? 'bg-amber-500 text-white' :
                            status === 'different' ? 'bg-purple-500 text-white' :
                                'bg-red-500 text-white'
                        }`}>
                        {status}
                    </span>
                )}
            </div>

            {/* Children */}
            {hasChildren && expanded && (
                <div className="ml-2 border-l-2 border-slate-200/50">
                    {node.children.map((child, index) => (
                        <XmlTreeNode
                            key={child.xpath + index}
                            node={child}
                            side={side}
                            depth={depth + 1}
                        />
                    ))}
                    {/* Closing tag */}
                    <div
                        className="text-blue-600 font-mono py-0.5 px-2 opacity-50"
                        style={{ marginLeft: `${(depth + 1) * (fontSize * 1.2)}px`, fontSize: `${fontSize}px` }}
                    >
                        &lt;/{node.tagName}&gt;
                    </div>
                </div>
            )}
        </div>
    );
}
