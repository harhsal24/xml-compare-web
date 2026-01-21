/**
 * ============================================================================
 * XML COMPARER - Unit Tests
 * ============================================================================
 * 
 * Comprehensive tests for the XML comparison core functionality.
 * Uses sample XML fixtures for realistic testing scenarios.
 * 
 * Run with: npm test
 * 
 * ============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { parseXml } from '../core/xmlParser.js';
import {
    compareXml,
    getDiffStatus,
    getDiffSummary,
    areTreesIdentical,
    DiffStatus,
} from '../core/xmlComparer.js';
import { fixtures, inlineXml } from './fixtures.js';

// ============================================================================
// Setup: Configure DOM environment for Node.js
// ============================================================================

beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.DOMParser = dom.window.DOMParser;
});

// ============================================================================
// compareXml Tests
// ============================================================================

describe('compareXml', () => {

    // --------------------------------------------------------------------------
    // Identical Trees Tests
    // --------------------------------------------------------------------------

    describe('Identical Trees', () => {
        it('should find no differences when comparing same fixture to itself', () => {
            const left = parseXml(fixtures.sampleLeft);
            const right = parseXml(fixtures.sampleLeft);

            const result = compareXml(left, right);

            expect(result.leftOnly).toHaveLength(0);
            expect(result.rightOnly).toHaveLength(0);
            expect(result.different).toHaveLength(0);
            expect(result.matched.length).toBe(result.stats.totalLeft);
        });

        it('should find no differences in identical simple trees', () => {
            const left = parseXml(inlineXml.simpleText);
            const right = parseXml(inlineXml.simpleText);

            const result = compareXml(left, right);

            expect(result.leftOnly).toHaveLength(0);
            expect(result.rightOnly).toHaveLength(0);
            expect(result.different).toHaveLength(0);
            expect(result.matched).toContain('/root');
        });

        it('should find no differences in complex identical trees', () => {
            const left = parseXml(fixtures.complexNested);
            const right = parseXml(fixtures.complexNested);

            const result = compareXml(left, right);

            expect(areTreesIdentical(result)).toBe(true);
        });
    });

    // --------------------------------------------------------------------------
    // Sample Fixtures Comparison Tests
    // --------------------------------------------------------------------------

    describe('Sample Fixtures Comparison', () => {
        it('should detect differences between sample-left and sample-right', () => {
            const left = parseXml(fixtures.sampleLeft);
            const right = parseXml(fixtures.sampleRight);

            const result = compareXml(left, right);

            // <value> only in left
            expect(result.leftOnly).toContain('/root/item[1]/value');

            // <price> and <description> only in right
            expect(result.rightOnly).toContain('/root/item[1]/price');
            expect(result.rightOnly).toContain('/root/item[2]/description');

            // Common elements should be matched
            expect(result.matched).toContain('/root');
            expect(result.matched).toContain('/root/item[1]');
            expect(result.matched).toContain('/root/item[1]/name');
            expect(result.matched).toContain('/root/item[2]');
            expect(result.matched).toContain('/root/item[2]/name');
        });

        it('should calculate correct stats for sample fixtures', () => {
            const left = parseXml(fixtures.sampleLeft);
            const right = parseXml(fixtures.sampleRight);

            const result = compareXml(left, right);

            expect(result.stats.totalLeft).toBe(6);  // root + 2 items + name + value + name
            expect(result.stats.totalRight).toBe(7); // root + 2 items + name + price + name + description
            expect(result.stats.leftOnly).toBe(1);   // <value>
            expect(result.stats.rightOnly).toBe(2);  // <price>, <description>
            expect(result.stats.matched).toBe(5);    // root + 2 items + 2 names
        });
    });

    // --------------------------------------------------------------------------
    // Left Only Elements Tests
    // --------------------------------------------------------------------------

    describe('Left Only Elements', () => {
        it('should detect element only in left tree', () => {
            const left = parseXml('<root><a/><b/></root>');
            const right = parseXml('<root><a/></root>');

            const result = compareXml(left, right);

            expect(result.leftOnly).toContain('/root/b');
            expect(result.rightOnly).toHaveLength(0);
        });

        it('should detect multiple elements only in left', () => {
            const left = parseXml('<root><a/><b/><c/></root>');
            const right = parseXml('<root><a/></root>');

            const result = compareXml(left, right);

            expect(result.leftOnly).toHaveLength(2);
            expect(result.leftOnly).toContain('/root/b');
            expect(result.leftOnly).toContain('/root/c');
        });

        it('should detect nested elements only in left', () => {
            const left = parseXml('<root><parent><child/></parent></root>');
            const right = parseXml('<root><parent/></root>');

            const result = compareXml(left, right);

            expect(result.leftOnly).toContain('/root/parent/child');
        });
    });

    // --------------------------------------------------------------------------
    // Right Only Elements Tests
    // --------------------------------------------------------------------------

    describe('Right Only Elements', () => {
        it('should detect element only in right tree', () => {
            const left = parseXml('<root><a/></root>');
            const right = parseXml('<root><a/><b/></root>');

            const result = compareXml(left, right);

            expect(result.rightOnly).toContain('/root/b');
            expect(result.leftOnly).toHaveLength(0);
        });

        it('should detect multiple elements only in right', () => {
            const left = parseXml('<root><a/></root>');
            const right = parseXml('<root><a/><b/><c/></root>');

            const result = compareXml(left, right);

            expect(result.rightOnly).toHaveLength(2);
        });
    });

    // --------------------------------------------------------------------------
    // Different Elements Tests
    // --------------------------------------------------------------------------

    describe('Different Elements', () => {
        it('should detect text content difference', () => {
            const left = parseXml('<root>Hello</root>');
            const right = parseXml('<root>World</root>');

            const result = compareXml(left, right);

            expect(result.different).toContain('/root');
            expect(result.matched).toHaveLength(0);
        });

        it('should detect attribute value difference', () => {
            const left = parseXml('<item id="1"/>');
            const right = parseXml('<item id="2"/>');

            const result = compareXml(left, right);

            expect(result.different).toContain('/item');
        });

        it('should detect different number of attributes', () => {
            const left = parseXml('<item id="1"/>');
            const right = parseXml('<item id="1" name="test"/>');

            const result = compareXml(left, right);

            expect(result.different).toContain('/item');
        });
    });

    // --------------------------------------------------------------------------
    // Mixed Differences Tests
    // --------------------------------------------------------------------------

    describe('Mixed Differences', () => {
        it('should handle left only, right only, and different together', () => {
            const left = parseXml('<root><a>1</a><b/></root>');
            const right = parseXml('<root><a>2</a><c/></root>');

            const result = compareXml(left, right);

            expect(result.leftOnly).toContain('/root/b');
            expect(result.rightOnly).toContain('/root/c');
            expect(result.different).toContain('/root/a');
            expect(result.matched).toContain('/root');
        });
    });
});

// ============================================================================
// getDiffStatus Tests
// ============================================================================

describe('getDiffStatus', () => {
    it('should return NEUTRAL when no diff results', () => {
        const status = getDiffStatus('/root', null, 'left');
        expect(status).toBe(DiffStatus.NEUTRAL);
    });

    it('should return MATCHED for matched elements', () => {
        const left = parseXml(fixtures.sampleLeft);
        const right = parseXml(fixtures.sampleLeft);
        const results = compareXml(left, right);

        expect(getDiffStatus('/root', results, 'left')).toBe(DiffStatus.MATCHED);
    });

    it('should return DIFFERENT for different elements', () => {
        const left = parseXml('<root>Hello</root>');
        const right = parseXml('<root>World</root>');
        const results = compareXml(left, right);

        expect(getDiffStatus('/root', results, 'left')).toBe(DiffStatus.DIFFERENT);
    });

    it('should return EXTRA for left-only elements on left side', () => {
        const left = parseXml(fixtures.sampleLeft);
        const right = parseXml(fixtures.sampleRight);
        const results = compareXml(left, right);

        expect(getDiffStatus('/root/item[1]/value', results, 'left')).toBe(DiffStatus.EXTRA);
    });

    it('should return EXTRA for right-only elements on right side', () => {
        const left = parseXml(fixtures.sampleLeft);
        const right = parseXml(fixtures.sampleRight);
        const results = compareXml(left, right);

        expect(getDiffStatus('/root/item[1]/price', results, 'right')).toBe(DiffStatus.EXTRA);
    });
});

// ============================================================================
// getDiffSummary Tests
// ============================================================================

describe('getDiffSummary', () => {
    it('should return formatted summary string', () => {
        const left = parseXml(fixtures.sampleLeft);
        const right = parseXml(fixtures.sampleRight);
        const results = compareXml(left, right);

        const summary = getDiffSummary(results);

        expect(summary).toContain('Left elements: 6');
        expect(summary).toContain('Right elements: 7');
        expect(summary).toContain('Matched: 5');
        expect(summary).toContain('Left only: 1');
        expect(summary).toContain('Right only: 2');
    });
});

// ============================================================================
// areTreesIdentical Tests
// ============================================================================

describe('areTreesIdentical', () => {
    it('should return true for identical fixtures', () => {
        const left = parseXml(fixtures.sampleLeft);
        const right = parseXml(fixtures.sampleLeft);
        const results = compareXml(left, right);

        expect(areTreesIdentical(results)).toBe(true);
    });

    it('should return false for different fixtures', () => {
        const left = parseXml(fixtures.sampleLeft);
        const right = parseXml(fixtures.sampleRight);
        const results = compareXml(left, right);

        expect(areTreesIdentical(results)).toBe(false);
    });

    it('should return true for complex identical fixtures', () => {
        const left = parseXml(fixtures.complexNested);
        const right = parseXml(fixtures.complexNested);
        const results = compareXml(left, right);

        expect(areTreesIdentical(results)).toBe(true);
    });
});

// ============================================================================
// DiffStatus Constants Tests
// ============================================================================

describe('DiffStatus', () => {
    it('should have all expected status values', () => {
        expect(DiffStatus.MATCHED).toBe('matched');
        expect(DiffStatus.EXTRA).toBe('extra');
        expect(DiffStatus.DIFFERENT).toBe('different');
        expect(DiffStatus.NEUTRAL).toBe('neutral');
    });
});
