const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('electronAPI', {
  upload: () => ipcRenderer.invoke('dialog:upload'),
  downloadFile: (file) => ipcRenderer.invoke('dialog:downloadFile'),
  pauseFile: (file) => ipcRenderer.invoke('dialog:pauseFile'),
  resumeFile: (file) => ipcRenderer.invoke('dialog:resumeFile'),
  removeSeed: (file) => ipcRenderer.invoke('dialog:removeSeed'),
  dataRetrival: (callback) => ipcRenderer.on('dataRetrivial', (callback)),
})