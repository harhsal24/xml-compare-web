import { useState, useMemo, useEffect, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import VirtualTreeNode from './VirtualTreeNode';
import useXmlStore from '../store/useXmlStore';

export default function VirtualXmlTree({ side }) { // side: 'left' | 'right'
    const {
        leftTree,
        rightTree,
        selectedXPath,
        fontSize,
    } = useXmlStore();

    const rootNode = side === 'left' ? leftTree : rightTree;
    const [expandedPaths, setExpandedPaths] = useState(new Set());

    // Auto-expand root on load
    useEffect(() => {
        if (rootNode) {
            setExpandedPaths(prev => {
                const newSet = new Set(prev);
                newSet.add(rootNode.xpath);
                return newSet;
            });
        }
    }, [rootNode]);

    // Auto-expand selected path
    useEffect(() => {
        if (selectedXPath) {
            // We need to expand all parents of the selected node
            // Since we don't have a parent map easily, we can infer it if xpaths are hierarchical
            // e.g. /root/child/grandchild -> expand /root, /root/child
            const parts = selectedXPath.split('/');
            // parts: ["", "root", "child", "grandchild"]
            const pathsToExpand = new Set();
            let currentPath = '';

            // Skip first empty part and last part (the node itself, though expanding it is fine)
            for (let i = 1; i < parts.length - 1; i++) {
                currentPath += '/' + parts[i];
                pathsToExpand.add(currentPath);
            }

            if (pathsToExpand.size > 0) {
                setExpandedPaths(prev => {
                    const next = new Set(prev);
                    pathsToExpand.forEach(p => next.add(p));
                    return next;
                });
            }
        }
    }, [selectedXPath]);


    const toggleNode = useCallback((xpath) => {
        setExpandedPaths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(xpath)) {
                newSet.delete(xpath);
            } else {
                newSet.add(xpath);
            }
            return newSet;
        });
    }, []);

    // Flatten tree based on expanded state
    // Re-calculates whenever expandedPaths or rootNode changes
    const visibleNodes = useMemo(() => {
        if (!rootNode) return [];

        const nodes = [];

        const traverse = (node, depth) => {
            nodes.push({ ...node, depth, isExpanded: expandedPaths.has(node.xpath) });

            if (expandedPaths.has(node.xpath) && node.children) {
                node.children.forEach(child => traverse(child, depth + 1));
            }
        };

        traverse(rootNode, 0);
        return nodes;
    }, [rootNode, expandedPaths]);

    // Row renderer for react-window
    const Row = ({ index, style }) => {
        const item = visibleNodes[index];
        const hasChildren = item.children && item.children.length > 0;

        return (
            <VirtualTreeNode
                node={item}
                style={style}
                depth={item.depth}
                isExpanded={item.isExpanded}
                hasChildren={hasChildren}
                onToggle={toggleNode}
                side={side}
            />
        );
    };

    if (!rootNode) return <div className="p-4 text-slate-400">No XML loaded</div>;

    // Calculate item height based on font size + padding
    const itemSize = fontSize * 1.5 + 8; // Adjust as needed

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        height={height}
                        itemCount={visibleNodes.length}
                        itemSize={itemSize}
                        width={width}
                        itemData={visibleNodes} // Pass data to avoid stale closures if we used Row defined outside
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
}
