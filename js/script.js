const { ipcRenderer, remote } = require('electron');
const svg = document.getElementById('lstopo');

svg.addEventListener('load', function () {
  const xml = remote.getGlobal("xml");
  const svgContent = svg.contentDocument;
  const svgRoot = svgContent.getElementsByTagName('svg').item(0);
  const boxes = svgContent.getElementsByTagName('rect');
  const texts = svgContent.getElementsByTagName('text');
  const bridges = svgContent.getElementsByTagName('line');
  let lags
  addStyle(svgRoot);

  for ( box of boxes ) {
    box.addEventListener('click', function (e) {
      showElementInfo(e.target);
    })
  }

  function showElementInfo(element) {
    if ( !element.getAttribute('focus') ){
      if ( focusElement = isTopologyFocused(boxes) ) {
        shortenTopology(svgContent, svgRoot, focusElement, lags.yLag, lags.xLag);
        focusElement.removeAttribute('focus');
      }

      let infos = getElementInfo(element, xml.topology);
      lags = createInfos(svgRoot, infos['$'], element);
      expandTopology(svgContent, svgRoot, boxes, texts, bridges, element, lags.yLag, lags.xLag);
      element.setAttribute('focus', true);      

    } else {
      shortenTopology(svgContent, svgRoot, element, lags.yLag, lags.xLag);
      element.removeAttribute('focus');
    }
  }


}, false);

function expandTopology(svgContent, svgRoot, boxes, texts, bridges, element, yLag, xLag) {
  expandElement(svgRoot, yLag, xLag);
  moveElements(boxes, texts, bridges, element, yLag, xLag);
  expandElement(element, yLag, xLag);
  
  while ( element = getParent(svgContent, element) ) {
    if ( isContainer(element) ) {
      moveElements(boxes, texts, bridges, element, yLag, xLag);
      expandElement(element, yLag, xLag);
    }
  }

  function moveElements(boxes, texts, bridges, element, yLag, xLag) {
    let x = element.getAttribute('x');
    let y = parseInt(element.getAttribute('y'));
    let width = parseInt(element.getAttribute('width'));
    let height = parseInt(element.getAttribute('height'));

    for ( box of boxes ) {
      if ( !isMoved(box, 'y') && isElementBelow(x, y, width, height, box) && yLag > 0 ) {
        moveElement(box, yLag, 'y');
        moveTextChild(svgContent, box, yLag, 'y');
        

        if ( isContainer(box) )
            moveChildren(svgContent, boxes, bridges, box, yLag, 'y')

        if ( isElementLarger(width, box) ) {
          //??? Using only box here seems to cause a reference problem for some reasons.
          let tmpBox = box
          box.setAttribute("transform","translate(" + 0 + ", " + 0 + ")");
          moveElements(boxes, texts, bridges, box, yLag, 0);
          tmpBox.setAttribute("transform","translate(" + 0 + ", " + yLag + ")");
          moveTextChild(svgContent, tmpBox, yLag, 'y')
        }
      }
    
      if ( !isMoved(box, 'x') && isElementOnRight(x, y, width, height + parseInt(yLag), box, yLag) && xLag > 0 ) {
        moveElement(box, xLag, 'x');
        moveTextChild(svgContent, box, xLag, 'x');

        if ( isContainer(box) )
          moveChildren(svgContent, boxes, bridges, box, xLag, 'x');

        if ( isElementLonger(height, box) ) {
          //??? Using only box here seems to cause a reference problem for some reasons.
          let tmpBox = box
          box.setAttribute("transform","translate(" + 0 + ", " + 0 + ")");
          moveElements(boxes, texts, bridges, box, 0, xLag);
          tmpBox.setAttribute("transform","translate(" + xLag + ", " + 0 + ")");
          moveTextChild(svgContent, tmpBox, xLag, 'x')
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

function moveTextChild(svgContent, box, lag, direction) {
  let i = 0
  let boxText = svgContent.getElementById(box.id.replace('rect', 'text'));
  do {
    if ( boxText ) {
      let x = direction == 'x' ? lag : 0;
      let y = direction == 'y' ? lag : 0;
      boxText.setAttribute("transform","translate(" + x + ", " + y + ")");
      boxText.setAttribute('moved' + direction, true);
    }
    i++;
    boxText = svgContent.getElementById(box.id.replace('rect', 'text') + "_" + i);
  } while ( i < 3 );
}

function moveChildren(svgContent, boxes, bridges, element, lag, direction) {
  for ( childBox of boxes ) {
    if ( isElementInside(childBox, element) ) {
      moveElement(childBox, lag, direction);
      moveTextChild(svgContent, childBox, lag, direction);
    }
  }
  for ( bridge of bridges ) {
    if ( isLineInside(bridge, element) )
      moveElement(bridge, lag, direction);
  }
}

function createInfos(svgRoot, infos, element) {
  let text;
  let x = parseInt(element.getAttribute('x')) + 7
  let y = parseInt(element.getAttribute('y')) + 17
  
  for ( let i = 1; i < 3; i++ ) {
    if ( svgRoot.getElementById(element.id.replace('rect', 'text') + '_' + i) )
      y += 17;
  } 

  let width = parseInt(element.getAttribute('width') - 15);
  let maxWidth = width

  if ( isContainer(element) )
    y += parseInt(element.getAttribute('height') - 17);
  

  for ( const [key, value] of Object.entries(infos) ) {
    text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    y = y + 17;
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('font-size', 10);
    text.setAttribute('font-family', 'Monospace');
    text.setAttribute('fill', 'rgb(0,0,0)');
    text.setAttribute('info', 'true');
    text.classList.add('fade-in');
    text.textContent = key + ': ' + value;
    svgRoot.appendChild(text);

    if ( maxWidth < text.getBBox().width )
      maxWidth = text.getBBox().width;
  }

  return { xLag: maxWidth - width, yLag: parseInt(y) - element.getAttribute('y') - (isContainer(element) ? parseInt(element.getAttribute('height')) - 17 : 0)};
}

function isElementBelow(x, y, width, height, child) {
  childX = parseInt(child.getAttribute('x'));
  childY = parseInt(child.getAttribute('y'));
  childWidth = parseInt(child.getAttribute('width'));
  childHeight = parseInt(child.getAttribute('height'));
  x = parseInt(x);
  y = parseInt(y);
  width = parseInt(width);
  height = parseInt(height);

  return childY > y + height && ( ( childX < x && childX + childWidth > x) || (childX >= x && childX <= x + width ) )
}

function isLineBelow(x, y, width, height, child) {
  childX1 = parseInt(child.getAttribute('x1'));
  childY1 = parseInt(child.getAttribute('y2'));
  childX2 = parseInt(child.getAttribute('x2'));
  childY2 = parseInt(child.getAttribute('y2'));
  x = parseInt(x);
  y = parseInt(y);
  width = parseInt(width);
  height = parseInt(height);

  return childX1 >= x && childX1 <= x + width && childY1 > y + height;
}

function isLineInside(bridge, element) {
  childX1 = parseInt(bridge.getAttribute('x1'));
  childY1 = parseInt(bridge.getAttribute('y1'));
  childX2= parseInt(bridge.getAttribute('x2'));
  childY2 = parseInt(bridge.getAttribute('y2'));
  x = parseInt(element.getAttribute('x'));
  y = parseInt(element.getAttribute('y'));
  width = parseInt(element.getAttribute('width'));
  height = parseInt(element.getAttribute('height'));

  return childX1 > x && childY1 > y && childX2 < x + width && childY2 < y + height;
}

function isElementInside(child, element) {
  childX = parseInt(child.getAttribute('x'));
  childY = parseInt(child.getAttribute('y'));
  childWidth = parseInt(child.getAttribute('width'));
  childHeight = parseInt(child.getAttribute('height'));
  x = parseInt(element.getAttribute('x'));
  y = parseInt(element.getAttribute('y'));
  width = parseInt(element.getAttribute('width'));
  height = parseInt(element.getAttribute('height'));

  return childX > x && childY > y && childX + childWidth < x + width && childY + childHeight < y + height;
}

function isElementOnRight(x, y, width, height, child, yLag) {
  childX = parseInt(child.getAttribute('x'));
  childY = parseInt(child.getAttribute('y')) + ( child.getAttribute('transform') ? parseInt(yLag) : parseInt(0) );
  childWidth = parseInt(child.getAttribute('width'));
  childHeight = parseInt(child.getAttribute('height'));
  x = parseInt(x);
  y = parseInt(y);
  width = parseInt(width);
  height = parseInt(height);

  return childX > x + width && ( ( childY < y && childY + childHeight > y) || (childY >= y && childY <= y + height ) );
}

function isLineOnRight(x, y, width, height, child) {
  childX1 = parseInt(child.getAttribute('x1'));
  childY1 = parseInt(child.getAttribute('y2'));
  childX2 = parseInt(child.getAttribute('x2'));
  childY2 = parseInt(child.getAttribute('y2'));
  x = parseInt(x);
  y = parseInt(y);
  width = parseInt(width);
  height = parseInt(height);

  return childY1 >= y && childY1 <= y + height && childX1 > x + width;
}

function isTopologyFocused(boxes){
  for (box of boxes) {
    if (box.getAttribute('focus'))
      return box
  }

  return null;
}

function isContainer(element) {
  return ( element.id.includes('Machine') ||
       element.id.includes('Package') ||
       element.id.includes('Group') ||
       element.id.includes('Core') ||
       element.id.includes('Bridge') ||
       element.id.includes('PCI') ) &&
       !element.getAttribute('class').includes('Bridge')
}

function isElementLarger(width, box) {
  return parseInt(box.getAttribute('width')) > parseInt(width);
}

function isElementLonger(height, box) {
  return parseInt(box.getAttribute('height')) > parseInt(height);
}

function isMoved(element, direction) {
  return element.getAttribute('moved' + direction);
}

function isInfo(element) {
  return element.getAttribute('info');
}

function getParent(svgContent, element) {
  if ( element.id.includes('Machine') )
    return null;

  return svgContent.getElementById(element.getAttribute('parent_id'));
}

function getElementInfo(element, parent) {
  if(element.getAttribute('gp_index') == parent['$'].gp_index)
      return parent;

  else if (!parent.object)
    return null;
  
  for(child of parent.object) {
      let returnObject = getElementInfo(element, child);
      if (returnObject)
        return returnObject;
  }

  return null;
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