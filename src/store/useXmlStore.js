/**
 * Zustand Store for XML Comparison
 */

import { create } from 'zustand';
import { parseXml } from '../utils/xmlParser';
import { compareXml } from '../utils/xmlComparer';

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

    // Currently selected XPath (for highlighting)
    selectedXPath: null,

    // Navigation State
    activeCategory: null, // 'matched', 'different', 'leftOnly', 'rightOnly'

    // Actions
    // View Settings
    fontSize: 14,
    isZenMode: false,
    setFontSize: (size) => set({ fontSize: size }),
    toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),

    setLeftXml: (xml) => {
        let tree = null;
        let error = null;

        if (xml.trim()) {
            try {
                tree = parseXml(xml);
            } catch (e) {
                error = e.message;
            }
        }

        set({
            leftXml: xml,
            leftTree: tree,
            leftError: error,
            diffResults: null,
            selectedXPath: null,
            activeCategory: null
        });
    },

    setRightXml: (xml) => {
        let tree = null;
        let error = null;

        if (xml.trim()) {
            try {
                tree = parseXml(xml);
            } catch (e) {
                error = e.message;
            }
        }

        set({
            rightXml: xml,
            rightTree: tree,
            rightError: error,
            diffResults: null,
            selectedXPath: null,
            activeCategory: null
        });
    },

    compare: () => {
        const { leftTree, rightTree } = get();

        if (!leftTree || !rightTree) {
            return;
        }

        const results = compareXml(leftTree, rightTree);
        set({
            diffResults: results,
            selectedXPath: null,
            activeCategory: null
        });
    },

    setSelectedXPath: (xpath) => {
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
            activeCategory: category
        });
    },

    clear: () => {
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
