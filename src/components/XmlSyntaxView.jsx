/**
 * XmlSyntaxView Component
 * Renders XML as a code view but constructed from the parsed tree
 * to support detailed diff highlighting (Attributes, Text Content).
 */

import { useMemo } from 'react';
import useXmlStore from '../store/useXmlStore';
import { getDiffStatus } from '../utils/xmlComparer';
import { findNodeByXPath } from '../utils/xmlParser';
import { VIEW_ONLY_COLORS } from '../utils/colorConfig';

export default function XmlSyntaxView({ tree, side }) {
    const { diffResults, fontSize, leftTree, rightTree } = useXmlStore();

    // If no tree, fallback to empty
    if (!tree) return null;

    // Determine the 'other' tree for comparison
    const otherTree = side === 'left' ? rightTree : leftTree;

    return (
        <div className="flex-1 p-4 overflow-auto bg-slate-50 text-slate-800 font-mono" style={{ fontSize: `${fontSize}px` }}>
            <RecursiveNode
                node={tree}
                depth={0}
                side={side}
                diffResults={diffResults}
                fontSize={fontSize}
                otherTree={otherTree}
            />
        </div>
    );
}

function RecursiveNode({ node, depth, side, diffResults, fontSize, otherTree }) {
    // 1. Determine Diff Status for this node
    const status = getDiffStatus(node.xpath, diffResults, side);

    // 2. Determine Background Color from config
    const bgClass = VIEW_ONLY_COLORS.status[status] || VIEW_ONLY_COLORS.status.neutral;
    const borderClass = VIEW_ONLY_COLORS.border[status] || VIEW_ONLY_COLORS.border.neutral;

    const hasChildren = node.children && node.children.length > 0;

    // Indentation style
    const indent = depth * (fontSize * 1.5);

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

    // Attribute Rendering with highlighting from config
    const attributes = Object.entries(node.attributes).map(([key, value]) => {
        const isAttrDiff = attributesChanged[key];
        const attrColors = isAttrDiff ? VIEW_ONLY_COLORS.attribute.changed : VIEW_ONLY_COLORS.attribute.normal;

        return (
            <span key={key} className={attrColors.container}>
                {' '}
                <span className={attrColors.key}>{key}</span>
                <span className="text-slate-500">=</span>
                <span className={attrColors.value}>"{value}"</span>
            </span>
        );
    });

    return (
        <>
            {/* ... opening tag render ... */}
            {/* Wait, I need to replace the loop logic. Let's target the exact lines. */}
            {/* The previous replace was too broad. I will target the attribute map and return block. */}

            {/* Opening Tag Line */}
            <div className={`px-2 -mx-2 whitespace-pre ${bgClass} transition-colors duration-200 border-l-2 ${borderClass}`}>
                <span style={{ paddingLeft: `${indent}px` }}>
                    <span className="text-slate-400">&lt;</span>
                    <span className="text-blue-700 font-semibold">{node.tagName}</span>
                    {attributes}
                    <span className="text-slate-400">
                        {hasChildren ? '>' : (node.textContent ? '>' : ' />')}
                    </span>

                    {/* Inline Text Content (Leaf Node Value) */}
                    {!hasChildren && node.textContent && (
                        <span className={`font-medium ${textChanged
                            ? VIEW_ONLY_COLORS.textContent.changed
                            : VIEW_ONLY_COLORS.textContent.normal}`}>
                            {node.textContent}
                        </span>
                    )}

                    {/* Closing Tag (Inline if no children) */}
                    {!hasChildren && node.textContent && (
                        <span>
                            <span className="text-slate-400">&lt;/</span>
                            <span className="text-blue-700 font-semibold">{node.tagName}</span>
                            <span className="text-slate-400">&gt;</span>
                        </span>
                    )}
                </span>
            </div>

            {/* Children */}
            {hasChildren && node.children.map((child, index) => (
                <RecursiveNode
                    key={child.xpath || index}
                    node={child}
                    depth={depth + 1}
                    side={side}
                    diffResults={diffResults}
                    fontSize={fontSize}
                    otherTree={otherTree}
                />
            ))}

            {/* Closing Tag Line (Only if has children) */}
            {hasChildren && (
                <div className={`px-2 -mx-2 whitespace-pre ${bgClass} transition-colors duration-200 border-l-2 ${borderClass}`}>
                    <span style={{ paddingLeft: `${indent}px` }}>
                        <span className="text-slate-400">&lt;/</span>
                        <span className="text-blue-700 font-semibold">{node.tagName}</span>
                        <span className="text-slate-400">&gt;</span>
                    </span>
                </div>
            )}
        </>
    );
}
