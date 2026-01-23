/**
 * Electron Preload Script
 * 
 * Exposes secure APIs to the renderer process via contextBridge.
 * This enables the React app to:
 * - Open native file dialogs
 * - Watch files for external changes
 * - Receive file change notifications
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
    readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),

    // File watching
    watchFile: (filePath) => ipcRenderer.send('file:watch', filePath),
    unwatchFile: (filePath) => ipcRenderer.send('file:unwatch', filePath),
    unwatchAllFiles: () => ipcRenderer.send('file:unwatchAll'),

    // File change listeners
    onFileChanged: (callback) => {
        const handler = (event, data) => callback(data);
        ipcRenderer.on('file-changed', handler);
        return () => ipcRenderer.removeListener('file-changed', handler);
    },

    onFileDeleted: (callback) => {
        const handler = (event, data) => callback(data);
        ipcRenderer.on('file-deleted', handler);
        return () => ipcRenderer.removeListener('file-deleted', handler);
    },

    onMenuOpenFile: (callback) => {
        const handler = (event, filePath) => callback(filePath);
        ipcRenderer.on('menu:open-file', handler);
        return () => ipcRenderer.removeListener('menu:open-file', handler);
    },

    // Platform info
    isElectron: true,
    platform: process.platform,
});
