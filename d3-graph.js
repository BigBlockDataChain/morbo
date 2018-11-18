/* eslint-disable max-statements */
import * as d3 from 'd3'
import { getLogger } from './logger'
const logger = getLogger('d3-graph')

import { Globals } from './supporting_modules/Globals'
import * as Renderer from './renderer'

export default class D3Graph {

  constructor() {
    document.d3Initialized = false
    this._width = null
    this._height = null
    this._host = null
    this._svg = null
    this._c10 = null
    this._g = null
  }

  init(host = null, dimensions) {
    if (document.d3Initialized
      && dimensions.height === this._height
      && dimensions.width === this._width) {
      logger.debug('Nothing changed, skipping init')
      return
    }

    if (document.d3Initialized) {
      if (this._svg !== null) {
        logger.debug('Removing existing svg element')
        this._svg.remove()
        this._svg = null
      } else {
        logger.debug('Can not remove svg, it has not been set')
      }
    }

    this._host = host
    document.d3Initialized = true

    this._svg = d3.select(host)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    this._g = this._svg.append('g')
      .attr('transform', d3.zoomIdentity)

    // store global variables
    Globals.setSVG(this._svg)
    Globals.setGraph(this._g)

    // Module Options
    const options = {
      GraphZoom: true,
      NodeHighlight: true,
      DragNodes: true,
      NodeCenter: true,
      GraphMove: true,
    }

    Globals.setModuleRun(options)

  }

  // eslint-disable-next-line class-methods-use-this
  render(data, callbacks = {}) {
    return Renderer.render(data, callbacks)
  }
}
