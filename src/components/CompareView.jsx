/**
 * CompareView Component
 * Main layout with side-by-side panels and comparison controls
 */

import XmlPanel from './XmlPanel';
import DiffLegend from './DiffLegend';
import useXmlStore from '../store/useXmlStore';

export default function CompareView() {
    const {
        leftTree, rightTree, diffResults,
        compare, clear, cycleDiff, activeCategory
    } = useXmlStore();

    const canCompare = leftTree && rightTree;

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Action Bar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <DiffLegend />

                <div className="flex gap-3">
                    <button
                        onClick={compare}
                        disabled={!canCompare}
                        className={`
              px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg
              transition-all duration-200 flex items-center gap-2
              ${canCompare
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5'
                                : 'bg-slate-400 cursor-not-allowed'
                            }
            `}
                    >
                        <span className="text-xl">🔍</span>
                        Compare XML
                    </button>

                    <button
                        onClick={clear}
                        className="px-4 py-2.5 rounded-xl font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            {/* Statistics & Navigation */}
            {diffResults && (
                <div className="flex flex-wrap gap-3 justify-center p-3 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl text-white">
                    <div className="flex items-center gap-3 px-3 border-r border-slate-600/50">
                        <StatBadge label="Total Left" value={diffResults.stats.totalLeft} color="blue" />
                        <StatBadge label="Total Right" value={diffResults.stats.totalRight} color="blue" />
                    </div>

                    <div className="flex items-center gap-3">
                        <StatButton
                            label="Matched"
                            value={diffResults.stats.matched}
                            color="green"
                            onClick={() => cycleDiff('matched')}
                            isActive={activeCategory === 'matched'}
                            icon="✓"
                        />
                        <StatButton
                            label="Left Only"
                            value={diffResults.stats.leftOnly}
                            color="amber"
                            onClick={() => cycleDiff('leftOnly')}
                            isActive={activeCategory === 'leftOnly'}
                            icon="←"
                        />
                        <StatButton
                            label="Right Only"
                            value={diffResults.stats.rightOnly}
                            color="amber"
                            onClick={() => cycleDiff('rightOnly')}
                            isActive={activeCategory === 'rightOnly'}
                            icon="→"
                        />
                        <StatButton
                            label="Different"
                            value={diffResults.stats.different}
                            color="purple"
                            onClick={() => cycleDiff('different')}
                            isActive={activeCategory === 'different'}
                            icon="≠"
                        />
                    </div>

                    <div className="text-xs text-slate-400 flex items-center ml-2 italic">
                        👆 Click badges to cycle through elements
                    </div>
                </div>
            )}

            {/* Side-by-side Panels */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
                <XmlPanel side="left" title="Left XML" />
                <XmlPanel side="right" title="Right XML" />
            </div>
        </div>
    );
}

function StatBadge({ label, value, color }) {
    const colorMap = {
        blue: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
    };

    return (
        <div className={`px-3 py-1.5 rounded-lg border ${colorMap[color]} text-center`}>
            <div className="text-xl font-bold leading-none">{value}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70 mt-0.5">{label}</div>
        </div>
    );
}

function StatButton({ label, value, color, onClick, isActive, icon }) {
    const colorMap = {
        green: isActive
            ? 'bg-green-500 text-white border-green-400 ring-2 ring-green-400/50'
            : 'bg-green-500/10 text-green-300 border-green-500/20 hover:bg-green-500/20',

        amber: isActive
            ? 'bg-amber-500 text-white border-amber-400 ring-2 ring-amber-400/50'
            : 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20',

        purple: isActive
            ? 'bg-purple-500 text-white border-purple-400 ring-2 ring-purple-400/50'
            : 'bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20',
    };

    return (
        <button
            onClick={onClick}
            disabled={value === 0}
            className={`
        relative group px-4 py-2 rounded-lg border transition-all duration-200
        flex flex-col items-center justify-center min-w-[90px]
        ${value === 0 ? 'opacity-50 cursor-not-allowed bg-slate-800/50 border-slate-700 text-slate-500' : 'cursor-pointer active:scale-95'}
        ${value > 0 ? colorMap[color] : ''}
      `}
        >
            <div className="flex items-center gap-1.5">
                <span className="text-lg">{icon}</span>
                <span className="text-xl font-bold leading-none">{value}</span>
            </div>
            <div className={`text-[10px] uppercase tracking-wider mt-0.5 ${isActive ? 'text-white/90' : 'opacity-70'}`}>
                {label}
            </div>

            {value > 0 && !isActive && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color === 'green' ? 'bg-green-400' : color === 'amber' ? 'bg-amber-400' : 'bg-purple-400'
                        }`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color === 'green' ? 'bg-green-500' : color === 'amber' ? 'bg-amber-500' : 'bg-purple-500'
                        }`}></span>
                </span>
            )}
        </button>
    );
}
