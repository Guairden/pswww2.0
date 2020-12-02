const { app, BrowserWindow, ipcMain } = require('electron')
const io = require('socket.io-client');
const fs = require('fs');
const socket = io('http://localhost:3000');
let parseString = require('xml2js').parseString;
let xml;

socket.emit('get_svg', '');
socket.on('set_svg', (msg) => {
  fs.writeFile('./img/foo.svg', msg, function (err,data) {
    if (err) {
      return console.log(err);
    }
    console.log(data);
  });
});

socket.emit('get_xml', '');
socket.on('set_xml', (msg) => {
  console.log(msg)
  parseString(msg, function (err, result) {
    global.xml = JSON.parse(JSON.stringify(result));
  });
});

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  })

  win.loadFile('./html/index.html')
  win.webContents.openDevTools()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('get_xml', async (event, arg) => {
  event.sender.send('set_xml', xml);
});
