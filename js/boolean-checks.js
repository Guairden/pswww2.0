function isElementBelow(x, y, width, height, child) {
  childX = parseInt(child.getAttribute('x'));
  childY = parseInt(child.getAttribute('y'));
  childWidth = parseInt(child.getAttribute('width'));
  childHeight = parseInt(child.getAttribute('height'));
  x = parseInt(x);
  y = parseInt(y);
  width = parseInt(width);
  height = parseInt(height);

  return childY >= y + height && ( ( childX < x && childX + childWidth > x) || (childX >= x && childX <= x + width ) )
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

function isCircleBelow(x, y, width, height, child) {
  childX = parseInt(child.getAttribute('cx'));
  childY = parseInt(child.getAttribute('cy'));
  x = parseInt(x);
  y = parseInt(y);
  width = parseInt(width);
  height = parseInt(height);

  return childX >= x && childX <= x + width && childY > y + height;
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

function isCircleInside(child, element) {
  childX = parseInt(child.getAttribute('cx'));
  childY = parseInt(child.getAttribute('cy'));
  x = parseInt(element.getAttribute('x'));
  y = parseInt(element.getAttribute('y'));
  width = parseInt(element.getAttribute('width'));
  height = parseInt(element.getAttribute('height'));

  return childX > x && childY > y && childX < x + width && childY < y + height;
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

function isCircleOnRight(x, y, width, height, child) {
  childX = parseInt(child.getAttribute('cx'));
  childY = parseInt(child.getAttribute('cy'));
  x = parseInt(x);
  y = parseInt(y);
  width = parseInt(width);
  height = parseInt(height);

  return childY >= y && childY <= y + height && childX > x + width;
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
