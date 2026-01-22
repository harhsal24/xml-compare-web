import { memo } from 'react';
import { getDiffStatus } from '../utils/xmlComparer';
import { findNodeByXPath } from '../utils/xmlParser';
import { TREE_VIEW_COLORS } from '../utils/colorConfig';
import useXmlStore from '../store/useXmlStore';

const VirtualTreeNode = memo(({
    node,
    style,
    depth,
    isExpanded,
    hasChildren,
    onToggle,
    side,
    data // react-window data prop if needed, or we can use hooks
}) => {
    const {
        diffResults,
        selectedXPath,
        setSelectedXPath,
        fontSize,
        leftTree,
        rightTree,
        showBorders,
        isDebugMode,
        treeViewStyle,
        showLeafDots,
        showStatusBadges
    } = useXmlStore();

    // Determine the 'other' tree for comparison
    const otherTree = side === 'left' ? rightTree : leftTree;
    const status = getDiffStatus(node.xpath, diffResults, side);

    // Get the counterpart node to check specific differences (attributes vs text)
    let textChanged = false;
    let attributesChanged = {}; // key -> boolean

    if (status === 'different' && otherTree) {
        const otherNode = findNodeByXPath(otherTree, node.xpath);
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
    const indentation = depth * (fontSize * 1.2);

    // DEBUG: Log sibling info for ALL nodes to diagnose
    console.log(`[TreeNode] ${node.tagName}: siblingIndex=${node.siblingIndex}, siblingTotal=${node.siblingTotal}, hasIndex=${node.siblingIndex !== undefined}, keys=${Object.keys(node).join(',')}`);

    // Get color class from config
    const isNoneStyle = treeViewStyle === 'none';
    const colorClass = isNoneStyle ? '' : (TREE_VIEW_COLORS.status[status] || TREE_VIEW_COLORS.status.neutral);


    // Format attributes for display
    const attrsDisplay = Object.entries(node.attributes).map(([key, value]) => {
        const isAttrDiff = attributesChanged[key];
        return { key, value, isAttrDiff };
    });

    return (
        <div style={style} className="font-mono">
            <div
                className={`
                    flex items-center gap-1 py-0.5 px-2 cursor-pointer
                    transition-all duration-150 relative h-full
                    ${showBorders ? 'border-b border-slate-100' : ''}
                    ${colorClass}
                    ${isSelected ? 'bg-blue-100/50 ring-1 ring-blue-500 z-10' : 'hover:bg-slate-100/50'}
                `}
                style={{ paddingLeft: `${indentation + 8}px`, fontSize: `${fontSize}px` }}
                onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                        e.stopPropagation();
                        if (node.textContent) {
                            navigator.clipboard.writeText(node.textContent);
                            console.log('Copied:', node.textContent);
                        }
                        return;
                    }
                    setSelectedXPath(node.xpath);
                }}
            >
                {/* Expand/Collapse toggle */}
                <div
                    className="w-5 h-5 flex items-center justify-center -ml-5 shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) onToggle(node.xpath);
                    }}
                >
                    {hasChildren ? (
                        <button className="text-slate-500 hover:text-slate-800 rounded">
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    ) : (
                        showLeafDots && <span className="text-slate-300">•</span>
                    )}
                </div>

                {/* Content Container */}
                <div className="flex items-center flex-wrap gap-x-1 overflow-hidden">
                    {/* Element tag with sibling index */}
                    <span className="text-blue-600 font-semibold text-nowrap">
                        &lt;{node.tagName}
                        {node.siblingTotal > 1 && (
                            <span className="text-yellow-600 text-xs font-normal ml-0.5">
                                {node.siblingIndex}/{node.siblingTotal}
                            </span>
                        )}
                    </span>

                    {/* Attributes */}
                    {attrsDisplay.length > 0 && (
                        <span className="flex gap-1 flex-wrap">
                            {attrsDisplay.map(({ key, value, isAttrDiff }) => {
                                const attrColors = isAttrDiff ? TREE_VIEW_COLORS.attribute.changed : TREE_VIEW_COLORS.attribute.normal;
                                return (
                                    <span key={key} className={`${attrColors.container} text-nowrap`}>
                                        <span className={attrColors.key}>{key}</span>
                                        <span className="text-slate-500">=</span>
                                        <span className={attrColors.value}>"{value}"</span>
                                    </span>
                                );
                            })}
                        </span>
                    )}

                    <span className="text-blue-600 font-semibold">&gt;</span>

                    {/* Text content */}
                    {node.textContent && (
                        <span className={`text-nowrap ${textChanged
                            ? TREE_VIEW_COLORS.textContent.changed
                            : TREE_VIEW_COLORS.textContent.normal
                            }`}>
                            {node.textContent}
                        </span>
                    )}

                    {/* Closing tag if no children or collapsed */}
                    {(!hasChildren || !isExpanded) && (
                        <span className="text-blue-600 font-semibold text-nowrap">&lt;/{node.tagName}&gt;</span>
                    )}
                </div>

                {/* Status badge - Hide in 'none' style unless specific need, or keep it? User said "like view only mode" so maybe hide diff colors but keep structure. Let's hide the badge in none mode for cleaner look. */}
                {status !== 'neutral' && diffResults && !isNoneStyle && showStatusBadges && (
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0 ${TREE_VIEW_COLORS.badge[status] || TREE_VIEW_COLORS.badge.missing
                        }`}>
                        {status}
                    </span>
                )}
            </div>
        </div>
    );
});

export default VirtualTreeNode;
