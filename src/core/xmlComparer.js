/**
 * ============================================================================
 * XML COMPARER - Core Library
 * ============================================================================
 * 
 * This module provides XML comparison functionality that identifies
 * differences between two parsed XML trees.
 * 
 * ARCHITECTURE NOTE:
 * This module is designed to be framework-agnostic and can be used in:
 * - React web applications
 * - Electron desktop applications
 * - Node.js CLI tools
 * - Any JavaScript/TypeScript environment
 * 
 * DEPENDENCIES:
 * - Requires xmlParser.js from this same core library
 * 
 * ============================================================================
 */

import { flattenTree, getAllXPaths } from './xmlParser.js';

// ============================================================================
// TYPE DEFINITIONS (JSDoc for IDE support)
// ============================================================================

/**
 * @typedef {Object} DiffStats
 * @property {number} totalLeft - Total elements in left tree
 * @property {number} totalRight - Total elements in right tree
 * @property {number} matched - Elements that exist in both and are identical
 * @property {number} leftOnly - Elements only in left tree
 * @property {number} rightOnly - Elements only in right tree
 * @property {number} different - Elements in both but with different content
 */

/**
 * @typedef {Object} DiffResults
 * @property {string[]} leftOnly - XPaths of elements only in left tree
 * @property {string[]} rightOnly - XPaths of elements only in right tree
 * @property {string[]} different - XPaths of elements with content differences
 * @property {string[]} matched - XPaths of identical elements
 * @property {DiffStats} stats - Summary statistics
 */

/**
 * Enum-like object for diff status values.
 * Use these constants instead of string literals for type safety.
 */
export const DiffStatus = {
    MATCHED: 'matched',
    EXTRA: 'extra',
    DIFFERENT: 'different',
    NEUTRAL: 'neutral',
};

// ============================================================================
// MAIN COMPARISON FUNCTION
// ============================================================================

/**
 * Compare two XML trees and return detailed diff results.
 * 
 * This is the main entry point for XML comparison. It:
 * 1. Extracts all XPaths from both trees
 * 2. Identifies elements unique to each tree
 * 3. Compares matching elements for content differences
 * 4. Returns comprehensive results with statistics
 * 
 * @param {XmlNode} leftTree - The left (source) tree to compare
 * @param {XmlNode} rightTree - The right (target) tree to compare
 * @returns {DiffResults} Detailed comparison results
 * 
 * @example
 * const left = parseXml('<root><a>1</a></root>');
 * const right = parseXml('<root><a>2</a></root>');
 * const diff = compareXml(left, right);
 * console.log(diff.different); // ['/root/a']
 */
export function compareXml(leftTree, rightTree) {
    // Step 1: Get all XPaths from both trees
    const leftPaths = getAllXPaths(leftTree);
    const rightPaths = getAllXPaths(rightTree);

    // Step 2: Create lookup maps for node data
    const leftMap = flattenTree(leftTree);
    const rightMap = flattenTree(rightTree);

    // Step 3: Find elements only in left tree
    const leftOnly = findUniqueElements(leftPaths, rightPaths);

    // Step 4: Find elements only in right tree
    const rightOnly = findUniqueElements(rightPaths, leftPaths);

    // Step 5: Find common elements and check for differences
    const { matched, different } = compareCommonElements(
        leftPaths,
        rightPaths,
        leftMap,
        rightMap
    );

    // Step 6: Calculate statistics
    const stats = calculateStats(leftPaths, rightPaths, matched, leftOnly, rightOnly, different);

    return {
        leftOnly: Array.from(leftOnly),
        rightOnly: Array.from(rightOnly),
        different: Array.from(different),
        matched: Array.from(matched),
        stats,
    };
}

// ============================================================================
// ELEMENT FINDING FUNCTIONS
// ============================================================================

/**
 * Find elements that exist in sourceSet but not in targetSet.
 * 
 * This performs a set difference operation: source - target.
 * 
 * @param {Set<string>} sourceSet - The set to find unique elements from
 * @param {Set<string>} targetSet - The set to check against
 * @returns {Set<string>} Elements in source but not in target
 */
function findUniqueElements(sourceSet, targetSet) {
    const unique = new Set();

    for (const path of sourceSet) {
        if (!targetSet.has(path)) {
            unique.add(path);
        }
    }

    return unique;
}

/**
 * Compare elements that exist in both trees.
 * 
 * For each element that exists in both trees (by XPath),
 * check if they have the same content and attributes.
 * 
 * @param {Set<string>} leftPaths - XPaths from left tree
 * @param {Set<string>} rightPaths - XPaths from right tree
 * @param {Map<string, XmlNode>} leftMap - XPath to node map for left tree
 * @param {Map<string, XmlNode>} rightMap - XPath to node map for right tree
 * @returns {{matched: Set<string>, different: Set<string>}} Sets of matched and different XPaths
 */
function compareCommonElements(leftPaths, rightPaths, leftMap, rightMap) {
    const matched = new Set();
    const different = new Set();

    for (const xpath of leftPaths) {
        // Skip if not in both trees
        if (!rightPaths.has(xpath)) {
            continue;
        }

        const leftNode = leftMap.get(xpath);
        const rightNode = rightMap.get(xpath);

        // Compare nodes for differences
        if (areNodesIdentical(leftNode, rightNode)) {
            matched.add(xpath);
        } else {
            different.add(xpath);
        }
    }

    return { matched, different };
}

// ============================================================================
// NODE COMPARISON FUNCTIONS
// ============================================================================

/**
 * Check if two nodes are identical in content and attributes.
 * 
 * Two nodes are considered identical if:
 * 1. They have the same text content
 * 2. They have the same attributes (keys and values)
 * 
 * Note: Child elements are compared separately by XPath.
 * 
 * @param {XmlNode} leftNode - Node from left tree
 * @param {XmlNode} rightNode - Node from right tree
 * @returns {boolean} True if nodes are identical
 */
function areNodesIdentical(leftNode, rightNode) {
    // Check text content
    if (!isTextContentEqual(leftNode.textContent, rightNode.textContent)) {
        return false;
    }

    // Check attributes
    if (!areAttributesEqual(leftNode.attributes, rightNode.attributes)) {
        return false;
    }

    return true;
}

/**
 * Compare text content of two nodes.
 * 
 * @param {string} leftText - Text content from left node
 * @param {string} rightText - Text content from right node
 * @returns {boolean} True if text content is equal
 */
function isTextContentEqual(leftText, rightText) {
    return leftText === rightText;
}

/**
 * Compare attributes of two nodes.
 * 
 * Checks that both nodes have the same attribute keys
 * and the same values for each key.
 * 
 * @param {Object.<string, string>} leftAttrs - Attributes from left node
 * @param {Object.<string, string>} rightAttrs - Attributes from right node
 * @returns {boolean} True if attributes are equal
 */
function areAttributesEqual(leftAttrs, rightAttrs) {
    const leftKeys = Object.keys(leftAttrs);
    const rightKeys = Object.keys(rightAttrs);

    // Check if same number of attributes
    if (leftKeys.length !== rightKeys.length) {
        return false;
    }

    // Check each attribute value
    for (const key of leftKeys) {
        if (leftAttrs[key] !== rightAttrs[key]) {
            return false;
        }
    }

    return true;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Calculate summary statistics for the comparison.
 * 
 * @param {Set<string>} leftPaths - All paths from left tree
 * @param {Set<string>} rightPaths - All paths from right tree
 * @param {Set<string>} matched - Matched element paths
 * @param {Set<string>} leftOnly - Left-only element paths
 * @param {Set<string>} rightOnly - Right-only element paths
 * @param {Set<string>} different - Different element paths
 * @returns {DiffStats} Summary statistics object
 */
function calculateStats(leftPaths, rightPaths, matched, leftOnly, rightOnly, different) {
    return {
        totalLeft: leftPaths.size,
        totalRight: rightPaths.size,
        matched: matched.size,
        leftOnly: leftOnly.size,
        rightOnly: rightOnly.size,
        different: different.size,
    };
}

// ============================================================================
// STATUS HELPERS (for UI integration)
// ============================================================================

/**
 * Get the diff status for a specific XPath.
 * 
 * This helper is useful for UI highlighting - it tells you how
 * a specific element should be displayed based on the diff results.
 * 
 * @param {string} xpath - The XPath to check
 * @param {DiffResults|null} diffResults - The comparison results
 * @param {'left'|'right'} side - Which side's perspective to use
 * @returns {string} One of DiffStatus values
 * 
 * @example
 * const status = getDiffStatus('/root/item', diffResults, 'left');
 * if (status === DiffStatus.EXTRA) {
 *   // Highlight as extra (exists only on this side)
 * }
 */
export function getDiffStatus(xpath, diffResults, side) {
    // No results means neutral (no comparison done)
    if (!diffResults) {
        return DiffStatus.NEUTRAL;
    }

    // Check matched first (most common case)
    if (isInArray(xpath, diffResults.matched)) {
        return DiffStatus.MATCHED;
    }

    // Check if different
    if (isInArray(xpath, diffResults.different)) {
        return DiffStatus.DIFFERENT;
    }

    // Check if extra (exists only on this side)
    if (side === 'left' && isInArray(xpath, diffResults.leftOnly)) {
        return DiffStatus.EXTRA;
    }

    if (side === 'right' && isInArray(xpath, diffResults.rightOnly)) {
        return DiffStatus.EXTRA;
    }

    return DiffStatus.NEUTRAL;
}

/**
 * Check if a value exists in an array.
 * 
 * Simple helper to improve readability.
 * 
 * @param {string} value - Value to find
 * @param {string[]} array - Array to search
 * @returns {boolean} True if value is in array
 */
function isInArray(value, array) {
    return array.includes(value);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a summary of the diff results as a human-readable string.
 * 
 * Useful for logging or displaying a quick overview.
 * 
 * @param {DiffResults} results - The comparison results
 * @returns {string} Human-readable summary
 */
export function getDiffSummary(results) {
    const { stats } = results;

    return [
        `Left elements: ${stats.totalLeft}`,
        `Right elements: ${stats.totalRight}`,
        `Matched: ${stats.matched}`,
        `Left only: ${stats.leftOnly}`,
        `Right only: ${stats.rightOnly}`,
        `Different: ${stats.different}`,
    ].join('\n');
}

/**
 * Check if two XML trees are identical.
 * 
 * Convenience function that returns true if there are no differences.
 * 
 * @param {DiffResults} results - The comparison results
 * @returns {boolean} True if trees are identical
 */
export function areTreesIdentical(results) {
    return (
        results.leftOnly.length === 0 &&
        results.rightOnly.length === 0 &&
        results.different.length === 0
    );
}
