const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    resizeWindow: (videoWidth, videoHeight, extraWidth, extraHeight) => ipcRenderer.invoke('resize-window', videoWidth, videoHeight, extraWidth, extraHeight),
    deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
    deleteParentFolder: (filePath) => ipcRenderer.invoke("delete-parent-folder", filePath),
    openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath),
    parseVideoSei: (filePath) => ipcRenderer.invoke('parse-video-sei', filePath),
});

contextBridge.exposeInMainWorld('logger', {
    info: (...args) => console.info(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => console.debug(...args),
    // 这里的 console 会被主进程的 log.initialize() 自动接管
});