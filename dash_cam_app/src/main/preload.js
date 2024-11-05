const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    resizeWindow: (width, height) => ipcRenderer.invoke('resize-window', width, height)
});
