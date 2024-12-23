const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    resizeWindow: (videoWidth, videoHeight, extraWidth, extraHeight) => ipcRenderer.invoke('resize-window', videoWidth, videoHeight, extraWidth, extraHeight),
    deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
    deleteParentFolder: (filePath) => ipcRenderer.invoke("delete-parent-folder", filePath),
    openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath),
});
