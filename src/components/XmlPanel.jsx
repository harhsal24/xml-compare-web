/**
 * XmlPanel Component
 * Panel for XML input (text/file) and tree visualization
 */

import { useRef, useState } from 'react';
import XmlTreeNode from './XmlTreeNode';
import XmlSyntaxView from './XmlSyntaxView';
import useXmlStore from '../store/useXmlStore';
import { useToast } from './Toast';

export default function XmlPanel({ side, title, headerControls, syncViewMode, onViewModeChange, scrollRef }) {
    const fileInputRef = useRef(null);
    const [localViewMode, setLocalViewMode] = useState('tree'); // 'text' or 'tree'
    const { addToast } = useToast();

    // Use synced view mode if provided, otherwise use local
    const viewMode = syncViewMode !== undefined ? syncViewMode : localViewMode;

    const handleViewModeChange = (mode) => {
        if (onViewModeChange) {
            onViewModeChange(mode);
        } else {
            setLocalViewMode(mode);
        }
    };

    const {
        leftXml, rightXml,
        leftTree, rightTree,
        leftError, rightError,
        setLeftXml, setRightXml,
        selectedXPath, fontSize, isZenMode,
        setLastFocusedSide
    } = useXmlStore();

    const xml = side === 'left' ? leftXml : rightXml;
    const tree = side === 'left' ? leftTree : rightTree;
    const error = side === 'left' ? leftError : rightError;
    const setXml = side === 'left' ? setLeftXml : setRightXml;

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // In Electron (and some browsers), file.path gives the full path
                // Otherwise we just use the name
                setXml(event.target.result, {
                    name: file.name,
                    path: file.path || ''
                });
                handleViewModeChange('tree');
            };
            reader.readAsText(file);
            // Reset input so same file can be selected again
            e.target.value = '';
        }
    };

    const handleNativeUpload = async () => {
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.openFileDialog();
                if (result) {
                    const { filePath, content } = result;
                    // Extract filename from path
                    const name = filePath.split(/[/\\]/).pop();
                    setXml(content, { name, path: filePath });
                    handleViewModeChange('tree');
                }
            } catch (err) {
                console.error('File open error:', err);
                addToast('Failed to open file', 'error');
            }
        }
    };

    const handleClear = () => {
        setXml('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        handleViewModeChange('text'); // Switch to text view on clear
    };

    return (
        <div
            className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
            onClick={() => setLastFocusedSide(side)}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-700 h-14 shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                    {/* Hide title in Zen mode */}
                    {!isZenMode && (
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2 shrink-0">
                            <span className="text-xl">📄</span>
                            {title}
                        </h2>
                    )}

                    {/* Header Controls (Legend, Nav, etc.) */}
                    {headerControls && (
                        <div className="flex items-center gap-2 ml-2 overflow-x-auto scrollbar-none">
                            {headerControls}
                        </div>
                    )}
                </div>

                {/* View Toggle - Hide on right panel in Zen mode (views are synced) */}
                {!(isZenMode && side === 'right') && (
                    <div className="flex bg-slate-900/50 rounded-lg p-0.5 border border-slate-600/50 shrink-0">
                        <button
                            onClick={() => handleViewModeChange('text')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'text'
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                                }`}
                            title="Text View"
                        >
                            📝 Text
                        </button>
                        <button
                            onClick={() => handleViewModeChange('tree')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'tree'
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                                }`}
                            title="Tree View"
                        >
                            🌳 Tree
                        </button>
                        <button
                            onClick={() => handleViewModeChange('view')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'view'
                                ? 'bg-blue-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                                }`}
                            title="Read-Only View"
                        >
                            👁️ View
                        </button>
                    </div>
                )}

                {/* Actions - Upload always visible, Clear hidden in Zen mode */}
                <div className="flex items-center gap-2 shrink-0">
                    {window.electronAPI ? (
                        <button
                            onClick={handleNativeUpload}
                            className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
                            title="Open XML file"
                        >
                            📁
                        </button>
                    ) : (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xml"
                                onChange={handleFileUpload}
                                className="hidden"
                                id={`file-upload-${side}`}
                            />
                            <label
                                htmlFor={`file-upload-${side}`}
                                className="px-2 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
                                title="Upload XML file"
                            >
                                📁
                            </label>
                        </>
                    )}
                    {!isZenMode && (
                        <button
                            onClick={handleClear}
                            className="px-2 py-1 bg-slate-600/50 text-white rounded text-xs font-medium hover:bg-red-500/80 transition-colors"
                            title="Clear"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>


            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">

                {/* Error Display (Always show if error) */}
                {error && (
                    <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Text View */}
                {viewMode === 'text' && (
                    <textarea
                        ref={scrollRef}
                        value={xml}
                        onChange={(e) => setXml(e.target.value)}
                        placeholder="Paste XML here or upload a file..."
                        className="flex-1 w-full p-4 font-mono bg-slate-50 resize-none focus:outline-none focus:bg-white transition-colors text-slate-800 leading-relaxed overflow-auto"
                        style={{ fontSize: `${fontSize}px` }}
                        spellCheck={false}
                    />
                )}

                {/* Tree View */}
                {viewMode === 'tree' && (
                    <div
                        ref={scrollRef}
                        className="flex-1 bg-gradient-to-b from-slate-50 to-white relative min-h-0 overflow-auto p-4"
                    >
                        {tree ? (
                            <XmlTreeNode node={tree} side={side} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 p-4">
                                <div className="text-4xl opacity-20">🌳</div>
                                <p>No XML parsed yet.</p>
                                <button
                                    onClick={() => setViewMode('text')}
                                    className="text-blue-500 hover:underline text-sm"
                                >
                                    Switch to Text View to paste XML
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Read-Only View */}
                {viewMode === 'view' && (
                    <div ref={scrollRef} className="flex-1 overflow-auto">
                        <XmlSyntaxView tree={tree} side={side} />
                    </div>
                )}

                {/* XPath Display (Floating Footer) - Click to copy */}
                {selectedXPath && tree && viewMode === 'tree' && (
                    <div
                        className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-slate-800/95 backdrop-blur text-slate-200 text-xs font-mono border-t border-slate-700 shadow-lg z-20 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent cursor-pointer hover:bg-slate-700/95 transition-colors"
                        onClick={() => {
                            navigator.clipboard.writeText(selectedXPath);
                            addToast(`Copied XPath: ${selectedXPath}`);
                        }}
                        title="Click to copy XPath"
                    >
                        <span className="text-slate-400 font-semibold select-none mr-2">XPath:</span><span className="text-emerald-400">{selectedXPath}</span>
                        <span className="ml-2 text-slate-500 text-[10px]">(click to copy)</span>
                    </div>
                )}
            </div>
        </div >
    );
}
