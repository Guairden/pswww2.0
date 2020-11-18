const { app, BrowserWindow } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.webContents.setZoomFactor(1.0); 
  
  // Upper Limit is working of 500 % 
  win.webContents 
      .setVisualZoomLevelLimits(1, 5) 
      .then(console.log("Zoom Levels Have been Set between 100% and 500%")) 
      .catch((err) => console.log(err)); 
    
  win.webContents.on("zoom-changed", (event, zoomDirection) => { 
      console.log(zoomDirection); 
      var currentZoom = win.webContents.getZoomFactor(); 
      console.log("Current Zoom Factor - ", currentZoom); 
      console.log('Current Zoom Level at - ', win.webContents.getZoomLevel()); 
    
      if (zoomDirection === "in") { 
          
          win.webContents.setZoomFactor(currentZoom + 0.20);
    
          console.log("Zoom Factor Increased to - "
                      , win.webContents.zoomFactor * 100, "%"); 
      } 
      if (zoomDirection === "out") { 
          if(win.webContents.zoomFactor > 0.2)
            win.webContents.setZoomFactor(currentZoom - 0.20);
    
          console.log("Zoom Factor Decreased to - "
                      , win.webContents.zoomFactor * 100, "%"); 
      } 
  });

  win.loadFile('./html/index.html')
  win.webContents.openDevTools()
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})