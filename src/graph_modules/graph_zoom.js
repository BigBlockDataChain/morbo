import { getLogger } from './../logger'
const logger = getLogger('graph_zoom')

import { Globals } from './../supporting_modules/Globals'
import * as d3 from 'd3'

import * as Trans from './../supporting_modules/transformations'

export const moduleName = 'GraphZoom'

// Variables
let gTransform = null
let WINSIZE = null
let zoomHandler = null

export function start() {
  if (Trans.getTransform(Globals.getGraph()) === null || Trans.getTransform(Globals.getGraph()) === undefined) {
    Globals.getGraph().attr('transform', d3.zoomIdentity)
  }
  gTransform = Globals.getGraph()

  if (Globals.getWinSize() === null || Globals.getWinSize() === undefined) {
    Globals.setWinSize({
      minX: 0,
      maxX: document.documentElement.clientWidth,
      minY: 0,
      maxY: document.documentElement.clientHeight,
    })
  }
  WINSIZE = Globals.getWinSize()
}

export function update() {
  const zoomActions = () => {
    gTransform = d3.event.transform

    Globals.getGraph().attr('transform', gTransform)

    Globals.getNodeLabels().selectAll('text')
      .attr('font-size', 16 / gTransform.k)
      .attr('x', d => d.x - d.content.length * 4 / gTransform.k)
      .attr('y', d => {
        if (gTransform.k > 2) { return d.y }
        return d.y - 10
      })

    WINSIZE.minX = -gTransform.x / gTransform.k
    WINSIZE.maxX = document.documentElement.clientWidth / gTransform.k - (gTransform.x + 15) / gTransform.k
    WINSIZE.minY = -gTransform.y / gTransform.k
    WINSIZE.maxY = document.documentElement.clientHeight / gTransform.k - (gTransform.y + 15) / gTransform.k
  }

  zoomHandler = d3.zoom()
    .scaleExtent([1 / 10, 10])
    .on('zoom', zoomActions)

  zoomHandler(Globals.getSVG())

  // Disable double click zooming
  Globals.getSVG().on('dblclick.zoom', null)

  logger.debug(zoomHandler)

  Globals.setZoomHandler(zoomHandler)
}
