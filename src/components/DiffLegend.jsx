/**
 * DiffLegend Component
 * Shows the color coding for the comparison results
 */

import { LEGEND_COLORS } from '../utils/colorConfig';

import useXmlStore from '../store/useXmlStore';

export default function DiffLegend() {
    const { activeCategory, cycleDiff, navigateDiff } = useXmlStore();

    const handleLegendClick = (category) => {
        // Find first item in this category to start navigation
        navigateDiff(category, 'next');
    };

    const getActiveClass = (category) => {
        return activeCategory === category
            ? 'ring-2 ring-blue-500 bg-blue-50'
            : 'hover:bg-slate-50 cursor-pointer';
    };

    return (
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-medium text-slate-600 flex-wrap">
            {/* Node-level status indicators */}
            <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${getActiveClass('matched')}`}
                onClick={() => handleLegendClick('matched')}
                title="Navigate Matched Nodes"
            >
                <span className={`w-2.5 h-2.5 rounded-full ${LEGEND_COLORS.matched}`}></span>
                <span>Matched</span>
            </div>
            <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${getActiveClass('extra')}`}
                onClick={() => handleLegendClick('extra')}
                title="Navigate Extra Nodes (Left/Right only)"
            >
                <span className={`w-2.5 h-2.5 rounded-full ${LEGEND_COLORS.extra}`}></span>
                <span>Extra</span>
            </div>
            <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${getActiveClass('different')}`}
                onClick={() => handleLegendClick('different')}
                title="Navigate Different Nodes"
            >
                <span className={`w-2.5 h-2.5 rounded-full ${LEGEND_COLORS.different}`}></span>
                <span>Different</span>
            </div>

            {/* Separator */}
            <div className="h-4 w-px bg-slate-300"></div>

            {/* Specific change type indicators */}
            <div className="flex items-center gap-1.5 opacity-75">
                <span className={`w-2.5 h-2.5 rounded border ${LEGEND_COLORS.attrChanged}`}></span>
                <span>Attr Changed</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-75">
                <span className={`w-2.5 h-2.5 rounded border ${LEGEND_COLORS.textChanged}`}></span>
                <span>Text Changed</span>
            </div>
        </div>
    );
}
