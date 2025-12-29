const {
  app,
  BrowserWindow,
  globalShortcut,
  clipboard,
  ipcMain
} = require('electron');

const { exec } = require('child_process');
const path = require('path');

let win;
let clipboardHistory = [];
let lastText = '';
let suppressClipboard = false; // agar ketika proses paste, item yang ter paste tidak masuk ke clipboard history
let uiRefreshInterval = null;

function createWindow() {
  win = new BrowserWindow({
    width: 340,
    height: 400,
    show: false,
    resizable: false,
    // frame: false,
    minimizable: false,
    alwaysOnTop: true,
    fullscreenable: false,
    skipTaskbar: true,
    type: 'panel',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
  });
  
  win.on('hide', () => {
    win.setFocusable(true);
    if (uiRefreshInterval) {
      clearInterval(uiRefreshInterval);
    }
  });
  
  win.on('show', () => {
    if (uiRefreshInterval) {
      clearInterval(uiRefreshInterval);
    }

    uiRefreshInterval = setInterval(() => {
      if (win && win.isVisible()) {
        win.webContents.send('clipboard-history', clipboardHistory);
      }
    }, 200);
  });

  win.on('close', (event) => {
    if (uiRefreshInterval) {
      clearInterval(uiRefreshInterval);
    }

    event.preventDefault();
    win.hide();
  });
  
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  // agar app start running ketika komputer dinyalakan
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true
  });

  createWindow();

  globalShortcut.register('Command+Shift+V', () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.setFocusable(false);
      win.showInactive();
      win.moveTop();
      win.webContents.send('clipboard-history', clipboardHistory);
    }
  });

  setInterval(() => {
    if (suppressClipboard) return;

    const text = clipboard.readText();
    if (!text || text === lastText) return;

    lastText = text;
    clipboardHistory.unshift(text);
    clipboardHistory = clipboardHistory.slice(0, 20);
  }, 3000);
});

app.dock.hide();

ipcMain.on('paste-item', (_, text) => {
  suppressClipboard = true;

  clipboard.writeText(text);
  win.hide();

  setTimeout(() => {
    exec(
      `osascript -e 'tell application "System Events" to keystroke "v" using command down'`,
      (err) => {
        if (err) {
          console.error('Paste error:', err);
        } else {
          console.log('✅ Paste executed');
        }

        setTimeout(() => {
          lastText = text;
          suppressClipboard = false;
        }, 200);
      }
    );
  }, 100);
});

app.on('will-quit', () => {
  if (uiRefreshInterval) {
    clearInterval(uiRefreshInterval);
  }
  globalShortcut.unregisterAll();
});
