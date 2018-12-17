import { getLogger } from './../logger'
const logger = getLogger('graph_move')

import { Globals } from './../supporting_modules/Globals'
import * as d3 from 'd3'

import * as Trans from './../supporting_modules/transformations'

export const moduleName = 'GraphMove'

let gTransform = null

export function start() {
  gTransform = Trans.getTransform(Globals.getGraph())
}

export function update() {
  d3.select('body')
    .on('keypress', function () {
      gTransform = Trans.getTransform(Globals.getGraph())
      const temp = 50 * gTransform[2]
      switch (d3.event.keyCode) {
        case 37:
          gTransform[0] -= temp
          break
        case 39:
          gTransform[0] += temp
          break
        case 38:
          gTransform[1] -= temp
          break
        case 40:
          gTransform[1] += temp
          break
        default: break
      }

      Globals.getSVG()
        .call(
          Globals.getZoomHandler().transform,
          d3.zoomIdentity.translate(gTransform[0], gTransform[1]).scale(gTransform[2])
        )
    })
}
