/**
 * ============================================================================
 * XML COMPARE CORE - Main Export
 * ============================================================================
 * 
 * This is the main entry point for the XML Compare core library.
 * Import from this file to get all core functionality.
 * 
 * USAGE:
 * 
 * ```javascript
 * import { parseXml, compareXml, getDiffStatus } from './core';
 * 
 * const left = parseXml('<root><a>1</a></root>');
 * const right = parseXml('<root><a>2</a></root>');
 * const results = compareXml(left, right);
 * ```
 * 
 * FUTURE ELECTRON INTEGRATION:
 * This core library can be used directly in an Electron app.
 * Just copy the /src/core folder to your Electron project
 * and import from there.
 * 
 * ============================================================================
 */

// Re-export all parser functions
export {
    parseXml,
    safeParseXml,
    flattenTree,
    getAllXPaths,
    countNodes,
    findNodeByXPath,
} from './xmlParser.js';

// Re-export all comparer functions
export {
    compareXml,
    getDiffStatus,
    getDiffSummary,
    areTreesIdentical,
    DiffStatus,
} from './xmlComparer.js';
