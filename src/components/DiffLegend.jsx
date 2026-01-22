/**
 * DiffLegend Component
 * Shows the color coding for the comparison results
 * Supports both full and compact modes
 */

import { LEGEND_COLORS } from '../utils/colorConfig';
import useXmlStore from '../store/useXmlStore';

export default function DiffLegend({ compact = false }) {
    const { activeCategory, navigateDiff } = useXmlStore();

    const handleLegendClick = (category) => {
        navigateDiff(category, 'next');
    };

    const getActiveClass = (category) => {
        const base = activeCategory === category
            ? 'ring-2 ring-blue-500 bg-blue-100'
            : 'hover:bg-white/20 cursor-pointer';
        return base;
    };

    // Compact mode - small circular badges with initials
    if (compact) {
        return (
            <div className="flex items-center gap-1">
                {/* Matched */}
                <button
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all ${getActiveClass('matched')} ${LEGEND_COLORS.matched}`}
                    onClick={() => handleLegendClick('matched')}
                    title="Matched - Click to navigate"
                >
                    M
                </button>
                {/* Extra */}
                <button
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all ${getActiveClass('extra')} ${LEGEND_COLORS.extra}`}
                    onClick={() => handleLegendClick('extra')}
                    title="Extra - Click to navigate"
                >
                    E
                </button>
                {/* Different */}
                <button
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all ${getActiveClass('different')} ${LEGEND_COLORS.different}`}
                    onClick={() => handleLegendClick('different')}
                    title="Different - Click to navigate"
                >
                    D
                </button>
            </div>
        );
    }

    // Full mode - with labels
    return (
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-medium text-slate-600 flex-wrap">
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
                title="Navigate Extra Nodes"
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

            <div className="h-4 w-px bg-slate-300"></div>

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
