/**
 * XmlTreeNode Component
 * Recursive tree node for XML visualization with diff highlighting
 */

import { useState, useEffect, useRef, memo } from 'react';
import { getDiffStatus } from '../utils/xmlComparer';
import { findNodeByXPath } from '../utils/xmlParser';
import { TREE_VIEW_COLORS } from '../utils/colorConfig';
import useXmlStore from '../store/useXmlStore';
import { useToast } from './Toast';

// Performance optimization: collapse nodes deeper than this level by default
const AUTO_COLLAPSE_DEPTH = 3;

const XmlTreeNode = memo(function XmlTreeNode({ node, side, depth = 0 }) {
    // Start collapsed if depth > AUTO_COLLAPSE_DEPTH to improve performance with large files
    const [expanded, setExpanded] = useState(depth < AUTO_COLLAPSE_DEPTH);
    const elementRef = useRef(null);
    const { addToast } = useToast();
    const {
        diffResults,
        selectedXPath,
        setSelectedXPath,
        fontSize,
        leftTree,
        rightTree,
        showBorders,
        showLeafDots,
        showStatusBadges,
        isDebugMode
    } = useXmlStore();

    if (isDebugMode) {
        console.log(`Rendering node: ${node.xpath}`, {
            depth, side, showBorders, showLeafDots, showStatusBadges
        });
    }

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
    const maxDepth = 50;
    const indentation = Math.min(depth, maxDepth) * (fontSize * 1.2);

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

    // VISUAL ALIGNMENT LOGIC
    // Merge children from both trees to insert placeholders where needed
    const mergedChildren = (() => {
        if (!hasChildren && (!otherNode || !otherNode.children || otherNode.children.length === 0)) {
            return [];
        }

        const L = node.children || [];
        const R = (otherNode && otherNode.children) ? otherNode.children : [];

        // Fast path: if one side is empty, just return the other (as real or placeholders)
        if (L.length === 0) return R.map(c => ({ ...c, isPlaceholder: true }));
        if (R.length === 0) return L;

        // Map for fast lookup of Right nodes
        const rMap = new Map(R.map((c, i) => [c.xpath, i]));

        const merged = [];
        let i = 0, j = 0;

        while (i < L.length || j < R.length) {
            const cL = L[i];
            const cR = R[j];

            if (!cL) { // End of L, append rest of R as placeholders
                merged.push({ ...cR, isPlaceholder: true });
                j++;
                continue;
            }
            if (!cR) { // End of R, append rest of L
                merged.push(cL);
                i++;
                continue;
            }

            if (cL.xpath === cR.xpath) {
                merged.push(cL);
                i++;
                j++;
            } else {
                // Mismatch
                // Check if cL exists later in R (meaning cR is an insertion before cL)
                // We check if cL index > j to ensure we haven't passed it
                const indexInR = rMap.get(cL.xpath);
                if (indexInR !== undefined && indexInR >= j) {
                    // cL matches something later in R, so cR must be a gap in L
                    merged.push({ ...cR, isPlaceholder: true });
                    j++;
                } else {
                    // cL does not exist in R (or was passed), so it is extra in L
                    merged.push(cL);
                    i++;
                }
            }
        }
        return merged;
    })();

    // Get color class from config
    const colorClass = node.isPlaceholder
        ? 'opacity-50 border border-dashed border-slate-300 bg-slate-50'
        : (TREE_VIEW_COLORS.status[status] || TREE_VIEW_COLORS.status.neutral);

    // Format attributes for display with highlighting
    const attrsDisplay = Object.entries(node.attributes).map(([key, value]) => {
        const isAttrDiff = attributesChanged[key];
        return { key, value, isAttrDiff };
    });

    return (
        <div className="font-mono min-w-fit" style={{ fontSize: `${fontSize}px` }}>
            <div
                ref={elementRef}
                className={`
          flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer
          transition-all duration-150 relative min-w-fit
          ${showBorders && !node.isPlaceholder ? 'border' : ''}
          ${colorClass}
          ${isSelected ? 'ring-2 ring-blue-500 shadow-lg z-10 scale-[1.02]' : 'hover:shadow-md hover:scale-[1.01]'}
        `}
                style={{ marginLeft: `${indentation}px` }}
                onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                        e.stopPropagation();
                        // Allows copying even if placeholder
                        if (node.textContent) {
                            navigator.clipboard.writeText(node.textContent);
                            addToast(`Copied: ${node.textContent}`);
                        }
                        return;
                    }
                    setSelectedXPath(node.xpath);
                }}
            >
                {/* Expand/Collapse toggle - Disable for placeholders if no children? 
                    Actually placeholders from the other tree MIGHT have children 
                    that are also placeholders (recursively).
                    Since we copy the node, hasChildren is roughly valid.
                */}
                {(hasChildren || (node.isPlaceholder && node.children && node.children.length > 0)) ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded"
                    >
                        {expanded ? '▼' : '▶'}
                    </button>
                ) : (
                    // Only show dot if showLeafDots is true
                    showLeafDots && <span className="w-5 h-5 flex items-center justify-center text-slate-400">•</span>
                )}

                <span className={`${node.isPlaceholder ? 'text-slate-500 italic' : 'text-blue-600 font-semibold'}`}>
                    &lt;{node.tagName}
                    {node.siblingTotal > 1 && (
                        <span className={`${node.isPlaceholder ? 'text-slate-400' : 'text-yellow-600'} text-xs font-normal ml-0.5`}>
                            {node.siblingIndex}/{node.siblingTotal}
                        </span>
                    )}
                </span>

                {/* Attributes - with individual highlighting */}
                {attrsDisplay.length > 0 && (
                    <span className="ml-1">
                        {attrsDisplay.map(({ key, value, isAttrDiff }) => {
                            const attrColors = isAttrDiff ? TREE_VIEW_COLORS.attribute.changed : TREE_VIEW_COLORS.attribute.normal;
                            return (
                                <span key={key} className={node.isPlaceholder ? 'opacity-70' : attrColors.container}>
                                    <span className={node.isPlaceholder ? 'text-slate-500' : attrColors.key}>{key}</span>
                                    <span className="text-slate-500">=</span>
                                    <span className={node.isPlaceholder ? 'text-slate-500' : attrColors.value}>"{value}"</span>
                                </span>
                            );
                        })}
                    </span>
                )}

                <span className={`${node.isPlaceholder ? 'text-slate-500' : 'text-blue-600 font-semibold'}`}>&gt;</span>

                {/* Text content (if leaf node or has direct text) */}
                {node.textContent && (
                    <span className={`ml-1 ${node.isPlaceholder
                        ? 'text-slate-400 italic'
                        : (textChanged ? TREE_VIEW_COLORS.textContent.changed : TREE_VIEW_COLORS.textContent.normal)
                        }`}>
                        {node.textContent}
                    </span>
                )}

                {/* Closing tag for leaf nodes */}
                {!hasChildren && !(node.isPlaceholder && node.children?.length) && (
                    <span className={`${node.isPlaceholder ? 'text-slate-500 italic' : 'text-blue-600 font-semibold'}`}>&lt;/{node.tagName}&gt;</span>
                )}
                {/* Closing tag for non-leaf nodes with text content */}
                {(hasChildren || (node.isPlaceholder && node.children?.length)) && node.textContent && (
                    <span className={`${node.isPlaceholder ? 'text-slate-500 italic' : 'text-blue-600 font-semibold'}`}>&lt;/{node.tagName}&gt;</span>
                )}

                {/* Status badge - SHOW 'MISSING' FOR PLACEHOLDERS */}
                {(status !== 'neutral' || node.isPlaceholder) && diffResults && showStatusBadges && (
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${node.isPlaceholder ? 'bg-slate-200 text-slate-500' : (TREE_VIEW_COLORS.badge[status] || TREE_VIEW_COLORS.badge.missing)
                        }`}>
                        {node.isPlaceholder ? 'MISSING' : status}
                    </span>
                )}
            </div>

            {/* Children - Use mergedChildren */}
            {((hasChildren || node.isPlaceholder) && expanded) && (
                // ALWAYS show the vertical line (border-l-2) regardless of showBorders, as requested
                <div className={`ml-2 border-l-2 border-slate-200/50 min-w-fit`}>
                    {mergedChildren.map((child, index) => (
                        <XmlTreeNode
                            key={child.xpath + index}
                            node={child}
                            side={side}
                            depth={depth + 1}
                        />
                    ))}
                    {/* Closing tag */}
                    <div
                        className={`${node.isPlaceholder ? 'text-slate-400 italic' : 'text-blue-600'} font-mono py-0.5 px-2 opacity-50`}
                        style={{ marginLeft: `${Math.min(depth + 1, maxDepth) * (fontSize * 1.2)}px`, fontSize: `${fontSize}px` }}
                    >
                        &lt;/{node.tagName}&gt;
                    </div>
                </div>
            )}
        </div>
    );
});

export default XmlTreeNode;
