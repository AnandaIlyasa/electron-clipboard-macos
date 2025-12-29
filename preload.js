const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clipboardAPI', {
  onHistoryUpdate: (callback) =>
    ipcRenderer.on('clipboard-history', (_, data) => callback(data)),

  pasteItem: (text) =>
    ipcRenderer.send('paste-item', text)
});
