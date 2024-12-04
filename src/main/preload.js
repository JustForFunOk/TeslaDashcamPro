const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    resizeWindow: (videoWidth, videoHeight, extraWidth, extraHeight) => ipcRenderer.invoke('resize-window', videoWidth, videoHeight, extraWidth, extraHeight),
});
