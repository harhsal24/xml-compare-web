/**
 * DiffLegend Component
 * Shows the color coding for the comparison results
 */

export default function DiffLegend() {
    return (
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-medium text-slate-600 flex-wrap">
            {/* Node-level status indicators */}
            <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span>Matched</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Extra</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>Different</span>
            </div>

            {/* Separator */}
            <div className="h-4 w-px bg-slate-300"></div>

            {/* Specific change type indicators */}
            <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded border border-orange-400 bg-orange-100"></span>
                <span>Attr Changed</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded border border-cyan-400 bg-cyan-100"></span>
                <span>Text Changed</span>
            </div>
        </div>
    );
}
