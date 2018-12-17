// Imports
import { getLogger } from './../logger'
const logger = getLogger('node_highlight')

import { Globals } from './../supporting_modules/Globals'
import * as d3 from 'd3'

export const moduleName = 'NodeHighlight'

export function start() {
  return 1
}

export function update() {
  const nodes = Globals.getNodes().selectAll('circle')
  nodes
    .on('mouseover', highlight)
    .on('mouseout', unhighlight)
  return 1
}

// Functions
function highlight(d, i) {
  const temp = d3.select(this).attr('fill')
  if (temp === d3.select(this).attr('orig_color'))
    d3.select(this)
      .attr('fill', d3.rgb(temp).brighter())
      .style('stroke-width', '4px')
}

function unhighlight(d, i) {
  const temp = d3.select(this).attr('orig_color')
  if (temp !== d3.select(this).attr('fill'))
    d3.select(this)
      .attr('fill', temp)
      .style('stroke-width', '2px')
}
