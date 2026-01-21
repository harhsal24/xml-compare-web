/**
 * CompareView Component
 * Main layout with resizable side-by-side panels and comparison controls
 */

import { useState, useRef, useEffect } from 'react';
import XmlPanel from './XmlPanel';
import DiffLegend from './DiffLegend';
import useXmlStore from '../store/useXmlStore';

export default function CompareView() {
    const {
        leftTree, rightTree, diffResults,
        compare, clear, cycleDiff, activeCategory,
        fontSize, setFontSize, isZenMode, toggleZenMode
    } = useXmlStore();

    const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Percentage
    const containerRef = useRef(null);
    const isDragging = useRef(false);

    const canCompare = leftTree && rightTree;

    // Handle Dragging for Resizing
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging.current || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

            // Constrain between 20% and 80%
            if (newLeftWidth >= 20 && newLeftWidth <= 80) {
                setLeftPanelWidth(newLeftWidth);
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto'; // Re-enable selection
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startDrag = () => {
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none'; // Disable selection while dragging
    };

    return (
        <div className={`flex flex-col h-full gap-4 ${isZenMode ? 'p-2 h-screen' : ''}`}>
            {/* Action Bar - Hide in Zen Mode unless hovered or minimal? Actually user said "purely UI no drop down", so maybe hide completely or show small trigger */}
            {!isZenMode && (
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <DiffLegend />

                    <div className="flex items-center gap-4">
                        {/* View Controls */}
                        <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-600/30">
                            <span className="text-slate-400 text-xs font-semibold px-2">SIZE</span>
                            <button
                                onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                                A-
                            </button>
                            <span className="text-white font-mono text-sm w-8 text-center">{fontSize}</span>
                            <button
                                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                                A+
                            </button>
                        </div>

                        <div className="h-8 w-px bg-slate-700 mx-2"></div>

                        <button
                            onClick={toggleZenMode}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-600"
                            title="Zen Mode (Focus View)"
                        >
                            <span>🖥️</span>
                            <span className="text-sm font-medium">Zen Mode</span>
                        </button>

                        <div className="flex gap-3 ml-2">
                            <button
                                onClick={compare}
                                disabled={!canCompare}
                                className={`
                  px-5 py-2 rounded-xl font-semibold text-white shadow-lg
                  transition-all duration-200 flex items-center gap-2
                  ${canCompare
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5'
                                        : 'bg-slate-500/50 cursor-not-allowed opacity-70'
                                    }
                `}
                            >
                                <span className="text-lg">🔍</span>
                                Compare
                            </button>

                            <button
                                onClick={clear}
                                className="px-4 py-2 rounded-xl font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Zen Mode Exit Button (Only in Zen Mode) */}
            {isZenMode && (
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur text-white p-1 rounded-lg shadow-xl border border-slate-700">
                        <button
                            onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700"
                        >
                            -
                        </button>
                        <span className="font-mono text-sm w-6 text-center">{fontSize}</span>
                        <button
                            onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700"
                        >
                            +
                        </button>
                        <div className="w-px h-4 bg-slate-700 mx-1"></div>
                        <button
                            onClick={toggleZenMode}
                            className="px-3 py-1.5 rounded bg-red-500 hover:bg-red-600 text-xs font-bold transition-colors"
                        >
                            EXIT ZEN
                        </button>
                    </div>
                </div>
            )}

            {/* Statistics & Navigation (Hide in Zen Mode? User said "purely UI", maybe keep matches?) 
                Let's keep it but make it more compact or hide if user wants "pure". 
                For now, I'll hide it in Zen Mode to match "purely UI no drop down".
             */}
            {!isZenMode && diffResults && (
                <div className="flex flex-wrap gap-3 justify-center p-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white backdrop-blur-sm">
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
                </div>
            )}

            {/* Resizable Side-by-side Panels */}
            {/* We use specific width logic instead of grid */}
            <div
                ref={containerRef}
                className={`flex-1 flex flex-row min-h-0 relative ${isZenMode ? 'gap-0' : 'gap-0'} w-full overflow-hidden`}
            >
                {/* Left Panel */}
                <div style={{ width: `${leftPanelWidth}%` }} className="flex flex-col min-w-[20%]">
                    <XmlPanel side="left" title="Left XML" isZenMode={isZenMode} />
                </div>

                {/* Resizer Handle */}
                <div
                    onMouseDown={startDrag}
                    className={`
                        w-1.5 hover:w-3 z-10 -ml-0.5 -mr-0.5 cursor-col-resize flex flex-col justify-center items-center group
                        transition-all duration-150 select-none
                    `}
                >
                    <div className="w-0.5 h-full bg-slate-600 group-hover:bg-blue-500 transition-colors"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-4 h-8 bg-slate-700 rounded flex items-center justify-center border border-slate-500">
                            <span className="text-white text-[10px]">||</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="flex-1 flex flex-col min-w-[20%]">
                    <XmlPanel side="right" title="Right XML" isZenMode={isZenMode} />
                </div>
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
