const { ipcRenderer, remote } = require('electron');

document.addEventListener('keypress', function (e) {
    if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById('submit').click();
    }
});

document.getElementById('submit').addEventListener('click', function () {
  let pid = document.getElementById('process-id').value;
  let processFocus = null;

  if ( processFocus = getProcessById(pid) ) {
    ipcRenderer.send('setProcessFocus', processFocus);
    ipcRenderer.send('closeWindowModal', true);
  } else {
    window.alert("Process not found.");
  }
});
