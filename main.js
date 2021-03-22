const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const isMac = process.platform === 'darwin'
const io = require('socket.io-client');
const socket = io('http://localhost:3000');
const fs = require('fs');
let focusedProcess = null;
let parseString = require('xml2js').parseString;
let mainWindow;

setMenu();
setSocketHandler();
setAppHandler();
setGlobalVariables();
app.whenReady().then( () => {
  mainWindow = createWindow(800, 600, './html/index.html', true)
});

function createWindow(width, height, filePath, frame) {
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
    console.log(pid, runner)
    new Promise((resolve, reject) => {
      socket.emit('hwloc-bind', pid, runner, (err, response) => {
        if (err)
          return reject(err);
        else
          return resolve(response);
      });
    }).then((response) => {
      event.returnValue = response;
      socket.emit('hwloc-ps', getPsArgs());
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
      socket.emit('hwloc-ps', getPsArgs() );
    }).catch((error) => {
      console.error(error, 'Promise error');
      event.returnValue = false;
    });
  });

  ipcMain.on('setProcessFocus', (event, process) => {
    setProcessFocus(process);
  });

  ipcMain.on('closeWindowModal', (event, reload) => {
    closeWindowModal();
    if ( reload )
      mainWindow.reload();
  });

  ipcMain.on('check-mpi-binding-error', (event) => {
    if ( error = IsMpiBindingWrong(global.processes) )
      mainWindow.webContents.send('mpi-binding-error', error);
    else
      mainWindow.webContents.send('mpi-binding-correct');
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

  socket.on('hwloc-ps', (msg, reload) => {
    console.log(msg)
    global.processes = getProcesses(msg.processes);
    if ( reload )
      mainWindow.reload();
  });
}

function setGlobalVariables() {
  socket.emit('get_xml', '');
  socket.emit('get_svg', '');
  socket.emit('hwloc-ps', getPsArgs(), true);
  global.showProcesses = true;
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
          id: 'threads',
          label: 'Threads',
          type: 'checkbox',
          click: (item) => {
            if ( item.checked ) {
              item.menu.getMenuItemById('mpi-mode').checked = false;
              global.showThreads = true;
              global.mpiMode = false;
              socket.emit('hwloc-ps', getPsArgs(), true);
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
              item.menu.getMenuItemById('threads').checked = true;
              global.showThreads = true;

              if (item.menu.getMenuItemById('mpi-mode').checked = true) {
                item.menu.getMenuItemById('mpi-mode').checked = false;
                global.mpiMode = false;
                socket.emit('hwloc-ps', getPsArgs(), false);
              }
              
              global.windowModal = createWindow(400, 200, './html/process-focus.html', false);
            } else {
              focusedProcess = null;
              socket.emit('hwloc-ps', getPsArgs(), true);
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
              item.menu.getMenuItemById('process-focus').checked = false;
              item.menu.getMenuItemById('threads').checked = false;
              focusedProcess = null;
              global.showThreads = false;
              global.mpiMode = true;
              socket.emit('hwloc-ps', getPsArgs(), true);
            } else {
              global.mpiMode = false;
              socket.emit('hwloc-ps', getPsArgs(), true);
            }
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function closeWindowModal() {
  if ( !focusedProcess )
    Menu.getApplicationMenu().getMenuItemById('process-focus').checked = false;
  
  windowModal.close();
  global.windowModal = null;
  
}

function getPsArgs() {
  if ( focusedProcess )
    return '-t --pid ' + focusedProcess;
  else if ( global.mpiMode )
    return '--pid-cmd ./get-mpi-rank.sh';
  else
    return '-a -t';
}


function getProcesses(processes) {
  let processesByObject = new Object();
  let processName = "";
  let error;

  for ( process of processes ) {
    processName = process.name;
    if ( processName.split(' ').length > 1 ) {
      processesByObject = setBindedThreadByRunner(processesByObject, process);
      processName = process.name.split(' ')[0];
    }

    let runnerId = processName.replace(':', '_') + '_rect';
    processesByObject = setProcessesByRunner(processesByObject, process, runnerId);
  }

  if ( global.mpiMode ) {
    if (  error = IsMpiBindingWrong(processesByObject) )
      mainWindow.webContents.send('mpi-binding-error', error);
    else
      mainWindow.webContents.send('mpi-binding-correct');
  }
    

  return processesByObject;
}

function setProcessesByRunner(processesByObject, process, runnerId) {
  if ( processesByObject && !processesByObject[runnerId] )
    processesByObject[runnerId] = new Array();

  processesByObject[runnerId].push(process);
  return processesByObject;
}

function setProcessFocus(process) {
  let processesObject = {}
  global.processes
  processName = process.name;
  if ( processName.split(' ').length > 1 ) {
    processName = process.name.split(' ')[0];
    processesObject[processName.replace(':', '_') + ('_rect')] = new Array(process);
    global.processes = processesObject;
    focusedProcess = process.PID;
    
    global.processes = setBindedThreadByRunner(global.processes, process);
  }

  processesObject[processName.replace(':', '_') + ('_rect')] = new Array(process)
  global.processes = processesObject;
  focusedProcess = process.PID;
}

function setBindedThreadByRunner(processesByObject, parentProcess) {
  for ( let thread of parentProcess.threads) {
    if ( parentProcess.name.split(' ').slice(1).includes(thread.name) ) {
      let runnerId = thread.name.replace(':', '_') + '_rect';
      thread.isBindedThread = true;
      processesByObject = setProcessesByRunner(processesByObject, thread, runnerId);
    }
  }
  return processesByObject;
}

function IsMpiBindingWrong(processesByRunner) {
  for (const runner in processesByRunner) {
    if ( processesByRunner[runner].length > 1 ) {
      let processesInfo = {ids: new Array(), mpiRanks: new Array()};
      for (process of processesByRunner[runner]) {
        processesInfo.ids.push(process.PID);
        processesInfo.mpiRanks.push(process.mpiRank);
      }

      return 'Multiple processes binded on ' + runner.toString().replace('_rect','').replace('_',':') 
        + '. Processes IDs are ' + processesInfo.ids.join(', ') 
        + ' and mpi ranks are ' + processesInfo.mpiRanks.join(', ') 
        + '. Circles might miss informations, please uncheck the mpi mode or fix this issue.'
        + ' You can still use this app to fix your binding.';
    }
      
  }

  return null;
}