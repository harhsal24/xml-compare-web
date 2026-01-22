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
        leftTree, rightTree, diffResults, isComparing,
        compare, clear, activeCategory, navigateDiff,
        fontSize, setFontSize, isZenMode, toggleZenMode,
        showBorders, toggleBorders,
        toggleLeafDots, showLeafDots, toggleStatusBadges, showStatusBadges
    } = useXmlStore();

    const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Percentage
    const [syncedViewMode, setSyncedViewMode] = useState('tree'); // Synced view mode for Zen mode
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

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!activeCategory) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                navigateDiff(activeCategory, 'next');
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                navigateDiff(activeCategory, 'prev');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeCategory, navigateDiff]);

    const startDrag = () => {
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none'; // Disable selection while dragging
    };

    // Navigation Controls Component
    const NavControls = () => (
        <div className="flex items-center gap-0.5 shrink-0">
            <button
                onClick={() => navigateDiff(activeCategory, 'prev')}
                className="w-7 h-7 flex items-center justify-center rounded bg-slate-600 hover:bg-slate-500 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous Change (Up Arrow)"
                disabled={!activeCategory}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
            </button>
            <button
                onClick={() => navigateDiff(activeCategory, 'next')}
                className="w-7 h-7 flex items-center justify-center rounded bg-slate-600 hover:bg-slate-500 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next Change (Down Arrow)"
                disabled={!activeCategory}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
        </div>
    );

    // Settings Controls Component (for Zen mode)
    const SettingsControls = () => (
        <div className="flex items-center gap-1 shrink-0">
            {/* Compare Button */}
            <button
                onClick={compare}
                disabled={isComparing}
                className={`px-3 py-1 rounded font-semibold text-white text-xs transition-all flex items-center gap-1 ${isComparing
                    ? 'bg-slate-500/50 cursor-not-allowed opacity-70'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    }`}
                title="Compare XMLs"
            >
                {isComparing ? '...' : '🔍 Compare'}
            </button>

            <div className="w-px h-4 bg-slate-600 mx-1"></div>

            {/* Font Size Controls */}
            <button
                onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                className="w-6 h-6 flex items-center justify-center rounded bg-slate-600 hover:bg-slate-500 text-white text-xs transition-colors"
                title="Decrease font size"
            >
                A-
            </button>
            <span className="font-mono text-xs w-5 text-center text-slate-300">{fontSize}</span>
            <button
                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                className="w-6 h-6 flex items-center justify-center rounded bg-slate-600 hover:bg-slate-500 text-white text-xs transition-colors"
                title="Increase font size"
            >
                A+
            </button>

            <div className="w-px h-4 bg-slate-600 mx-1"></div>

            {/* Visual Toggles */}
            <button
                onClick={toggleBorders}
                className={`w-6 h-6 flex items-center justify-center rounded bg-slate-600 hover:bg-slate-500 text-white text-xs transition-colors ${!showBorders && 'opacity-50'}`}
                title="Toggle Borders"
            >
                B
            </button>
            <button
                onClick={toggleLeafDots}
                className={`w-6 h-6 flex items-center justify-center rounded bg-slate-600 hover:bg-slate-500 text-white text-xs transition-colors ${!showLeafDots && 'opacity-50'}`}
                title="Toggle Leaf Dots"
            >
                •
            </button>
            <button
                onClick={toggleStatusBadges}
                className={`w-6 h-6 flex items-center justify-center rounded bg-slate-600 hover:bg-slate-500 text-white text-xs transition-colors ${!showStatusBadges && 'opacity-50'}`}
                title="Toggle Status Badges"
            >
                🏷️
            </button>

            <div className="w-px h-4 bg-slate-600 mx-1"></div>

            {/* Exit Zen Mode */}
            <button
                onClick={toggleZenMode}
                className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors"
                title="Exit Zen Mode"
            >
                ✕
            </button>
        </div>
    );





    return (
        <div className={`flex flex-col h-full gap-4 ${isZenMode ? 'p-2 h-screen' : ''}`}>
            {/* Action Bar */}
            {!isZenMode && (
                <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* DiffLegend moved to Left Panel Header */}
                    <div className="flex items-center gap-4">
                        {/* Settings */}
                        <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-600/30">
                            <span className="text-slate-400 text-xs font-semibold px-2">SETTINGS</span>
                            <button
                                onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Decrease font size"
                            >
                                A-
                            </button>
                            <span className="text-white font-mono text-sm w-8 text-center">{fontSize}</span>
                            <button
                                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Increase font size"
                            >
                                A+
                            </button>
                            <button
                                onClick={toggleBorders}
                                className={`w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300 transition-colors ${!showBorders && 'opacity-50'}`}
                                title="Toggle Borders"
                            >
                                B
                            </button>
                            <div className="h-4 w-px bg-slate-700 mx-1"></div>
                            <button
                                onClick={toggleLeafDots}
                                className={`w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300 transition-colors ${!showLeafDots && 'opacity-50'}`}
                                title="Toggle Leaf Dots"
                            >
                                •
                            </button>
                            <button
                                onClick={toggleStatusBadges}
                                className={`w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700 text-slate-300 transition-colors ${!showStatusBadges && 'opacity-50'}`}
                                title="Toggle Status Badges"
                            >
                                🏷️
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
                                disabled={isComparing}
                                className={`
                  px-5 py-2 rounded-xl font-semibold text-white shadow-lg
                  transition-all duration-200 flex items-center gap-2
                  ${isComparing
                                        ? 'bg-slate-500/50 cursor-not-allowed opacity-70'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5'
                                    }
                `}
                            >
                                {isComparing ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        Comparing...
                                    </>
                                ) : (
                                    <>
                                        <span className="text-lg">🔍</span>
                                        Compare
                                    </>
                                )}
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

            {/* Zen Mode Legend - Floating Bottom Center */}
            {isZenMode && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
                    <div className="shadow-2xl rounded-xl overflow-hidden ring-1 ring-slate-900/10">
                        <DiffLegend />
                    </div>
                </div>
            )}

            {/* Panels Container */}
            <div
                ref={containerRef}
                className="flex-1 flex gap-0 min-h-0"
            >
                {/* Left Panel */}
                <div style={{ width: `${leftPanelWidth}%` }} className="min-w-0">
                    <XmlPanel
                        side="left"
                        title="Left"
                        headerControls={
                            <div className="flex items-center gap-2">
                                <DiffLegend compact />
                                <NavControls />
                            </div>
                        }
                        syncViewMode={isZenMode ? syncedViewMode : undefined}
                        onViewModeChange={isZenMode ? setSyncedViewMode : undefined}
                    />
                </div>

                {/* Resizer Handle */}
                <div
                    onMouseDown={startDrag}
                    className="w-2 bg-slate-700 hover:bg-blue-500 cursor-col-resize flex items-center justify-center transition-colors group"
                >
                    <div className="w-0.5 h-8 bg-slate-500 group-hover:bg-white rounded-full transition-colors"></div>
                </div>

                {/* Right Panel */}
                <div style={{ width: `${100 - leftPanelWidth}%` }} className="min-w-0">
                    <XmlPanel
                        side="right"
                        title="Right"
                        headerControls={isZenMode ? <SettingsControls /> : undefined}
                        syncViewMode={isZenMode ? syncedViewMode : undefined}
                        onViewModeChange={isZenMode ? setSyncedViewMode : undefined}
                    />
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

