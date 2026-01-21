/**
 * XmlSyntaxView Component
 * Renders XML as a code view but constructed from the parsed tree
 * to support detailed diff highlighting (Attributes, Text Content).
 */

import { useMemo } from 'react';
import useXmlStore from '../store/useXmlStore';
import { getDiffStatus } from '../utils/xmlComparer';
import { findNodeByXPath } from '../utils/xmlParser';

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

    // 2. Determine Background Color for the whole block - Softer, less saturated
    const bgClass = {
        matched: 'bg-green-100/60',
        extra: 'bg-amber-100/60', // Left Only / Right Only
        different: 'bg-purple-100/50', // Subtle purple base for diffs
        missing: 'bg-red-100/60',
        neutral: 'hover:bg-slate-50'
    }[status] || 'hover:bg-slate-50';

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

    // Attribute Rendering with highlighting - Orange theme with background + border
    const attributes = Object.entries(node.attributes).map(([key, value]) => {
        const isAttrDiff = attributesChanged[key];
        // If attribute changed, highlight with subtle orange background and border
        const attrClasses = isAttrDiff
            ? 'bg-orange-100 border border-orange-400/70 rounded px-1 mx-0.5'
            : '';

        return (
            <span key={key} className={attrClasses}>
                {' '}
                <span className={`${isAttrDiff ? 'text-orange-900 font-bold' : 'text-purple-600'}`}>{key}</span>
                <span className="text-slate-500">=</span>
                <span className={`${isAttrDiff ? 'text-orange-800 font-semibold' : 'text-green-600'}`}>"{value}"</span>
            </span>
        );
    });

    return (
        <>
            {/* ... opening tag render ... */}
            {/* Wait, I need to replace the loop logic. Let's target the exact lines. */}
            {/* The previous replace was too broad. I will target the attribute map and return block. */}

            {/* Opening Tag Line */}
            <div className={`px-2 -mx-2 whitespace-pre ${bgClass} transition-colors duration-200 border-l-2 ${status === 'matched' ? 'border-green-400' :
                status === 'extra' ? 'border-amber-400' :
                    status === 'different' ? 'border-purple-400' :
                        'border-transparent'
                }`}>
                <span style={{ paddingLeft: `${indent}px` }}>
                    <span className="text-slate-400">&lt;</span>
                    <span className="text-blue-700 font-semibold">{node.tagName}</span>
                    {attributes}
                    <span className="text-slate-400">
                        {hasChildren ? '>' : (node.textContent ? '>' : ' />')}
                    </span>

                    {/* Inline Text Content (Leaf Node Value) - Subtle cyan theme with background + border */}
                    {!hasChildren && node.textContent && (
                        <span className={`font-medium ${textChanged
                            ? 'bg-cyan-100 text-cyan-800 border border-cyan-400/70 px-1.5 py-0.5 rounded mx-1'
                            : 'text-slate-900'}`}>
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
                <div className={`px-2 -mx-2 whitespace-pre ${bgClass} transition-colors duration-200 border-l-2 ${status === 'matched' ? 'border-green-400' :
                    status === 'extra' ? 'border-amber-400' :
                        status === 'different' ? 'border-purple-400' :
                            'border-transparent'
                    }`}>
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
