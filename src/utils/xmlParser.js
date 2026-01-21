/**
 * ============================================================================
 * XML Parser - Presentation Layer Adapter
 * ============================================================================
 * 
 * This file re-exports the core XML parser functions for use in the
 * React presentation layer. It acts as a bridge between the framework-agnostic
 * core library and the React components.
 * 
 * WHY THIS ADAPTER EXISTS:
 * - Maintains separation between core logic and presentation
 * - Allows React components to import from a familiar location
 * - Makes it easy to swap implementations or add React-specific behavior
 * - Enables gradual migration to the new core library
 * 
 * FUTURE ELECTRON MIGRATION:
 * When converting to Electron, the core library (/src/core) can be
 * copied directly to the Electron project. This adapter layer stays
 * with the React web app.
 * 
 * ============================================================================
 */

// Re-export all functions from the core library
// This maintains backward compatibility with existing imports

export {
    parseXml,
    safeParseXml,
    flattenTree,
    getAllXPaths,
    countNodes,
    findNodeByXPath,
} from '../core/xmlParser.js';
