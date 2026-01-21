/**
 * Color Configuration for XML Compare Views
 * Separate color schemes for Tree View and View Only mode
 * Tree View uses stronger colors (card-based UI)
 * View Only uses subtler colors (code-based UI)
 */

// Tree View Colors - Stronger backgrounds for card-style nodes
export const TREE_VIEW_COLORS = {
    // Node status backgrounds (for card background) - Medium intensity
    status: {
        matched: 'bg-green-100 border-green-400 text-green-800',
        extra: 'bg-amber-100 border-amber-400 text-amber-800',
        missing: 'bg-red-100 border-red-400 text-red-800',
        different: 'bg-purple-100 border-purple-400 text-purple-800',
        neutral: 'bg-slate-50 border-slate-300 text-slate-700',
    },

    // Attribute highlighting (when attribute value differs) - Standard text/bg highlighting (no strong box)
    attribute: {
        changed: {
            container: 'bg-orange-100 rounded px-1 mx-0.5',
            key: 'text-orange-900 font-bold',
            value: 'text-orange-800 font-semibold',
        },
        normal: {
            container: '',
            key: 'text-purple-600',
            value: 'text-purple-600',
        }
    },

    // Text content highlighting (when leaf node value differs) - Standard text/bg highlighting
    textContent: {
        changed: 'bg-cyan-100 text-cyan-900 px-1.5 py-0.5 rounded font-medium',
        normal: 'text-gray-700',
    },

    // Status badge colors
    badge: {
        matched: 'bg-green-500 text-white',
        extra: 'bg-amber-500 text-white',
        different: 'bg-purple-500 text-white',
        missing: 'bg-red-500 text-white',
    }
};

// View Only Colors - Very subtle colors for code-style line highlighting
// These should be much lighter to not interfere with syntax highlighting
export const VIEW_ONLY_COLORS = {
    // Line background colors (full-width highlighting) - Very subtle
    status: {
        matched: 'bg-green-50/50',
        extra: 'bg-amber-50/50',
        missing: 'bg-red-50/50',
        different: 'bg-purple-50/40',
        neutral: 'hover:bg-slate-50/30',
    },

    // Left border colors for lines - Subtle but visible
    border: {
        matched: 'border-green-300',
        extra: 'border-amber-300',
        different: 'border-purple-300',
        neutral: 'border-transparent',
    },

    // Attribute highlighting (inline, distinct box with border and ring)
    attribute: {
        changed: {
            container: 'bg-orange-50 border border-solid border-orange-400 rounded px-1 mx-0.5 shadow-sm ring-1 ring-orange-200',
            key: 'text-orange-800 font-bold',
            value: 'text-orange-700 font-semibold',
        },
        normal: {
            container: '',
            key: 'text-purple-600',
            value: 'text-green-600',
        }
    },

    // Text content highlighting (inline, distinct box with border and ring)
    textContent: {
        changed: 'bg-cyan-50 text-cyan-800 border border-solid border-cyan-400 px-1.5 py-0.5 rounded mx-1 shadow-sm ring-1 ring-cyan-200 font-semibold',
        normal: 'text-slate-900',
    }
};

// Legend colors (for DiffLegend component)
export const LEGEND_COLORS = {
    matched: 'bg-green-500',
    extra: 'bg-amber-500',
    different: 'bg-purple-500',
    attrChanged: 'bg-orange-200 border-orange-400 ring-1 ring-orange-400',
    textChanged: 'bg-cyan-200 border-cyan-400 ring-1 ring-cyan-400',
};
