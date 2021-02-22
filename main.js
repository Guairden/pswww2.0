const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const isMac = process.platform === 'darwin'
const io = require('socket.io-client');
const socket = io('http://localhost:3000');
const fs = require('fs');
let focusedProcess = null;
let parseString = require('xml2js').parseString;
let mainWindow;

setSocketHandler();
setGlobalVariables();
setMenu();
setAppHandler();
app.whenReady().then( () => {
  mainWindow = createWindow(800, 600, './html/index.html', true)
});

function createWindow (width, height, filePath, frame) {
  const win = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    },
    frame: frame
  })

  win.loadFile(filePath)
  return win;
}

function setAppHandler() { 
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  ipcMain.on('hwloc-bind', (event, pid, runner) => {
    new Promise((resolve, reject) => {
      socket.emit('hwloc-bind', pid, runner, (err, response) => {
        if (err)
          return reject(err);
        else
          return resolve(response);
      });
    }).then((response) => {
      event.returnValue = response;
      socket.emit('hwloc-ps', '-a -t ' + (focusedProcess ? '--pid ' + focusedProcess : ''));
    }).catch((error) => {
      console.error(error, 'Promise error');
      event.returnValue = false;
    });
  });

  ipcMain.on('hwloc-bind-thread', (event, tid, runner) => {
    new Promise((resolve, reject) => {
      socket.emit('hwloc-bind-thread', tid, runner, (err, response) => {
        if (err)
          return reject(err);
        else
          return resolve(response);
      });
    }).then((response) => {
      event.returnValue = response;
      socket.emit('hwloc-ps', '-a -t ' + (focusedProcess ? '--pid ' + focusedProcess : ''));
    }).catch((error) => {
      console.error(error, 'Promise error');
      event.returnValue = false;
    });
  });

  ipcMain.on('setProcesseFocus', (event, process) => {
    setProcesseFocus(process);
    mainWindow.reload();
  });

  ipcMain.on('closeWindowModal', (event) => {
    closeWindowModal();
  });
}

function setSocketHandler() {
  socket.on('set_svg', (msg) => {
    fs.writeFile('./img/foo.svg', msg, function (err,data) {
      if (err) {
        return console.log(err);
      }
      console.log(data);
    });
  });

  socket.on('set_xml', (msg) => {
    console.log(msg)
    parseString(msg, function (err, result) {
      global.xml = JSON.parse(JSON.stringify(result));
    });
  });

  socket.on('hwloc-ps', (msg) => {
    console.log(msg)
    global.processes = msg;
  });
}

function setGlobalVariables() {
  socket.emit('get_xml', '');
  socket.emit('get_svg', '');
  socket.emit('hwloc-ps', '-a -t');
}

function setMenu() {
  const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
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
        ...(isMac ? [
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
        ] : [
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
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
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
            const { shell } = require('electron')
            await shell.openExternal('https://electronjs.org')
          }
        }
      ]
    },
    {
      label: 'Options',
      submenu: [
        {
          label: 'Threads',
          type: 'checkbox',
          click: (item) => {
            if ( item.checked ) {
              global.showThreads = true;
              mainWindow.reload();
            } else {
              global.showThreads = false;
              mainWindow.reload();
            }
          }
        },
        {
          label: 'Processes',
          type: 'checkbox',
          checked: true,
          click: (item) => {
            if ( item.checked ) {
              global.showProcesses = true;
              mainWindow.reload();
            } else {
              global.showProcesses = false;
              mainWindow.reload();
            }
          }
        },
        {
          id : 'process-focus',
          label: 'Process focus',
          type: 'checkbox',
          checked: false,
          click: (item) => {
            if ( item.checked ) {
              global.windowModal = createWindow(400, 200, './html/process-focus.html', false);
            } else {
              focusedProcess = null;
              socket.emit('hwloc-ps', '-a -t');
              mainWindow.reload();
            }
              
          }
        },
        {
          id : 'mpi-mode',
          label: 'mpi mode',
          type: 'checkbox',
          checked: false,
          click: (item) => {
            if ( item.checked ) {
              socket.emit('hwloc-ps', '--pid-cmd ./get-mpi-rank.sh');
              global.mpiMode = true;
              mainWindow.reload();
            } else {
              socket.emit('hwloc-ps', '-a -t');
              global.mpiMode = false;
              mainWindow.reload();
            }
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function setProcesseFocus(process) {
  let processesObject = { processes: new Array() }

  processesObject.processes.push(process)
  global.processes = processesObject;
  focusedProcess = process.PID;
}

function closeWindowModal() {
  if ( !focusedProcess )
    Menu.getApplicationMenu().getMenuItemById('process-focus').checked = false;

  windowModal.close();
  global.windowModal = null;
}