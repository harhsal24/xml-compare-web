/**
 * ============================================================================
 * XML PROCESSING WORKER
 * ============================================================================
 *
 * This worker offloads the heavy XML parsing and comparison from the main
 * UI thread to prevent the application from freezing when handling large files.
 *
 * It listens for messages containing XML strings, processes them, and posts
 * the results back to the main thread.
 *
 * ============================================================================
 */

import { parseXml } from './xmlParser';
import { compareXml } from './xmlComparer';

/**
 * Main message handler for the worker.
 *
 * The event data is expected to be an object with `leftXml` and `rightXml`.
 *
 * @param {MessageEvent} event - The event from the main thread
 */
self.onmessage = (event) => {
    const { leftXml, rightXml, isDebugMode } = event.data;

    if (isDebugMode) console.log('Worker received job:', { leftXml, rightXml });

    if (!leftXml || !rightXml) {
        if (isDebugMode) console.error('Worker: Missing XML input.');
        self.postMessage({ error: 'Both XML inputs are required.' });
        return;
    }

    try {
        // Step 1: Parse both XML strings
        if (isDebugMode) console.log('Worker: Parsing left XML...');
        const leftTree = parseXml(leftXml);
        if (isDebugMode) console.log('Worker: Parsing right XML...');
        const rightTree = parseXml(rightXml);

        // Step 2: Compare the parsed trees
        if (isDebugMode) console.log('Worker: Comparing trees...');
        const diffResults = compareXml(leftTree, rightTree);
        if (isDebugMode) console.log('Worker: Comparison finished.');

        // Step 3: Post the successful results back to the main thread
        self.postMessage({
            success: true,
            leftTree,
            rightTree,
            diffResults,
        });
    } catch (error) {
        if (isDebugMode) console.error('Worker: Error during processing:', error);
        // Step 4: If any error occurs, post an error message back
        self.postMessage({
            success: false,
            error: error.message,
        });
    }
};
