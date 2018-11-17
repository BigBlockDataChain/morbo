import {allNodes as defaultNodes, allLinks as defaultLinks} from './sample-graph-data'

const DATA_KEY = 'graphData'

function selectNodes(graphData, links) {
  const {allNodes, allLinks} = graphData
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

function selectLinks(graphData, selectedNode) {
  const {allLinks} = graphData
  const links = allLinks.filter(link => link.nodeGroup === selectedNode)
  return links
}

export function getNodeSubTree(graphData, selectedNode = 1) {
  const links = selectLinks(graphData, selectedNode)
  const nodes = selectNodes(graphData, links)
  return {nodes, links}
}

export function loadGraphData() {
  const defaultGraphData = {allNodes: defaultNodes, allLinks: defaultLinks}
  const storedGraphData = window.localStorage.getItem(DATA_KEY)
  if (storedGraphData === null) {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(defaultGraphData))
    return defaultGraphData
  } else {
    return JSON.parse(storedGraphData)
  }
}
