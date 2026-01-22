/**
 * Zustand Store for XML Comparison
 * Uses main thread parsing with requestIdleCallback for non-blocking execution
 */

import { create } from 'zustand';
import { parseXml } from '../core/xmlParser';
import { compareXml } from '../core/xmlComparer';
import { DEBUG_MODE } from '../config';

const useXmlStore = create((set, get) => ({
    // Raw XML strings
    leftXml: '',
    rightXml: '',

    // Parsed trees
    leftTree: null,
    rightTree: null,

    // Parse errors
    leftError: null,
    rightError: null,

    // Comparison results
    diffResults: null,
    isComparing: false,

    // Currently selected XPath (for highlighting)
    selectedXPath: null,

    // Navigation State
    activeCategory: null, // 'matched', 'different', 'leftOnly', 'rightOnly'

    // Debug mode
    isDebugMode: DEBUG_MODE,

    // View Settings
    fontSize: 14,
    isZenMode: false,
    showBorders: true,
    treeViewStyle: 'default', // 'default' | 'none'

    setFontSize: (size) => {
        if (DEBUG_MODE) console.log('Setting font size:', size);
        set({ fontSize: size });
    },

    toggleZenMode: () => {
        if (DEBUG_MODE) console.log('Toggling zen mode');
        set((state) => ({ isZenMode: !state.isZenMode }));
    },

    toggleBorders: () => {
        if (DEBUG_MODE) console.log('Toggling borders');
        set((state) => ({ showBorders: !state.showBorders }));
    },

    setTreeViewStyle: (style) => {
        set({ treeViewStyle: style });
    },

    setLeftXml: (xml) => {
        if (DEBUG_MODE) console.log('Setting left XML');
        set({
            leftXml: xml,
            leftTree: null,
            leftError: null,
            diffResults: null,
            selectedXPath: null,
            activeCategory: null,
        });
    },

    setRightXml: (xml) => {
        if (DEBUG_MODE) console.log('Setting right XML');
        set({
            rightXml: xml,
            rightTree: null,
            rightError: null,
            diffResults: null,
            selectedXPath: null,
            activeCategory: null,
        });
    },

    compare: () => {
        const { leftXml, rightXml, isDebugMode } = get();
        if (isDebugMode) console.log('Comparing XMLs');

        if (!leftXml || !rightXml) {
            return;
        }

        set({ isComparing: true, diffResults: null });

        // Use setTimeout to allow UI to update before heavy processing
        setTimeout(() => {
            try {
                // Step 1: Parse both XML strings
                if (isDebugMode) console.log('Parsing left XML...');
                const leftTree = parseXml(leftXml);

                if (isDebugMode) console.log('Parsing right XML...');
                const rightTree = parseXml(rightXml);

                // Step 2: Compare the parsed trees
                if (isDebugMode) console.log('Comparing trees...');
                const diffResults = compareXml(leftTree, rightTree);
                if (isDebugMode) console.log('Comparison finished.');

                set({
                    leftTree,
                    rightTree,
                    diffResults,
                    isComparing: false,
                    leftError: null,
                    rightError: null,
                });
            } catch (error) {
                if (isDebugMode) console.error('Error during processing:', error);
                set({
                    isComparing: false,
                    leftError: error.message,
                    rightError: error.message,
                    diffResults: null,
                    leftTree: null,
                    rightTree: null,
                });
            }
        }, 50); // Small delay to let UI update
    },

    setSelectedXPath: (xpath) => {
        const { isDebugMode } = get();
        if (isDebugMode) console.log('Setting selected XPath:', xpath);
        set({ selectedXPath: xpath });
    },

    cycleDiff: (category) => {
        const { diffResults, selectedXPath } = get();

        if (!diffResults || !diffResults[category] || diffResults[category].length === 0) {
            return;
        }

        const items = diffResults[category];
        let nextIndex = 0;

        // If we're already in this category and have a selection, find next
        if (selectedXPath && items.includes(selectedXPath)) {
            const currentIndex = items.indexOf(selectedXPath);
            nextIndex = (currentIndex + 1) % items.length;
        }

        set({
            selectedXPath: items[nextIndex],
            activeCategory: category,
        });
    },

    navigateDiff: (category, direction) => {
        const { diffResults, selectedXPath } = get();

        if (!diffResults || !diffResults[category] || diffResults[category].length === 0) {
            return;
        }

        const items = diffResults[category];
        let nextIndex = 0;

        if (selectedXPath && items.includes(selectedXPath)) {
            const currentIndex = items.indexOf(selectedXPath);
            if (direction === 'next') {
                nextIndex = (currentIndex + 1) % items.length;
            } else {
                nextIndex = (currentIndex - 1 + items.length) % items.length;
            }
        } else {
            // If no selection yet, start from beginning or end based on direction
            nextIndex = direction === 'next' ? 0 : items.length - 1;
        }

        set({
            selectedXPath: items[nextIndex],
            activeCategory: category,
        });
    },

    clear: () => {
        const { isDebugMode } = get();
        if (isDebugMode) console.log('Clearing all');
        set({
            leftXml: '',
            rightXml: '',
            leftTree: null,
            rightTree: null,
            leftError: null,
            rightError: null,
            diffResults: null,
            selectedXPath: null,
            activeCategory: null,
        });
    },
}));

export default useXmlStore;
