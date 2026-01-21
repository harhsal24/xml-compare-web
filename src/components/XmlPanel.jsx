/**
 * XmlPanel Component
 * Panel for XML input (text/file) and tree visualization
 */

import { useRef, useState } from 'react';
import XmlTreeNode from './XmlTreeNode';
import useXmlStore from '../store/useXmlStore';

export default function XmlPanel({ side, title }) {
    const fileInputRef = useRef(null);
    const [viewMode, setViewMode] = useState('tree'); // 'text' or 'tree'

    const {
        leftXml, rightXml,
        leftTree, rightTree,
        leftError, rightError,
        setLeftXml, setRightXml,
        selectedXPath
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
                setXml(event.target.result);
                setViewMode('tree'); // Switch to tree view on upload
            };
            reader.readAsText(file);
        }
    };

    const handleClear = () => {
        setXml('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setViewMode('text'); // Switch to text view on clear
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-700">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="text-xl">📄</span>
                        {title}
                    </h2>

                    {/* View Toggle */}
                    <div className="flex bg-slate-900/50 rounded-lg p-0.5 border border-slate-600/50">
                        <button
                            onClick={() => setViewMode('text')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'text'
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                            title="Text View"
                        >
                            📝 Text
                        </button>
                        <button
                            onClick={() => setViewMode('tree')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'tree'
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                            title="Tree View"
                        >
                            🌳 Tree
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
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
                        className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors flex items-center gap-1"
                    >
                        <span>📁</span> <span className="hidden sm:inline">Upload</span>
                    </label>
                    <button
                        onClick={handleClear}
                        className="px-3 py-1.5 bg-slate-600/50 text-white rounded-lg text-sm font-medium hover:bg-red-500/80 transition-colors"
                    >
                        Clear
                    </button>
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
                        value={xml}
                        onChange={(e) => setXml(e.target.value)}
                        placeholder="Paste XML here or upload a file..."
                        className="flex-1 w-full p-4 text-sm font-mono bg-slate-50 resize-none focus:outline-none focus:bg-white transition-colors text-slate-800 leading-relaxed"
                        spellCheck={false}
                    />
                )}

                {/* Tree View */}
                {viewMode === 'tree' && (
                    <div className="flex-1 p-4 overflow-auto bg-gradient-to-b from-slate-50 to-white">
                        {tree ? (
                            <XmlTreeNode node={tree} side={side} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
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

                {/* XPath Display (Floating Footer) */}
                {selectedXPath && tree && viewMode === 'tree' && (
                    <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-slate-800/95 backdrop-blur text-slate-200 text-xs font-mono border-t border-slate-700 shadow-lg z-20">
                        <span className="text-slate-400 font-semibold select-none">XPath:</span> <span className="text-emerald-400">{selectedXPath}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
