import { getLogger } from './../logger'
const logger = getLogger('center_node')

import { Globals } from './../supporting_modules/Globals'
import * as d3 from 'd3'
import * as Trans from './../supporting_modules/transformations'

export const moduleName = 'NodeCenter'

export function start() {
  return 1
}
export function update() {
  const nodes = Globals.getNodes().selectAll('circle')
  nodes
    .on('click', function (d) {
      const gTransform = Trans.getTransform(Globals.getGraph())
      const x = gTransform[0]
              + document.documentElement.clientWidth / 2
              - Trans.localToGlobalCoord(d).x
      const y = gTransform[1]
              + document.documentElement.clientHeight / 2
              - Trans.localToGlobalCoord(d).y

      Globals.getSVG()
        .transition()
        .duration(250)
        .call(
          Globals.getZoomHandler().transform,
          d3.zoomIdentity.translate(x, y).scale(gTransform[2]),
        )
    })
  return 1
}
