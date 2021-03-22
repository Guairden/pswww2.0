
function getParent(svgContent, element) {
  if ( element.id.includes('Machine') )
    return null;

  return svgContent.getElementById(element.getAttribute('parent_id'));
}

function getTextChildren(svgRoot, element) {
  let textChildren = new Array();
  let id = "";

  id = element.id.replace('rect', 'text')
  if ( svgRoot.getElementById(id) )
      textChildren.push(svgRoot.getElementById(id))

  // Can there be more than 4 text children ?
  for ( let i = 1; i < 5; i++ ) {
    id = element.id.replace('rect', 'text') + '_' + i;
    if ( svgRoot.getElementById(id) ) {
      textChildren.push(svgRoot.getElementById(id))
    }
  }

  return textChildren;
}

function getElementXmlInfo(element, parent) {
  if ( element.getAttribute('gp_index') == parent['$'].gp_index )
      return parent;

  else if ( !parent.object )
    return null;
  
  for ( child of parent.object ) {
      let returnObject = getElementXmlInfo(element, child);
      if ( returnObject )
        return returnObject;
  }

  return null;
}

function getInfoValue(key, value) {
  if ( key != "cache_type" )
    return value;

  switch ( value ) {
    case "0":
      return "unified"
      break;
    case "1":
      return "data"
      break;
    case "2":
      return "instruction"
      break;
  }
}

function getProcessesByRunner() { 
  let processesByRunner = remote.getGlobal("processes");

  return processesByRunner;
}

function setProcessesByRunner(processesByObject, process, runnerId) {
  if ( processesByObject && !processesByObject[runnerId] )
    processesByObject[runnerId] = new Array();

  processesByObject[runnerId].push(process);
  return processesByObject;
}

function setBindedThreadByRunner(processesByObject, parentProcess) {
  for ( let thread of parentProcess.threads) {
    if ( parentProcess.name.split(' ').slice(1).includes(thread.name) ) {
      let runnerId = thread.name.replace(':', '_') + '_rect';
      thread.isBindedThread = true;
      processesByObject = setProcessesByRunner(processesByObject, thread, runnerId);
    }
  }
  return processesByObject;
}

function getElementProcessesInfo(svgRoot, element) {
  let processes = remote.getGlobal('processes');
  
  if ( processes[element.id] )
    return processes[element.id];


  return null;
}

function getProcessById(pid) {
  let processes = remote.getGlobal("processes");
  for ( const runner in processes ) {
    for ( let process of processes[runner]) {
      if ( process.PID == pid )
        return process;
    }
  }
}

function getMpiRankByRunner(runner, mpiRank) {
  let processes = remote.getGlobal('processes');
  for ( process of processes[runner] ) {
    if ( process.mpiRank != mpiRank )
      return process.mpiRank;
  }
  
}