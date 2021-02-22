const { ipcRenderer, remote } = require('electron');

document.getElementById('submit').addEventListener('click', function (e) {
  let pid = document.getElementById('process-id').value;
  let processFocus = null;

  if ( processFocus = getProcessById(pid) ) {
    ipcRenderer.send('setProcesseFocus', processFocus);
    ipcRenderer.send('closeWindowModal');
  } else {
    window.alert("Process not found.");
  }
});