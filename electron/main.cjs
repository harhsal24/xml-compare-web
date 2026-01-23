/**
 * Electron Main Process
 * 
 * This file handles:
 * - Creating the main application window
 * - File watching for external changes (like VS Code)
 * - IPC communication with renderer
 * - Native Application Menu
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

// Track watched files
const fileWatchers = new Map();

let mainWindow;

const isDev = process.env.NODE_ENV === 'development';
const isMac = process.platform === 'darwin';

function createMenu() {
    const template = [
        // { role: 'appMenu' }
        ...(isMac
            ? [{
                label: app.name,
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideOthers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            }]
            : []),
        // { role: 'fileMenu' }
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open File...',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        if (mainWindow) {
                            const result = await dialog.showOpenDialog(mainWindow, {
                                properties: ['openFile'],
                                filters: [
                                    { name: 'XML Files', extensions: ['xml'] },
                                    { name: 'All Files', extensions: ['*'] },
                                ],
                            });

                            if (!result.canceled && result.filePaths.length > 0) {
                                mainWindow.webContents.send('menu:open-file', result.filePaths[0]);
                            }
                        }
                    }
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        // { role: 'editMenu' }
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac
                    ? [
                        { role: 'pasteAndMatchStyle' },
                        { role: 'delete' },
                        { role: 'selectAll' },
                        { type: 'separator' },
                        {
                            label: 'Speech',
                            submenu: [
                                { role: 'startSpeaking' },
                                { role: 'stopSpeaking' }
                            ]
                        }
                    ]
                    : [
                        { role: 'delete' },
                        { type: 'separator' },
                        { role: 'selectAll' }
                    ])
            ]
        },
        // { role: 'viewMenu' }
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        // { role: 'windowMenu' }
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac
                    ? [
                        { type: 'separator' },
                        { role: 'front' },
                        { type: 'separator' },
                        { role: 'window' }
                    ]
                    : [
                        { role: 'close' }
                    ])
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click: async () => {
                        await shell.openExternal('https://github.com');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        title: 'XML Compare',
        icon: path.join(__dirname, '../public/vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    createMenu();

    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
        // Stop all file watchers when window closes
        stopAllWatchers();
    });
}

// File watching functions
function watchFile(filePath) {
    if (fileWatchers.has(filePath)) {
        return; // Already watching
    }

    const watcher = chokidar.watch(filePath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100,
        },
    });

    watcher.on('change', async () => {
        console.log(`File changed externally: ${filePath}`);
        // Read the new content
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('file-changed', { filePath, content });
            }
        } catch (err) {
            console.error(`Error reading changed file: ${err.message}`);
        }
    });

    watcher.on('unlink', () => {
        console.log(`File deleted: ${filePath}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('file-deleted', { filePath });
        }
        unwatchFile(filePath);
    });

    fileWatchers.set(filePath, watcher);
    console.log(`Started watching: ${filePath}`);
}

function unwatchFile(filePath) {
    const watcher = fileWatchers.get(filePath);
    if (watcher) {
        watcher.close();
        fileWatchers.delete(filePath);
        console.log(`Stopped watching: ${filePath}`);
    }
}

function stopAllWatchers() {
    for (const [filePath, watcher] of fileWatchers) {
        watcher.close();
        console.log(`Stopped watching: ${filePath}`);
    }
    fileWatchers.clear();
}

// IPC Handlers
ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'XML Files', extensions: ['xml'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            return { filePath, content };
        } catch (err) {
            console.error('Failed to read file:', err);
            return null;
        }
    }
    return null;
});

ipcMain.handle('file:read', async (event, filePath) => {
    try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return { success: true, content };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.on('file:watch', (event, filePath) => {
    watchFile(filePath);
});

ipcMain.on('file:unwatch', (event, filePath) => {
    unwatchFile(filePath);
});

ipcMain.on('file:unwatchAll', () => {
    stopAllWatchers();
});

// App lifecycle
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    stopAllWatchers();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
