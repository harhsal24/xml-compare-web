/**
 * Zustand Store for XML Comparison
 * Uses main thread parsing with requestIdleCallback for non-blocking execution
 */

import { create } from 'zustand';
import { parseXml } from '../core/xmlParser';
import { compareXml } from '../core/xmlComparer';
import { DEBUG_MODE } from '../config';

const XPATH_SETTINGS_KEY = 'xmlCompare_xpathSettings';

const defaultXpathSettings = {
    elementsArray: [],
    indexAttribute: null,
    leafOmit: true
};

// Load settings from localStorage or use defaults
const loadXpathSettings = () => {
    try {
        const stored = localStorage.getItem(XPATH_SETTINGS_KEY);
        if (stored) {
            return { ...defaultXpathSettings, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn('Failed to load xpath settings from localStorage:', e);
    }
    return defaultXpathSettings;
};

// Worker instance
let worker = null;

const getWorker = () => {
    if (!worker) {
        worker = new Worker(new URL('../core/xml.worker.js', import.meta.url), { type: 'module' });
    }
    return worker;
};

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

    // File Metadata
    leftFileMeta: { name: 'Left', path: '' },
    rightFileMeta: { name: 'Right', path: '' },

    // Currently selected XPath (for highlighting)
    selectedXPath: null,

    // Navigation State
    activeCategory: null, // 'matched', 'different', 'leftOnly', 'rightOnly'

    // Debug mode
    isDebugMode: DEBUG_MODE,

    // XPath Settings
    xpathSettings: loadXpathSettings(),

    // View Settings
    fontSize: 14,
    isZenMode: false,
    showBorders: true,
    // treeViewStyle removed as per user request
    showLeafDots: true,
    showStatusBadges: true,
    isScrollLocked: false, // New state for scroll synchronization
    lastFocusedSide: 'left', // 'left' or 'right'

    setLastFocusedSide: (side) => {
        set({ lastFocusedSide: side });
    },

    setXpathSettings: (settings) => {
        const newSettings = { ...get().xpathSettings, ...settings };
        try {
            localStorage.setItem(XPATH_SETTINGS_KEY, JSON.stringify(newSettings));
        } catch (e) {
            console.warn('Failed to save xpath settings to localStorage:', e);
        }
        set({ xpathSettings: newSettings });
    },

    loadXpathSettingsFromFile: async (file) => {
        try {
            const text = await file.text();
            const settings = JSON.parse(text);
            get().setXpathSettings(settings);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    setFontSize: (size) => {
        if (DEBUG_MODE) console.log('Setting font size:', size);
        set({ fontSize: size });
    },

    toggleZenMode: () => {
        const { isZenMode } = get();
        if (DEBUG_MODE) console.log('Toggling Zen Mode. New value:', !isZenMode);
        set({ isZenMode: !isZenMode });
    },

    toggleBorders: () => {
        const { showBorders } = get();
        if (DEBUG_MODE) console.log('Toggling Borders. New value:', !showBorders);
        set({ showBorders: !showBorders });
    },

    toggleScrollLock: () => {
        const { isScrollLocked, isDebugMode } = get();
        if (isDebugMode) console.log('Toggling Scroll Lock. New value:', !isScrollLocked);
        set({ isScrollLocked: !isScrollLocked });
    },

    toggleLeafDots: () => {
        const { showLeafDots } = get();
        if (DEBUG_MODE) console.log('Toggling Leaf Dots. New value:', !showLeafDots);
        set({ showLeafDots: !showLeafDots });
    },

    toggleStatusBadges: () => {
        const { showStatusBadges } = get();
        console.log('Toggling Status Badges. New value:', !showStatusBadges);
        set({ showStatusBadges: !showStatusBadges });
    },

    setLeftXml: (xml, meta = null) => {
        if (DEBUG_MODE) console.log('Setting left XML');
        set({
            leftXml: xml,
            leftTree: null,
            leftError: null,
            diffResults: null,
            selectedXPath: null,
            activeCategory: null,
            ...(meta && { leftFileMeta: meta }),
        });
    },

    setRightXml: (xml, meta = null) => {
        if (DEBUG_MODE) console.log('Setting right XML');
        set({
            rightXml: xml,
            rightTree: null,
            rightError: null,
            diffResults: null,
            selectedXPath: null,
            activeCategory: null,
            ...(meta && { rightFileMeta: meta }),
        });
    },

    compare: () => {
        const { leftXml, rightXml, isDebugMode, xpathSettings } = get();
        if (isDebugMode) console.log('Comparing XMLs (Worker)');

        if (!leftXml || !rightXml) {
            return;
        }

        set({ isComparing: true, diffResults: null });

        const workerInstance = getWorker();
        const requestId = Date.now();

        // One-time listener for the response
        const handleMessage = (e) => {
            const { type, id, payload, error } = e.data;
            if (id !== requestId) return; // Ignore old requests

            if (type === 'RESULT') {
                if (isDebugMode) console.log('Worker finished processing');
                set({
                    leftTree: payload.leftTree,
                    rightTree: payload.rightTree,
                    diffResults: payload.diffResults,
                    leftError: payload.leftError,
                    rightError: payload.rightError,
                    isComparing: false,
                });
            } else if (type === 'ERROR') {
                if (isDebugMode) console.error('Worker error:', error);
                set({
                    isComparing: false,
                    leftError: error,
                    rightError: error,
                    diffResults: null,
                });
            }

            workerInstance.removeEventListener('message', handleMessage);
        };

        workerInstance.addEventListener('message', handleMessage);

        workerInstance.postMessage({
            type: 'PARSE_AND_COMPARE',
            id: requestId,
            payload: {
                leftXml,
                rightXml,
                xpathSettings
            }
        });
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
            leftFileMeta: { name: 'Left', path: '' },
            rightFileMeta: { name: 'Right', path: '' },
        });
    },
}));

export default useXmlStore;
