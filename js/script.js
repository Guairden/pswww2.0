const svg = document.getElementById('lstopo');
svg.addEventListener('load', function () {
  const svgContent = svg.contentDocument;
  const svgRoot = svgContent.getElementsByTagName('svg').item(0);
  const boxes = svgContent.getElementsByTagName('rect');
  const texts = svgContent.getElementsByTagName('text');
  const bridges = svgContent.getElementsByTagName('line');
  addCss(svgRoot);

  for (box of boxes) {
    box.addEventListener('click', function (e) {
      showElementInfo(e.target);
    })
  }

  function showElementInfo(element) {
    //const text = texts[getIndexOf(boxes, element)];
    let lag = 300;
    if (!element.getAttribute('focus')){
      if(focusElement = isTopologyFocused(boxes)) {
        shortenTopology(svgContent, svgRoot, boxes, texts, bridges, focusElement, lag);
        focusElement.removeAttribute('focus');
      }

      expandTopology(svgContent, svgRoot, boxes, texts, bridges, element, lag);
      element.setAttribute('focus', true);

    } else {
      shortenTopology(svgContent, svgRoot, boxes, texts, bridges, element, lag);
      element.removeAttribute('focus');
    }

    /*var text = document.createElementNS('ttp://www.w3.org/2000/svg', 'text');
    text.setAttributeNS('null', 'x', parseInt(element.getAttribute('x')) + 7);
    text.setAttributeNS('null', 'y', parseInt(element.getAttribute('y')) + 14);
    text.setAttributeNS('null', 'font-size', 10);
    text.setAttributeNS('null', 'fill', 'rgb(0,0,0)');
    text.textContent = "I am text";
    svg.appendChild(text)
    console.log(text)

    console.log(svgContent)*/
  }


}, false);

function expandTopology(svgContent, svgRoot, boxes, texts, bridges, element, lag) {
  expandElement(svgRoot, lag);
  mooveElementsBelow(boxes, texts, bridges, element, lag);
  expandElement(element, lag);
  
  while(element = getContainer(svgContent, element)) {
    if(isContainer(element)) {
      mooveElementsBelow(boxes, texts, bridges, element, lag);
      expandElement(element, lag);
    }
  }

  function mooveElementsBelow(boxes, texts, bridges, element, lag) {
    let x = element.getAttribute('x');
    let width = element.getAttribute('width');
    let y = parseInt(element.getAttribute('y')) + parseInt(element.getAttribute('height'));

    for (box of boxes) {
      if (!isMooved(box) && isElementBelow(x, y, width, box)) {
        mooveElement(box, lag);

        if(isContainer(box))
            mooveChildren(svgContent, boxes, box, lag)

        if(isElementLarger(x, width, box)) {
          //??? Using only box here seems to cause a reference problem for some reasons.
          let tmpBox = box
          box.setAttribute("transform","translate(" + 0 + ", " + 0 + ")");
          mooveElementsBelow(boxes, texts, bridges, box, lag);
          tmpBox.setAttribute("transform","translate(" + 0 + ", " + lag + ")");
          mooveTextChild(svgContent, tmpBox, lag)
        }
        
      }
    }

    for (text of texts) {
      if (!isMooved(text) && isElementBelow(x, y, width, text)) {
        mooveElement(text, lag);
      }
    }

    for (bridge of bridges) {
      if (!isMooved(bridge) && isLineBelow(x, y, width, bridge)) {
        mooveElement(bridge, lag);
      }
    }
  }
}

function shortenTopology(svgContent, svgRoot, boxes, texts, bridges, element, lag) {
  retractElement(svgRoot, lag);
  retractElement(element, lag);

  while(element = getContainer(svgContent, element)) {
    if(isContainer(element)) {
      retractElement(element, lag);
    }
  }

  for(child of svgRoot.children) {
    if (isMooved(child))
      mooveElement(child, 0);
  }

}

function expandElement(element, lag) {
  element.setAttribute('height', parseInt(element.getAttribute('height')) + lag);
}

function retractElement(element, lag) {
  element.setAttribute('height', parseInt(element.getAttribute('height')) - lag);
}

function mooveElement(element, lag) {
  element.setAttribute("transform","translate(" + 0 + ", " + lag + ")");
  if(lag == 0)
    element.removeAttribute('mooved');
  else
    element.setAttribute('mooved', true);
}

function mooveTextChild(svgContent, box, lag) {
  // Can there be more than one ?
  let boxText = svgContent.getElementById(box.id.replace('rect', 'text'));
  if(boxText && !isMooved(boxText)) {
    boxText.setAttribute("transform","translate(" + 0 + ", " + lag + ")");
    boxText.setAttribute('mooved', true);
  }
}

function mooveChildren(svgContent, boxes, element, lag) {
  for(childBox of boxes) {
    if(childBox.getAttribute('parent_id') == element.getAttribute('id')) {
      childBox.setAttribute("transform","translate(" + 0 + ", " + lag + ")");;
      childBox.setAttribute('mooved', true);
      mooveTextChild(svgContent, childBox, lag)
    }
  }
}

function isElementBelow(x, y, width, box) {
  if (parseInt(box.getAttribute('y')) > y && ((parseInt(box.getAttribute('x')) < x && parseInt(box.getAttribute('x')) + parseInt(box.getAttribute('width')) > parseInt(x)) || (parseInt(box.getAttribute('x')) >= parseInt(x) && parseInt(box.getAttribute('x')) <= parseInt(x) + parseInt(width))))
    return true;
  return false;
}

function isLineBelow(x, y, width, bridge) {
  if(parseInt(bridge.getAttribute('x1')) >= parseInt(x) && parseInt(bridge.getAttribute('x1')) <= parseInt(x) + parseInt(width) && parseInt(bridge.getAttribute('y1')) > y)
    return true;
  return false;
}

function isElementLarger(x, width, box) {
  if(parseInt(box.getAttribute('width')) > parseInt(width))
    return true;
  return false;
}

function isTopologyFocused(boxes){
  for (box of boxes) {
    if (box.getAttribute('focus'))
      return box
  }

  return null;
}

function isMooved(element) {
  if(element.getAttribute('mooved'))
    return true;
  return false;
}

function isContainer(element) {
  if((element.id.includes('Package') || element.id.includes('Group') || element.id.includes('Core') || element.id.includes('Bridge') || element.id.includes('PCI')) && !element.getAttribute('class').includes('Bridge'))
    return true;
  return false;
}

function getContainer(svgContent, element) {
  if(element.id.includes('Machine'))
    return null;

  return svgContent.getElementById(element.getAttribute('parent_id'));
}

function getIndexOf(htmlCollection, element) {
  let i = 0;
  for (e of htmlCollection) {
    if (e == element)
      return i;

    i++;
  }
}

function addCss(svgRoot) {
  const link = document.createElement('link');
  link.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('href', '../css/style.css');
  link.setAttribute('type', 'text/css');
  svgRoot.append(link);
}