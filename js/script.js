const { ipcRenderer, remote } = require('electron');
const svg = document.getElementById('lstopo');

svg.addEventListener('load', function (e) {
  const xml = remote.getGlobal('xml');
  const svgContent = svg.contentDocument;
  const svgRoot = svgContent.getElementsByTagName('svg').item(0);
  const boxes = svgContent.getElementsByTagName('rect');
  const texts = svgContent.getElementsByTagName('text');
  const bridges = svgContent.getElementsByTagName('line');

  getProcesses(svgRoot, drawBulletProcess);

  makeDraggable(svgRoot, svgContent);
  addStyle(svgRoot);

  svgContent.addEventListener('click', function () {
    let windowModal = null;
    if ( windowModal = remote.getGlobal('windowModal') )
      ipcRenderer.send('closeWindowModal');
  });

  for ( box of boxes ) {
    box.addEventListener('click', function (event) {
      showElementInfo(xml, svgContent, svgRoot, boxes, texts, bridges, event.target);
    });
  }

}, false);