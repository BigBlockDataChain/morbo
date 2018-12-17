import { getLogger } from './../logger'
const logger = getLogger('drag_nodes')

import { Globals } from './../supporting_modules/Globals'
import * as d3 from 'd3'
import * as Trans from './../supporting_modules/transformations'

export const moduleName = 'DragNodes'

// Variables
let WINSIZE = null
let links = null
let nodes = null
let labels = null

export function start() {
  if (Globals.getWinSize() === null || Globals.getWinSize() === undefined) {
    Globals.setWinSize({
      minX: 0,
      maxX: document.documentElement.clientWidth,
      minY: 0,
      maxY: document.documentElement.clientHeight,
    })
  }
  WINSIZE = Globals.getWinSize()
  links = Globals.getLinks().selectAll('line')
  nodes = Globals.getNodes().selectAll('circle')
  labels = Globals.getNodeLabels().selectAll('text')
  return 1
}
export function update() {
  nodes
    .call(drag)
  return 1
}

// Functions
const drag = d3.drag()
  .on('drag', function (d, i) {
    // Drag node
    d.x += d3.event.dx + d.x > WINSIZE.maxX
           || d.x + d3.event.dx < WINSIZE.minX ? 0 : d3.event.dx
    d.y += d3.event.dy + d.y > WINSIZE.maxY
           || d.y + d3.event.dy < WINSIZE.minY ? 0 : d3.event.dy
    d3.select(this)
      .attr('cx', d.x)
      .attr('cy', d.y)

    links.each(function (l) {
      if (l.source == i) {
        d3.select(this)
          .attr('x1', d.x)
          .attr('y1', d.y)
      } else if (l.target == i) {
        d3.select(this)
          .attr('x2', d.x)
          .attr('y2', d.y)
      }
    })

    labels.each(function (n) {
      if (n.nodeId == i)
        d3.select(this)
          .attr('x', d.x)
          .attr('y', d.y)
    })

    // Pan graph
    const temp = Trans.localToGlobalCoord(d)
    const gTransform = Trans.getTransform(Globals.getGraph())
    if (temp.x < document.documentElement.clientWidth / 10) gTransform[0] += 10
    if (temp.x > 9 * document.documentElement.clientWidth / 10) gTransform[0] -= 10
    if (temp.y < document.documentElement.clientHeight / 10) gTransform[1] += 10
    if (temp.y > 9 * document.documentElement.clientHeight / 10) gTransform[1] -= 10

    Globals.getSVG()
      .call(
        Globals.getZoomHandler().transform,
        d3.zoomIdentity.translate(gTransform[0], gTransform[1]).scale(gTransform[2])
      )

    WINSIZE.minX = -gTransform[0] / gTransform[2]
    WINSIZE.maxX = document.documentElement.clientWidth / gTransform[2]
                 - (gTransform[0] + 15) / gTransform[2]
    WINSIZE.minY = -gTransform[1] / gTransform[2]
    WINSIZE.maxY = document.documentElement.clientHeight / gTransform[2]
                 - (gTransform[1] + 15) / gTransform[2]
  })
