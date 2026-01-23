/**
 * Web Worker for XML Processing
 * Handles parsing and comparison off the main thread to prevent UI freezing.
 */

import { parseXml } from './xmlParser';
import { compareXml } from './xmlComparer';

// Respond to messages from the main thread
self.onmessage = (e) => {
    const { type, payload, id } = e.data;

    try {
        switch (type) {
            case 'PARSE_AND_COMPARE':
                handleParseAndCompare(payload, id);
                break;
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            id,
            error: error.message
        });
    }
};

function handleParseAndCompare({ leftXml, rightXml, xpathSettings }, id) {
    // 1. Parsing
    let leftTree, rightTree;
    let leftError = null;
    let rightError = null;

    try {
        leftTree = parseXml(leftXml, xpathSettings);
    } catch (err) {
        leftError = err.message;
    }

    try {
        rightTree = parseXml(rightXml, xpathSettings);
    } catch (err) {
        rightError = err.message;
    }

    // If parsing failed, return errors
    if (leftError || rightError) {
        self.postMessage({
            type: 'RESULT',
            id,
            payload: {
                leftTree: leftTree || null,
                rightTree: rightTree || null,
                leftError,
                rightError,
                diffResults: null
            }
        });
        return;
    }

    // 2. Comparison
    try {
        const diffResults = compareXml(leftTree, rightTree);

        self.postMessage({
            type: 'RESULT',
            id,
            payload: {
                leftTree,
                rightTree,
                diffResults,
                leftError: null,
                rightError: null
            }
        });
    } catch (err) {
        self.postMessage({
            type: 'ERROR',
            id,
            error: `Comparison failed: ${err.message}`
        });
    }
}
