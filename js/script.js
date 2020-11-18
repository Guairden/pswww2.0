const svg = document.getElementById('lstopo');
svg.addEventListener('load', function () {
  const svgContent = svg.contentDocument;
  const svgRoot = svgContent.getElementsByTagName('svg').item(0);
  const boxes = svgContent.getElementsByTagName('rect');
  const texts = svgContent.getElementsByTagName('text');
  const bridges = svgContent.getElementsByTagName('line');

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

function getIndexOf(htmlCollection, element) {
  let i = 0;
  for (e of htmlCollection) {
    if (e == element)
      return i;

    i++;
  }
}

function getContainer(svgContent, element) {
  if(element.id.includes('Machine'))
    return null;

  return svgContent.getElementById(element.getAttribute('parent_id'));
}

function expandTopology(svgContent, svgRoot, boxes, texts, bridges, element, lag) {
  svgRoot.setAttribute('height', parseInt(svgRoot.getAttribute('height')) + lag);
  expandTopologyByElement(boxes, texts, bridges, element, lag);

  while(element = getContainer(svgContent, element)) {
    if(isContainer(element))
      expandTopologyByElement(boxes, texts, bridges, element, lag);
  }

  function expandTopologyByElement(boxes, texts, bridges, element, lag) {
    let x = element.getAttribute('x');
    let width = element.getAttribute('width');
    let y = parseInt(element.getAttribute('y')) + parseInt(element.getAttribute('height'));
    
    if(!element.getAttribute('expanded'))
      element.setAttribute('height', parseInt(element.getAttribute('height')) + lag)

    for (box of boxes) {
      if (!box.getAttribute('expanded') && isElementBelow(x, y, width, box)) {
        box.setAttribute('y', parseInt(box.getAttribute('y')) + lag);
        box.setAttribute('expanded', true);

        if(!box.id.includes('Machine') && !box.id.includes('Package') && !box.id.includes('Group') && isElementLarger(x, width, box)) {
          //??? Using only box here seems to cause a reference problem for some reasons.

          let tmpBox = box
          box.setAttribute('y', parseInt(box.getAttribute('y')) - lag);
          expandTopologyByElement(boxes, texts, bridges, box, lag);
          tmpBox.setAttribute('y', parseInt(tmpBox.getAttribute('y')) + lag);
          mooveTextChild(svgContent, tmpBox, lag)
          
          if(tmpBox.id.includes('PCI')) {
            for(childBox of boxes) {
              if(childBox.getAttribute('parent_id') == tmpBox.getAttribute('id')) {
                childBox.setAttribute('y', parseInt(childBox.getAttribute('y')) + lag);
                childBox.setAttribute('expanded', true);
                mooveTextChild(svgContent, childBox, lag)
              }
            }
          }

        }
        
      }
    }

    for (text of texts) {
      if (!text.getAttribute('expanded') && isElementBelow(x, y, width, text)) {
        text.setAttribute('y', parseInt(text.getAttribute('y')) + lag);
        text.setAttribute('expanded', true);
      }
    }

    for (bridge of bridges) {
      if (!bridge.getAttribute('expanded') && parseInt(bridge.getAttribute('x1')) >= parseInt(x) && parseInt(bridge.getAttribute('x1')) <= parseInt(x) + parseInt(width) && parseInt(bridge.getAttribute('y1')) > y) {
        bridge.setAttribute('y1', parseInt(bridge.getAttribute('y1')) + lag);
        bridge.setAttribute('y2', parseInt(bridge.getAttribute('y2')) + lag);
        bridge.setAttribute('expanded', true);
      }
    }
  }
}

function shortenTopology(svgContent, svgRoot, boxes, texts, bridges, element, lag) {
  svgRoot.setAttribute('height', parseInt(svgRoot.getAttribute('height')) - lag);
  element.setAttribute('height', parseInt(element.getAttribute('height')) - lag);

  while(element = getContainer(svgContent, element)) {
    if(isContainer(element)) {
      element.setAttribute('height', parseInt(element.getAttribute('height')) - lag);
    }
     
  }

  for (box of boxes) {
    if (box.getAttribute('expanded')) {
      box.setAttribute('y', parseInt(box.getAttribute('y')) - lag);
      box.removeAttribute('expanded');
    }
  }

  for (text of texts) {
    if (text.getAttribute('expanded')) {
      text.setAttribute('y', parseInt(text.getAttribute('y')) - lag);
      text.removeAttribute('expanded');
    }
  }

  for (bridge of bridges) {
    if (bridge.getAttribute('expanded')) {
      bridge.setAttribute('y1', parseInt(bridge.getAttribute('y1')) - lag);
      bridge.setAttribute('y2', parseInt(bridge.getAttribute('y2')) - lag);
      bridge.removeAttribute('expanded');
    }
  }

}

function isElementBelow(x, y, width, box) {
  if (parseInt(box.getAttribute('y')) > y && ((parseInt(box.getAttribute('x')) < x && parseInt(box.getAttribute('x')) + parseInt(box.getAttribute('width')) > parseInt(x)) || (parseInt(box.getAttribute('x')) >= parseInt(x) && parseInt(box.getAttribute('x')) <= parseInt(x) + parseInt(width))))
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

function isContainer(element) {
  if((element.id.includes('Package') || element.id.includes('Group') || element.id.includes('Core') || element.id.includes('Bridge') || element.id.includes('PCI')) && !element.getAttribute('class').includes('Bridge'))
    return true;
  return false;
}

function mooveTextChild(svgContent, box, lag) {
  // Can there be more than one ?
  let boxText = svgContent.getElementById(box.id.replace('rect', 'text'));
  if(boxText && !boxText.getAttribute('expanded')) {
    boxText.setAttribute('y', parseInt(boxText.getAttribute('y')) + lag);
    boxText.setAttribute('expanded', true);
  }
}