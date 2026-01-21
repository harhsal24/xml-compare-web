/**
 * ============================================================================
 * XML PARSER - Unit Tests
 * ============================================================================
 * 
 * Comprehensive tests for the XML parser core functionality.
 * Uses sample XML fixtures for realistic testing scenarios.
 * 
 * Run with: npm test
 * 
 * ============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
    parseXml,
    safeParseXml,
    flattenTree,
    getAllXPaths,
    countNodes,
    findNodeByXPath,
} from '../core/xmlParser.js';
import { fixtures, inlineXml } from './fixtures.js';

// ============================================================================
// Setup: Configure DOM environment for Node.js
// ============================================================================

beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;
});

// ============================================================================
// parseXml Tests
// ============================================================================

describe('parseXml', () => {

    // --------------------------------------------------------------------------
    // Basic Parsing Tests
    // --------------------------------------------------------------------------

    describe('Basic Parsing', () => {
        it('should parse minimal XML with text content', () => {
            const tree = parseXml(fixtures.minimal);

            expect(tree.tagName).toBe('root');
            expect(tree.xpath).toBe('/root');
            expect(tree.textContent).toBe('Hello World');
            expect(tree.children).toHaveLength(0);
        });

        it('should parse simple XML with single element', () => {
            const tree = parseXml(inlineXml.simpleText);

            expect(tree.tagName).toBe('root');
            expect(tree.xpath).toBe('/root');
            expect(tree.textContent).toBe('Hello');
        });

        it('should parse nested elements correctly', () => {
            const tree = parseXml(inlineXml.singleChild);

            expect(tree.children).toHaveLength(1);
            expect(tree.children[0].tagName).toBe('child');
            expect(tree.children[0].xpath).toBe('/root/child');
            expect(tree.children[0].textContent).toBe('Value');
        });

        it('should parse deeply nested elements', () => {
            const tree = parseXml(inlineXml.deepNesting);

            expect(tree.children[0].children[0].children[0].tagName).toBe('d');
            expect(tree.children[0].children[0].children[0].xpath).toBe('/a/b/c/d');
        });

        it('should parse empty self-closing element', () => {
            const tree = parseXml(fixtures.empty);

            expect(tree.tagName).toBe('empty');
            expect(tree.textContent).toBe('');
            expect(tree.children).toHaveLength(0);
        });

        it('should parse sample left XML correctly', () => {
            const tree = parseXml(fixtures.sampleLeft);

            expect(tree.tagName).toBe('root');
            expect(tree.children).toHaveLength(2);
            expect(tree.children[0].tagName).toBe('item');
            expect(tree.children[0].attributes.id).toBe('1');
        });
    });

    // --------------------------------------------------------------------------
    // XPath Generation Tests
    // --------------------------------------------------------------------------

    describe('XPath Generation', () => {
        it('should generate correct XPath for root element', () => {
            const tree = parseXml(fixtures.minimal);
            expect(tree.xpath).toBe('/root');
        });

        it('should add index when siblings have same tag name', () => {
            const tree = parseXml(inlineXml.sameSiblings);

            expect(tree.children[0].xpath).toBe('/root/item[1]');
            expect(tree.children[1].xpath).toBe('/root/item[2]');
            expect(tree.children[2].xpath).toBe('/root/item[3]');
        });

        it('should not add index when siblings have different tag names', () => {
            const tree = parseXml(inlineXml.differentSiblings);

            expect(tree.children[0].xpath).toBe('/root/a');
            expect(tree.children[1].xpath).toBe('/root/b');
            expect(tree.children[2].xpath).toBe('/root/c');
        });

        it('should handle multiple siblings fixture correctly', () => {
            const tree = parseXml(fixtures.multipleSiblings);

            // 6 <item> elements and 1 <other> element
            const items = tree.children.filter(c => c.tagName === 'item');
            expect(items).toHaveLength(6);
            expect(items[0].xpath).toBe('/list/item[1]');
            expect(items[5].xpath).toBe('/list/item[6]');

            // The <other> element should not have an index
            const other = tree.children.find(c => c.tagName === 'other');
            expect(other.xpath).toBe('/list/other');
        });

        it('should generate correct XPaths for complex nested XML', () => {
            const tree = parseXml(fixtures.complexNested);

            // Navigate to deep node
            const category = tree.children[0]; // first <category>
            const subcategory = category.children[0]; // first <subcategory>
            const product = subcategory.children[0]; // first <product>

            expect(product.xpath).toBe('/catalog/category[1]/subcategory[1]/product[1]');
        });
    });

    // --------------------------------------------------------------------------
    // Attribute Handling Tests
    // --------------------------------------------------------------------------

    describe('Attribute Handling', () => {
        it('should parse single attribute', () => {
            const tree = parseXml(inlineXml.withId);
            expect(tree.attributes).toEqual({ id: '123' });
        });

        it('should parse multiple attributes', () => {
            const tree = parseXml(inlineXml.multipleAttrs);

            expect(tree.attributes).toEqual({
                id: '1',
                name: 'test',
                type: 'example',
            });
        });

        it('should parse attributes from fixture file', () => {
            const tree = parseXml(fixtures.attributes);

            expect(tree.attributes.version).toBe('1.0');
            expect(tree.attributes.environment).toBe('production');

            const database = tree.children[0];
            expect(database.attributes.host).toBe('localhost');
            expect(database.attributes.port).toBe('5432');
            expect(database.attributes.ssl).toBe('true');
        });

        it('should return empty object when no attributes', () => {
            const tree = parseXml(fixtures.minimal);
            expect(tree.attributes).toEqual({});
        });
    });

    // --------------------------------------------------------------------------
    // Text Content Extraction Tests
    // --------------------------------------------------------------------------

    describe('Text Content Extraction', () => {
        it('should extract direct text content', () => {
            const tree = parseXml(inlineXml.simpleText);
            expect(tree.textContent).toBe('Hello');
        });

        it('should get direct text from sample fixture', () => {
            const tree = parseXml(fixtures.sampleLeft);
            const name = tree.children[0].children[0]; // first <name>
            expect(name.textContent).toBe('Product A');
        });

        it('should only get direct text, not from children', () => {
            const xml = '<parent>Parent Text<child>Child Text</child></parent>';
            const tree = parseXml(xml);

            expect(tree.textContent).toBe('Parent Text');
            expect(tree.children[0].textContent).toBe('Child Text');
        });

        it('should return empty string when no text content', () => {
            const tree = parseXml(fixtures.empty);
            expect(tree.textContent).toBe('');
        });
    });

    // --------------------------------------------------------------------------
    // Comparison Key Generation Tests
    // --------------------------------------------------------------------------

    describe('Comparison Key Generation', () => {
        it('should use id attribute for comparison key', () => {
            const tree = parseXml(inlineXml.withId);
            expect(tree.key).toBe('item[@id="123"]');
        });

        it('should prioritize id over name and key attributes', () => {
            const tree = parseXml(inlineXml.multipleAttrs);
            expect(tree.key).toBe('item[@id="1"]');
        });

        it('should generate keys for sample fixture items', () => {
            const tree = parseXml(fixtures.sampleLeft);
            const item1 = tree.children[0];
            const item2 = tree.children[1];

            expect(item1.key).toBe('item[@id="1"]');
            expect(item2.key).toBe('item[@id="2"]');
        });

        it('should use just tag name if no identifying attributes', () => {
            const tree = parseXml(fixtures.minimal);
            expect(tree.key).toBe('root');
        });
    });

    // --------------------------------------------------------------------------
    // Error Handling Tests
    // --------------------------------------------------------------------------

    describe('Error Handling', () => {
        it('should throw error for empty string', () => {
            expect(() => parseXml('')).toThrow('XML input cannot be empty');
        });

        it('should throw error for whitespace-only string', () => {
            expect(() => parseXml('   \n\t  ')).toThrow('XML input cannot be empty');
        });

        it('should throw error for non-string input', () => {
            expect(() => parseXml(null)).toThrow('XML input must be a string');
            expect(() => parseXml(undefined)).toThrow('XML input must be a string');
            expect(() => parseXml(123)).toThrow('XML input must be a string');
            expect(() => parseXml({})).toThrow('XML input must be a string');
        });

        it('should throw error for invalid XML', () => {
            expect(() => parseXml(inlineXml.invalid)).toThrow(/Invalid XML/);
            expect(() => parseXml('<root><child></root>')).toThrow(/Invalid XML/);
        });
    });
});

// ============================================================================
// safeParseXml Tests
// ============================================================================

describe('safeParseXml', () => {
    it('should return success result for valid XML fixture', () => {
        const result = safeParseXml(fixtures.sampleLeft);

        expect(result.success).toBe(true);
        expect(result.tree).not.toBeNull();
        expect(result.tree.tagName).toBe('root');
        expect(result.error).toBeNull();
    });

    it('should return error result for invalid XML', () => {
        const result = safeParseXml(inlineXml.invalid);

        expect(result.success).toBe(false);
        expect(result.tree).toBeNull();
        expect(result.error).toContain('Invalid XML');
    });

    it('should return error result for empty string', () => {
        const result = safeParseXml('');

        expect(result.success).toBe(false);
        expect(result.tree).toBeNull();
        expect(result.error).toBe('XML input cannot be empty');
    });
});

// ============================================================================
// flattenTree Tests
// ============================================================================

describe('flattenTree', () => {
    it('should create map with all XPaths from fixture', () => {
        const tree = parseXml(fixtures.sampleLeft);
        const map = flattenTree(tree);

        // root + 2 items + (name + value) + (name) = 6 nodes
        expect(map.size).toBe(6);
        expect(map.has('/root')).toBe(true);
        expect(map.has('/root/item[1]')).toBe(true);
        expect(map.has('/root/item[1]/name')).toBe(true);
        expect(map.has('/root/item[1]/value')).toBe(true);
        expect(map.has('/root/item[2]')).toBe(true);
        expect(map.has('/root/item[2]/name')).toBe(true);
    });

    it('should handle complex nested fixture', () => {
        const tree = parseXml(fixtures.complexNested);
        const map = flattenTree(tree);

        // Should have many nodes from nested structure
        expect(map.size).toBeGreaterThan(20);
        expect(map.has('/catalog')).toBe(true);
        expect(map.has('/catalog/category[1]/subcategory[1]/product[1]/brand')).toBe(true);
    });
});

// ============================================================================
// getAllXPaths Tests
// ============================================================================

describe('getAllXPaths', () => {
    it('should return set of all XPaths from fixture', () => {
        const tree = parseXml(fixtures.multipleSiblings);
        const paths = getAllXPaths(tree);

        expect(paths.has('/list')).toBe(true);
        expect(paths.has('/list/item[1]')).toBe(true);
        expect(paths.has('/list/item[6]')).toBe(true);
        expect(paths.has('/list/other')).toBe(true);
    });
});

// ============================================================================
// countNodes Tests
// ============================================================================

describe('countNodes', () => {
    it('should count all elements in sample fixture', () => {
        const tree = parseXml(fixtures.sampleLeft);
        // root + 2 items + name + value + name = 6
        expect(countNodes(tree)).toBe(6);
    });

    it('should count all elements in complex fixture', () => {
        const tree = parseXml(fixtures.complexNested);
        expect(countNodes(tree)).toBeGreaterThan(20);
    });

    it('should count single element', () => {
        const tree = parseXml(fixtures.empty);
        expect(countNodes(tree)).toBe(1);
    });
});

// ============================================================================
// findNodeByXPath Tests
// ============================================================================

describe('findNodeByXPath', () => {
    it('should find root node in fixture', () => {
        const tree = parseXml(fixtures.sampleLeft);
        const node = findNodeByXPath(tree, '/root');

        expect(node).not.toBeNull();
        expect(node.tagName).toBe('root');
    });

    it('should find nested node with index', () => {
        const tree = parseXml(fixtures.sampleLeft);
        const node = findNodeByXPath(tree, '/root/item[2]/name');

        expect(node).not.toBeNull();
        expect(node.textContent).toBe('Product B');
    });

    it('should find deep node in complex fixture', () => {
        const tree = parseXml(fixtures.complexNested);
        const node = findNodeByXPath(tree, '/catalog/category[1]/subcategory[1]/product[1]/brand');

        expect(node).not.toBeNull();
        expect(node.textContent).toBe('Apple');
    });

    it('should return null for non-existent path', () => {
        const tree = parseXml(fixtures.sampleLeft);
        const node = findNodeByXPath(tree, '/root/nonexistent');

        expect(node).toBeNull();
    });
});
