function showElementInfo(xml, svgContent, svgRoot, boxes, texts, bridges, element) {
  if ( !element.getAttribute('focus') ) {
    if ( focusElement = isTopologyFocused(boxes) ) {
      shortenTopology(svgContent, svgRoot, focusElement, lags.yLag, lags.xLag);
      focusElement.removeAttribute('focus');
    }

    let xmlInfos = getElementXmlInfo(element, xml.topology);
    console.log(xmlInfos)
    let processesInfos = getElementProcessesInfo(svgRoot, element);
    let infos = { xml: xmlInfos['$'], processes: processesInfos };
    let circles = svgContent.getElementsByTagName('circle');
    lags = drawInfos(svgRoot, infos, element);
    expandTopology(svgContent, svgRoot, boxes, texts, bridges, circles, element, lags.yLag, lags.xLag);
    element.setAttribute('focus', true);

  } else {
    shortenTopology(svgContent, svgRoot, element, lags.yLag, lags.xLag);
    element.removeAttribute('focus');
  }
}

function expandTopology(svgContent, svgRoot, boxes, texts, bridges, circles, element, yLag, xLag) {
  expandElement(svgRoot, yLag, xLag);
  moveElements(boxes, texts, bridges, circles, element, yLag, xLag);
  expandElement(element, yLag, xLag);
  
  while ( element = getParent(svgContent, element) ) {
    if ( isContainer(element) ) {
      moveElements(boxes, texts, bridges, circles, element, yLag, xLag);
      expandElement(element, yLag, xLag);
    }
  }

  function moveElements(boxes, texts, bridges, circles, element, yLag, xLag) {
    let x = element.getAttribute('x');
    let y = parseInt(element.getAttribute('y'));
    let width = parseInt(element.getAttribute('width'));
    let height = parseInt(element.getAttribute('height'));

    for ( box of boxes ) {
      if ( !isMoved(box, 'y') && isElementBelow(x, y, width, height, box) && yLag > 0 ) {
        moveElement(box, yLag, 'y');
        moveTextChildren(svgContent, box, yLag, 'y');
        

        if ( isContainer(box) )
          moveChildren(svgContent, boxes, bridges, circles, box, yLag, 'y')

        if ( isElementLarger(width, box) ) {
          //??? Using only box here seems to cause a reference problem for some reasons.
          let tmpBox = box
          box.setAttribute("transform","translate(" + 0 + ", " + 0 + ")");
          moveElements(boxes, texts, bridges, circles, box, yLag, 0);
          tmpBox.setAttribute("transform","translate(" + 0 + ", " + yLag + ")");
          moveTextChildren(svgContent, tmpBox, yLag, 'y')
        }
      }
    
      if ( !isMoved(box, 'x') && isElementOnRight(x, y, width, height + parseInt(yLag), box, yLag) && xLag > 0 ) {
        moveElement(box, xLag, 'x');
        moveTextChildren(svgContent, box, xLag, 'x');

        if ( isContainer(box) )
          moveChildren(svgContent, boxes, bridges, circles, box, xLag, 'x');

        if ( isElementLonger(height, box) ) {
          //??? Using only box here seems to cause a reference problem for some reasons.
          let tmpBox = box
          box.setAttribute("transform","translate(" + 0 + ", " + 0 + ")");
          moveElements(boxes, texts, bridges, circles, box, 0, xLag);
          tmpBox.setAttribute("transform","translate(" + xLag + ", " + 0 + ")");
          moveTextChildren(svgContent, tmpBox, xLag, 'x')
        }
      }
    }

    for ( bridge of bridges ) {
      if ( !isMoved(bridge, 'y') && isLineBelow(x, y, width, height, bridge) ) {
        moveElement(bridge, yLag, 'y');
      }
      if ( !isMoved(bridge, 'x') && isLineOnRight(x, y, width, height + yLag, bridge) ) {
        moveElement(bridge, xLag, 'x');
      }
    }

    let circleText;
    for ( circle of circles ) {
      if ( !isMoved(circle, 'y') && isCircleBelow(x, y, width, height, circle) ) {
      circleText = svgContent.getElementById(circle.getAttribute('id').replace('Circle', 'Text'))
      moveElement(circle, yLag, 'y');
      moveElement(circleText, yLag, 'y')
    }
      if ( !isMoved(circle, 'x') && isCircleOnRight(x, y, width, height + yLag, circle) ) {
      circleText = svgContent.getElementById(circle.getAttribute('id').replace('Circle', 'Text'))
      moveElement(circle, xLag, 'x');
      moveElement(circleText, xLag, 'x')
    }
    }
  }
}

function shortenTopology(svgContent, svgRoot, element, yLag, xLag) {
  retractElement(svgRoot, yLag, xLag);
  retractElement(element, yLag, xLag);

  while ( element = getParent(svgContent, element) ) {
    if(isContainer(element)) {
      retractElement(element, yLag, xLag);
    }
  }

  for ( child of [...svgRoot.children] ) {
    if ( isMoved(child, 'y') )
      moveElement(child, 0, 'y');
    
    if ( isMoved(child, 'x') )
      moveElement(child, 0, 'x');

    else if ( isInfo(child) ) {
      child.remove();
    }
  }

}

function expandElement(element, yLag, xLag) {
  element.setAttribute('height', parseInt(element.getAttribute('height')) + parseInt(yLag));
  element.setAttribute('width', parseInt(element.getAttribute('width')) + parseInt(xLag));
}

function retractElement(element, yLag, xLag) {
  element.setAttribute('height', parseInt(element.getAttribute('height')) - parseInt(yLag));
  element.setAttribute('width', parseInt(element.getAttribute('width')) - parseInt(xLag));
}

function moveElement(element, lag, direction) {
  if ( lag == 0 ) {
    element.removeAttribute('moved' + direction);
    element.removeAttribute('transform')
  } else {
    let x = direction == 'x' ? lag : 0;
    let y = direction == 'y' ? lag : 0;
    element.setAttribute("transform", "translate(" + x + ", " + y + ")");
    element.setAttribute('moved' + direction, true);
  }
}

function moveTextChildren(svgContent, box, lag, direction) {
  for ( textChild of getTextChildren(svgContent, box) ) {
    let x = direction == 'x' ? lag : 0;
    let y = direction == 'y' ? lag : 0;
    textChild.setAttribute("transform","translate(" + x + ", " + y + ")");
    textChild.setAttribute('moved' + direction, true);
  }
}

function moveChildren(svgContent, boxes, bridges, circles, element, lag, direction) {
  for ( childBox of boxes ) {
    if ( isElementInside(childBox, element) ) {
      moveElement(childBox, lag, direction);
      moveTextChildren(svgContent, childBox, lag, direction);
    }
  }

  for ( bridge of bridges ) {
    if ( isLineInside(bridge, element) )
      moveElement(bridge, lag, direction);
  }

  let circleText;
  for ( circle of circles ) {
    if ( isCircleInside(circle, element) ) {
      circleText = svgContent.getElementById(circle.getAttribute('id').replace('Circle', 'Text'))
      moveElement(circle, lag, direction);
      moveElement(circleText, lag, direction)
    }
      
  }
}

function drawInfos(svgRoot, infos, element) {
  let childTextNb = getTextChildren(svgRoot, element).length;
  let lineSize = 17;
  let smallLineSize = 9;
  let x = parseInt(element.getAttribute('x')) + 7;
  let y = parseInt(element.getAttribute('y')) + lineSize * childTextNb;
  let marginBottom = lineSize + smallLineSize * ( childTextNb - 1 );
  let width = parseInt(element.getAttribute('width') - 15);
  let maxWidth = width
  let textContent = "";
  let text;

  if ( isContainer(element) ) {
    y += parseInt(element.getAttribute('height') - lineSize);
    marginBottom = parseInt(element.getAttribute('height')) - smallLineSize;
  }

  drawXmlInfos(infos.xml);

  if ( infos.processes )
    drawProcessInfos(infos.processes);
  
  return { xLag: maxWidth - width, 
           yLag: parseInt(y) - element.getAttribute('y') - marginBottom };

  function drawXmlInfos(xml) {
    for ( const [key, value] of Object.entries(xml) ) {
      textContent = key + ': ' + getInfoValue(key, value);
      drawText(textContent);
    }
  }

  function drawProcessInfos(processes) {
    for ( process of processes ) {
      if ( process.isBindedThread ) {
        if ( remote.getGlobal('showThreads') ) {
          textContent = '        ' + process.name + ' ' + process.object + ' ' + process.TID;
          drawText(textContent, true, process.TID);
        }
      } else {
        textContent = '    ' + process.name + ' ' + process.object + ' ' + process.PID + 
          ( remote.getGlobal('mpiMode') ? ' - MPI Rank : ' + process.mpiRank : '' );
        drawText(textContent, true);
        if ( remote.getGlobal('showThreads') && process.threads.length > 0 )
          drawThreadInfos(process.threads, process);
      }
    }
  }

  function drawThreadInfos(threads, parent) {
    for ( thread of threads ) {
      if ( !thread.name.includes(parent.name.split(' ')[0]) )
        continue;
      textContent = '        ' + thread.name + ' ' + thread.object + ' ' + thread.TID;
      drawText(textContent, true, parent.PID);
    }
  }

  function drawText(textContent, isProcessOrThread, parentId) {
    y = y + 17;
    text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('font-size', 10);
    text.setAttribute('font-family', 'Monospace');
    text.setAttribute('fill', 'rgb(0,0,0)');
    text.setAttribute('info', 'true');
    text.setAttribute('style', 'pointer-events: all;');
    text.setAttribute('parent_id', element.id);
    text.classList.add('fade-in');
    text.textContent = textContent;

    if ( parentId ) {
      text.classList.add('thread');
      text.setAttribute('parent-id', parentId);
    } if ( isProcessOrThread ) {
      text.classList.add('draggable');
      text.addEventListener('mouseover', function(e) { highlightText(svgRoot, e.target); });
    }
    svgRoot.appendChild(text);

    if ( maxWidth < text.getBBox().width )
      maxWidth = text.getBBox().width;
  }
}

function addStyle(svgRoot) {
  const link = document.createElement('link');
  link.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', '../css/style.css');
  link.setAttribute('type', 'text/css');
  svgRoot.append(link);

  for (element of svgRoot.children) {

    switch(element.getAttribute('fill')) {
      case 'rgb(210,231,164)':
        //green
        element.setAttribute('fill', 'rgb(174, 185, 172)');
        break;
      case 'rgb(231,255,181)':
        //lightgreen
        element.setAttribute('fill', 'rgb(228, 222, 206)');
        break;
      case 'rgb(190,210,149)':
        //darkgreen
        element.setAttribute('fill', 'rgb(148, 161, 145)');
        break;
      case 'rgb(0,255,0)':
        //way too green
        //element.setAttribute('fill', 'rgb(175, 171, 157)');
        break;
      case 'rgb(239,223,222)':
        //pink
        element.setAttribute('fill', 'rgb(212, 173, 191)');
        break;
      case 'rgb(242,232,232)':
        //lightpink
        element.setAttribute('fill', 'rgb(229, 204, 216)');
        break;
      case 'rgb(190,190,190)':
        //grey
        //element.setAttribute('fill', 'rgb(175, 171, 157)');
        break;
      case 'rgb(222,222,222)':
        //lightrey
        //element.setAttribute('fill', 'rgb(175, 171, 157)');
        break;
      case 'rgb(255,255,255)':
        //white
        if(element.id.includes('PU'))
          element.setAttribute('fill', 'rgb(222,222,222)');
        else if(!isContainer(element) && !element.id.includes('L3') && element.id.includes('L'))
          element.setAttribute('fill', 'rgb(211, 237, 251)');
        break;
      case 'rgb(255,0,0)':
        //red
        //element.setAttribute('fill', 'rgb(175, 171, 157)');
        break;
      case 'rgb(0,0,0)':
        //black
        //element.setAttribute('fill', 'rgb(175, 171, 157)');
        break;
    }

    if(element.id.includes('rect'))
      element.setAttribute('rx', 5);
  }
}

function drawProcesses(svgRoot, processesByRunner) {
  for ( let runner in processesByRunner ) {
    for ( let process of processesByRunner[runner] ) {
      let svgRunner = svgRoot.getElementById(runner);
      if ( !process.isBindedThread ) 
        drawBulletProcess(svgRoot, svgRunner, process)
    }
  }
}

function drawBulletProcess(svgRoot, runner, process) {
  if ( remote.getGlobal("showThreads") && process.threads && process.threads.length > 0 )
    drawBulletThread(svgRoot, process.threads);
  
  if ( !runner.getAttribute('process') ) {
    drawBulletCircle(svgRoot, runner);
    drawBulletText(svgRoot, runner, null, process.mpiRank);
    runner.setAttribute('process', 1);
  } else {
    addBullet(svgRoot, runner, null, process.mpiRank);
  }
}

function drawBulletThread(svgRoot, threads) {
  for ( thread of threads ) {
    runnerId = thread.name.replace(':', '_') + '_rect';
    runner = svgRoot.getElementById(runnerId);
    
    if ( !runner.getAttribute('thread') ) {
      drawBulletCircle(svgRoot, runner, true);
      drawBulletText(svgRoot, runner, true);
      runner.setAttribute('thread', 1);
    } else {
      addBullet(svgRoot, runner, true);
    }
  }
}

function drawBulletCircle(svgRoot, runner, isThread) {
  let bulletCircle = document.createElementNS("http://www.w3.org/2000/svg","circle");
  bulletCircle.setAttribute('cy', parseInt(runner.getAttribute('y')) + 10);
  bulletCircle.setAttribute('circle', true);
  bulletCircle.setAttribute('stroke', 'rgb(0,0,0)');
  bulletCircle.setAttribute('stroke-width', '1');

  if ( runner.getAttribute('transform') ) {
    let transform = runner.getAttribute('transform').substring(10, runner.getAttribute('transform').length - 1).split(',');
    bulletCircle.setAttribute("transform", "translate(" + parseInt(transform[0]) + ", " + parseInt(transform[1]) + ")");
    if ( transform[0] > 0 )
      bulletCircle.setAttribute('movedx', true);
    else if ( transform[1] > 0 )
      bulletCircle.setAttribute('movedy', true);
  }

  if ( isThread ) {
    bulletCircle.setAttribute('r', 10);
    bulletCircle.setAttribute('cx', parseInt(runner.getAttribute('x')) + 46);
    bulletCircle.setAttribute('fill', '#ff9980  ');
    bulletCircle.setAttribute('id', runner.getAttribute('id') + '_bulletCircleThread');
  } else {
    bulletCircle.setAttribute('r', 12);
    bulletCircle.setAttribute('cx', parseInt(runner.getAttribute('x')) + 14);
    bulletCircle.setAttribute('fill', '#ff4d4d');
    bulletCircle.setAttribute('id', runner.getAttribute('id') + '_bulletCircle');
  }

  svgRoot.appendChild(bulletCircle);
}

function drawBulletText(svgRoot, runner, isThread, mpiRank) {
  let bulletText= document.createElementNS("http://www.w3.org/2000/svg","text");
  bulletText.setAttribute('y', parseInt(runner.getAttribute('y')) + 13.5);
  bulletText.textContent = mpiRank ? mpiRank : '1';

  if ( runner.getAttribute('transform') ) {
    let transform = runner.getAttribute('transform').substring(10, runner.getAttribute('transform').length - 1).split(',');
    bulletText.setAttribute("transform","translate(" + parseInt(transform[0]) + ", " + parseInt(transform[1]) + ")");
    if ( transform[0] > 0 )
      bulletText.setAttribute('movedx', true);
    else if ( transform[1] > 0 )
      bulletText.setAttribute('movedy', true);
  }

  if ( isThread ) {
    bulletText.setAttribute('x', parseInt(runner.getAttribute('x')) + 42.5);
    bulletText.setAttribute('positionX', parseInt(bulletText.getAttribute('x')));
    bulletText.setAttribute('id', runner.getAttribute('id') + '_bulletTextThread');
  } else {
    bulletText.setAttribute('x', parseInt(runner.getAttribute('x')) + 10.5);
    bulletText.setAttribute('positionX', parseInt(bulletText.getAttribute('x')));
    bulletText.setAttribute('id', runner.getAttribute('id') + '_bulletText');
  }

  svgRoot.appendChild(bulletText);
}

function addBullet(svgRoot, runner, isThread, mpiRank, nbToAdd = 1) {
  let runnerId = runner.getAttribute('id');
  let bulletCircle = svgRoot.getElementById(runnerId + '_bulletCircle' + (isThread ? "Thread" : ""));
  let bulletText = svgRoot.getElementById(runnerId + '_bulletText' + (isThread ? "Thread" : ""));

  bulletText.textContent = mpiRank ? mpiRank : parseInt(bulletText.textContent) + nbToAdd;
  runner.setAttribute(isThread ? 'thread' : 'process', parseInt(runner.getAttribute('process')) + nbToAdd);

  if(parseInt(bulletText.textContent) >= 1000) {
    bulletCircle.setAttribute('r', isThread ? 16 : 18);
    bulletText.setAttribute("x", parseInt(bulletText.getAttribute('positionX')) - 12);
  } else if(parseInt(bulletText.textContent) >= 100) {
    bulletCircle.setAttribute('r', isThread ? 14 : 16);
    bulletText.setAttribute("x", parseInt(bulletText.getAttribute('positionX')) - 8);
  } else if(parseInt(bulletText.textContent) >= 10) {
    bulletCircle.setAttribute('r', isThread ? 12 : 14);
    bulletText.setAttribute("x", parseInt(bulletText.getAttribute('positionX')) - 4);
  }
}

function removeBullet(svgRoot, runner, isThread, mpiRank, nbToDelete = 1) {
  let runnerId = runner.getAttribute('id');
  let bulletCircle = svgRoot.getElementById(runnerId + '_bulletCircle' + (isThread ? "Thread" : ""));
  let bulletText = svgRoot.getElementById(runnerId + '_bulletText' + (isThread ? "Thread" : ""));
  let text;

  if ( mpiRank &&  runner.getAttribute(isThread ? 'thread' : 'process') > 1 ) {
    text = getMpiRankByRunner(runnerId, mpiRank);
  } else {
    text = parseInt(bulletText.textContent) - nbToDelete;
    runner.setAttribute(isThread ? 'thread' : 'process', parseInt(runner.getAttribute('process')) - nbToDelete);
  }
  bulletText.textContent = text;
  

  if ( ( isThread && bulletText.textContent <= 0 ) || ( !isThread && runner.getAttribute(isThread ? 'thread' : 'process') == 0 ) ) {
    runner.removeAttribute(isThread ? 'thread' : 'process');
    bulletCircle.remove();
    bulletText.remove();
  } else {
    if(parseInt(bulletText.textContent) < 1000 && parseInt(bulletText.textContent) > 100) {
      bulletCircle.setAttribute('r', isThread ? 14 : 16);
      bulletText.setAttribute("x", parseInt(bulletText.getAttribute('positionX')) - 8);
    } else if(parseInt(bulletText.textContent) < 100 && parseInt(bulletText.textContent) > 10) {
      bulletCircle.setAttribute('r', isThread ? 12 : 14);
      bulletText.setAttribute("x", parseInt(bulletText.getAttribute('positionX')) - 4);
    } else if(parseInt(bulletText.textContent) < 10) {
      bulletCircle.setAttribute('r', isThread ? 10 : 12);
      bulletText.setAttribute("x", parseInt(bulletText.getAttribute('positionX')) - 0);
    }
  }
}

function unHighlightBox(box) {
  let oldColor = box.getAttribute('id').includes('PU') ? 'rgb(222,222,222)' : 'rgb(190,190,190)';
  box.setAttribute('fill', oldColor);
}

function highlightBox(box) {
  box.setAttribute('fill', 'pink');
}

function highlightText(svgRoot, text) {
  SVGRect = text.getBBox();
  let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

  rect.setAttribute('id', text.getAttribute('id') + 'Highlighter');
  rect.setAttribute('rx', 5);
  rect.setAttribute('x', SVGRect.x + 10);
  rect.setAttribute('y', SVGRect.y - 4);
  rect.setAttribute('width', SVGRect.width) + 20;
  rect.setAttribute('height', SVGRect.height + 8);
  rect.setAttribute('fill', 'white');
  
  svgRoot.insertBefore(rect, text);
  text.addEventListener('mouseout', function(e) { unHighlightText(rect); });
  text.addEventListener('mousedown', function(e) { unHighlightText(rect); });
}

function unHighlightText(rect) {
  rect.remove();
}

function makeDraggable(svgRoot, svgContent) {
  svgRoot.addEventListener('mousedown', startDrag);
  svgRoot.addEventListener('mousemove', drag);
  svgRoot.addEventListener('mouseup', endDrag);
  svgRoot.addEventListener('mouseleave', endDrag);

  let selectedElement, bullet, offset, transform, targetBox;

  function startDrag(evt) {
    if (evt.target.classList.contains('draggable')) {
      selectedElement = evt.target;
      offset = getMousePosition(evt);
      bullet = drawTmpProcess(svgRoot, offset, selectedElement);
      // Get all the transforms currently on this element
      let transforms = bullet.transform.baseVal;
      // Ensure the first transform is a translate transform
      if (transforms.length === 0 ||
          transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
        // Create an transform that translates by (0, 0)
        let translate = svgRoot.createSVGTransform();
        translate.setTranslate(0, 0);
        // Add the translation to the front of the transforms list
        bullet.transform.baseVal.insertItemBefore(translate, 0);
      }
      // Get initial translation amount
      transform = transforms.getItem(0);
      offset.x -= transform.matrix.e;
      offset.y -= transform.matrix.f;
    }
  }

  function drag(evt) {
    if ( bullet ) {
      evt.preventDefault();
      let coord = getMousePosition(evt);
      transform.setTranslate(coord.x - offset.x, coord.y - offset.y);

      if ( targetBox )
        unHighlightBox(targetBox);

      if ( targetBox = targetIsCoreOrPU(svgContent, {x:coord.x, y: coord.y}) )
        highlightBox(targetBox);
    }
  }

  function endDrag(evt) {
    if ( !bullet )
      return;

    let selectedElementParentId = selectedElement.getAttribute('parent_id');
    let selectedElementParent = svgRoot.getElementById(selectedElementParentId);
    let isThread = selectedElement.classList.contains('thread');
    let targetBoxBullet = svgRoot.getElementById(targetBox.getAttribute('id') + '_bulletCircle' + (isThread ? 'Thread' : ''));
    let processInfos = selectedElement.textContent.split(' ');
    let processIdPos = selectedElement.classList.contains('thread') ? 11 : ( processInfos.length == 7 || processInfos.length == 12 ? 6 : 7);
    let processId = processInfos[processIdPos];
    let process;
    
    if ( targetBox && selectedElementParent != targetBox && hwlocBind(processId, targetBox, selectedElement.classList.contains('thread')) ) {
      process = getProcessById(processId)

      if ( !targetBoxBullet ) {
        drawBulletCircle(svgRoot, targetBox, isThread);
        drawBulletText(svgRoot, targetBox, isThread, process ? process.mpiRank : null);
        targetBox.setAttribute(isThread ? 'thread' : 'process', 1);
      } else {
        addBullet(svgRoot, targetBox, isThread, process ? process.mpiRank : null);
      }
      
      if ( !selectedElement.classList.contains('thread') ) {
        moveThreadChildren(svgRoot, selectedElementParent, targetBox, selectedElement);
        removeSelectedElementChildren(selectedElement);
      }

      removeBullet(svgRoot, selectedElementParent, isThread, process ? process.mpiRank : null);
      selectedElement.remove();

    } else {
      svgRoot.append(selectedElement);
    }

    unHighlightBox(targetBox);
    bullet.remove();
    selectedElement = null;
    bullet = null;
  }

  function getMousePosition(evt) {
    let CTM = svgRoot.getScreenCTM();
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d
    };
  }

  function removeSelectedElementChildren(processInfo) {
    let processInfos = processInfo.textContent.split(' ');
    let processId = processInfos[processInfos.length - 1];
    let threads = svgRoot.getElementsByClassName('thread');
    
    for (let thread of [...threads]) {
      if ( thread.getAttribute('parent-id') == processId)
        thread.remove();
    }
  }
}

function drawTmpProcess(svgRoot, offset, processText) {
  processText.remove();
  let bulletCircle = document.createElementNS("http://www.w3.org/2000/svg","circle");
  bulletCircle.setAttribute('cy', offset.y);
  bulletCircle.setAttribute('cx', offset.x);
  bulletCircle.setAttribute('circle', true);
  bulletCircle.setAttribute('stroke', 'rgb(0,0,0)');
  bulletCircle.setAttribute('stroke-width', '1');
  bulletCircle.setAttribute('r', 12);
  bulletCircle.setAttribute('fill', 'rgb(220, 220, 220)');

  svgRoot.append(bulletCircle);

  return bulletCircle;
}

function targetIsCoreOrPU(svgContent, offset) {
  let boxes = svgContent.elementsFromPoint(offset.x, offset.y);
  for(box of boxes) {
    if ( box.getAttribute('id') && ( box.getAttribute('id').includes('PU') || box.getAttribute('id').includes('Core') && !box.getAttribute('id').includes('bullet')))
      return box;
  }
  
  return null;
}

function hwlocBind(processId, runner, isThread) {
  let runnerName = runner.getAttribute('id').replace('_rect', '').replace('_', ':');
  
  if ( !isThread )
    return ipcRenderer.sendSync('hwloc-bind', processId, runnerName);
  else
    return ipcRenderer.sendSync('hwloc-bind-thread', processId, runnerName);
}

function moveThreadChildren(svgRoot, oldRunner, newRunner, processInfo) {
  let processInfos = processInfo.textContent.split(' ');
  let processId = processInfos[processInfos.length - 1];
  let process = getProcessById(processId);

  if ( !remote.getGlobal("showThreads") || process.threads.length == 0)
    return

  if ( process.threads.length > 0 ) {
    removeBullet(svgRoot, oldRunner, true, null, process.threads.length);
  }
  
  if ( !newRunner.getAttribute('thread') ) {
    drawBulletCircle(svgRoot, newRunner, true);
    drawBulletText(svgRoot, newRunner, true);
    newRunner.setAttribute('thread', 1);
    addBullet(svgRoot, newRunner, true, null, process.threads.length - 1);
  } else {
    addBullet(svgRoot, newRunner, true, process.mpiRank, process.threads.length);
  }
 
}

function drawErrorSign(svgRoot, error) {
  const machine = svgRoot.getElementById('Machine_0_rect');
  const warning = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');

  warning.setAttribute('x', parseInt(machine.getAttribute('x')) + 300);
  warning.setAttribute('y', parseInt(machine.getAttribute('y')) + 2);
  warning.setAttribute('width', 20);
  warning.setAttribute('height', 20);
  warning.setAttribute('href', '../img/warning.svg');
  warning.setAttribute('id', 'warning');
  warning.classList.add('blink');

  title.textContent = error;

  warning.appendChild(title);
  svgRoot.append(warning);
}

function eraseErrorSign(svgRoot) {
  const warning = svgRoot.getElementById('warning');

  if ( warning )
    warning.remove();
}

// FRONT
// TODO : circles with mpi binding error

// HWLOC-PS
// TODO : last cpulocation

// PSWWW2 :
// TODO : parent_id complement ?!

// OPTIONAL
// TODO : update processInfo list position ?
// TODO : Drag process function ==> fix lag ==> pb : recomputing destination each time the mouse move