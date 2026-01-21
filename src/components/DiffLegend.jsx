/**
 * DiffLegend Component
 * Shows the color coding for the comparison results
 */

import { LEGEND_COLORS } from '../utils/colorConfig';

export default function DiffLegend() {
    return (
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-medium text-slate-600 flex-wrap">
            {/* Node-level status indicators */}
            <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${LEGEND_COLORS.matched}`}></span>
                <span>Matched</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${LEGEND_COLORS.extra}`}></span>
                <span>Extra</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${LEGEND_COLORS.different}`}></span>
                <span>Different</span>
            </div>

            {/* Separator */}
            <div className="h-4 w-px bg-slate-300"></div>

            {/* Specific change type indicators */}
            <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded border ${LEGEND_COLORS.attrChanged}`}></span>
                <span>Attr Changed</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded border ${LEGEND_COLORS.textChanged}`}></span>
                <span>Text Changed</span>
            </div>
        </div>
    );
}
