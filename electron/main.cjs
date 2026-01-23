/**
 * Electron Main Process
 * 
 * This file handles:
 * - Creating the main application window
 * - File watching for external changes (like VS Code)
 * - IPC communication with renderer
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

// Track watched files
const fileWatchers = new Map();

let mainWindow;

const isDev = process.env.NODE_ENV === 'development';

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

    watcher.on('change', () => {
        console.log(`File changed externally: ${filePath}`);
        // Read the new content
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
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
        const content = fs.readFileSync(filePath, 'utf-8');
        return { filePath, content };
    }
    return null;
});

ipcMain.handle('file:read', async (event, filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
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
