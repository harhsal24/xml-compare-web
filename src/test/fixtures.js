/**
 * ============================================================================
 * Test Fixtures Loader
 * ============================================================================
 * 
 * Utility functions to load sample XML files for testing.
 * 
 * ============================================================================
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, 'fixtures');

/**
 * Load an XML fixture file by name.
 * 
 * @param {string} filename - Name of the fixture file (without path)
 * @returns {string} The XML content as a string
 * 
 * @example
 * const xml = loadFixture('sample-left.xml');
 */
export function loadFixture(filename) {
    const filepath = join(FIXTURES_DIR, filename);
    return readFileSync(filepath, 'utf-8');
}

/**
 * Get the path to a fixture file.
 * 
 * @param {string} filename - Name of the fixture file
 * @returns {string} Absolute path to the fixture
 */
export function getFixturePath(filename) {
    return join(FIXTURES_DIR, filename);
}

// ============================================================================
// Pre-loaded fixtures for convenience
// ============================================================================

/**
 * Sample XML strings for quick access in tests.
 * These are loaded once and cached.
 */
export const fixtures = {
    /** Basic left XML for comparison (has <value> element) */
    get sampleLeft() {
        return loadFixture('sample-left.xml');
    },

    /** Basic right XML for comparison (has <price> and <description> elements) */
    get sampleRight() {
        return loadFixture('sample-right.xml');
    },

    /** Complex deeply nested XML structure */
    get complexNested() {
        return loadFixture('complex-nested.xml');
    },

    /** XML with many identical sibling elements */
    get multipleSiblings() {
        return loadFixture('multiple-siblings.xml');
    },

    /** XML with various attributes */
    get attributes() {
        return loadFixture('attributes.xml');
    },

    /** Minimal single-element XML */
    get minimal() {
        return loadFixture('minimal.xml');
    },

    /** Empty self-closing element */
    get empty() {
        return loadFixture('empty.xml');
    },
};

// ============================================================================
// Inline XML strings for tests that don't need files
// ============================================================================

/**
 * Small XML snippets for quick tests.
 * Use these when you need a specific structure without loading a file.
 */
export const inlineXml = {
    /** Simple root with text: <root>Hello</root> */
    simpleText: '<root>Hello</root>',

    /** Root with single child: <root><child>Value</child></root> */
    singleChild: '<root><child>Value</child></root>',

    /** Deep nesting: <a><b><c><d>Deep</d></c></b></a> */
    deepNesting: '<a><b><c><d>Deep</d></c></b></a>',

    /** Multiple different siblings: <root><a/><b/><c/></root> */
    differentSiblings: '<root><a/><b/><c/></root>',

    /** Multiple same siblings: <root><item/><item/><item/></root> */
    sameSiblings: '<root><item/><item/><item/></root>',

    /** Element with id attribute: <item id="123"/> */
    withId: '<item id="123"/>',

    /** Element with multiple attributes: <item id="1" name="test" type="example"/> */
    multipleAttrs: '<item id="1" name="test" type="example"/>',

    /** Invalid XML for error testing */
    invalid: '<root><unclosed>',
};
