const allNodes = [{
  nodeId: 0,
  name: 'N0',
  x: 300,
  y: 150,
  color: 'red',
  // NOTE(francium) Added for debugging purposes
  content: 'blank0',
}, {
  nodeId: 1,
  name: 'N1',
  x: 140,
  y: 300,
  content: 'blank1',
  color: 'green',
}, {
  nodeId: 2,
  name: 'N2',
  x: 300,
  y: 300,
  content: 'blank2',
  color: 'blue',
}, {
  nodeId: 3,
  name: 'N3',
  x: 400,
  y: 180,
  content: 'blank3',
  color: 'orange',
}, {
  nodeId: 4,
  name: 'N4',
  x: 300,
  y: 180,
  content: 'blank4',
  color: 'lime',
}, {
  nodeId: 5,
  name: 'N5',
  x: 300,
  y: 180,
  content: 'blank5',
  color: 'cyan',
}, {
  nodeId: 6,
  name: 'N6',
  x: 300,
  y: 180,
  content: 'blank6',
  color: 'purple',
}]

const allLinks = [{
  nodeGroup: 1,
  nodeSourceId: 0,
  nodeTargetId: 1,
  source: 0,
  target: 1,
}, {
  nodeGroup: 1,
  nodeSourceId: 1,
  nodeTargetId: 2,
  source: 1,
  target: 2,
}, {
  nodeGroup: 1,
  nodeSourceId: 2,
  nodeTargetId: 3,
  source: 2,
  target: 3,
}, {
  nodeGroup: 2,
  nodeSourceId: 3,
  nodeTargetId: 4,
  source: 0,
  target: 1,
}, {
  nodeGroup: 2,
  nodeSourceId: 4,
  nodeTargetId: 5,
  source: 1,
  target: 2,
}, {
  nodeGroup: 2,
  nodeSourceId: 3,
  nodeTargetId: 1,
  source: 0,
  target: 3,
}, {
  nodeGroup: 3,
  nodeSourceId: 2,
  nodeTargetId: 1,
  source: 0,
  target: 1,
}, {
  nodeGroup: 3,
  nodeSourceId: 2,
  nodeTargetId: 4,
  source: 0,
  target: 2,
}, {
  nodeGroup: 3,
  nodeSourceId: 1,
  nodeTargetId: 4,
  source: 1,
  target: 2,
}]

function selectNodes(links) {
  const nodes = []
  for (let i = 0; i < links.length; i += 1) {
    let node = nodes.find(node => node.nodeId === links[i].nodeTargetId)
    if (!node)
      nodes.push(allNodes[links[i].nodeTargetId])

    node = nodes.find(node => node.nodeId === links[i].nodeSourceId)
    if (!node)
      nodes.push(allNodes[links[i].nodeSourceId])
  }
  return nodes
}

function selectLinks(selectedNode) {
  const links = allLinks.filter(link => link.nodeGroup === selectedNode)
  return links
}

export function retrieveGraphData(selectedNode = 1) {
  const links = selectLinks(selectedNode)
  const nodes = selectNodes(links)
  return {nodes, links}
}
