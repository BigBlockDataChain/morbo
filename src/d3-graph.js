import * as d3 from 'd3'
import * as d3zoom from 'd3-zoom'

import {getLogger} from './logger'

const logger = getLogger('d3-graph')

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

    // Used for node coloring
    this._c10 = d3.scaleOrdinal(d3.schemeCategory10)

    this._svg = d3.select(host)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .on('click', () => logger.debug('click'))
      .on('dblclick', () => logger.debug('dblclick'))
    this._g = this._svg.append('g')
      .attr('class', 'everything')

    const zoomActions = () => {
      this._g.attr('transform', d3.event.transform)
    }
    const zoomHandler = d3zoom.zoom()
      .on('zoom', zoomActions)

    zoomHandler(this._svg)
  }

  render(data, callbacks = {}) {
    logger.debug('Drawing graph nodes and links')

    // TODO Remove function usage and replace with anonymous functions expressions But
    //   this will cause issues with the use of 'this' in functions, so need to figure out
    //   how to fix that too
    const g = this._g
    const c10 = this._c10

    const links = g.selectAll('.link')
      .data(data.links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('x1', function(l) {
        const sourceNode = data.nodes.filter(function(d, i) {
          return i == l.source
        })[0]
        d3.select(this).attr('y1', sourceNode.y)
        return sourceNode.x
      })
      .attr('x2', function(l) {
        const targetNode = data.nodes.filter(function(d, i) {
          return i == l.target
        })[0]
        d3.select(this).attr('y2', targetNode.y)
        return targetNode.x
      })
      .attr('fill', 'none')
      .attr('stroke', 'white')

    const drag = d3.drag()
      .on('drag', function(d, i) {
        d.x += d3.event.dx
        d.y += d3.event.dy
        d3.select(this).attr('cx', d.x).attr('cy', d.y)
        links.each(function(l) {
          if (l.source == i) {
            d3.select(this).attr('x1', d.x).attr('y1', d.y)
          } else if (l.target == i) {
            d3.select(this).attr('x2', d.x).attr('y2', d.y)
          }
        })
      })

    const nodes = g.selectAll('.node')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('cx', function(d) {
        return d.x
      })
      .attr('cy', function(d) {
        return d.y
      })
      .attr('r', 10)
      .attr('fill', function(d, i) {
        return c10(i)
      })
      .call(drag)
      .on('click', () => callbacks.onclick !== undefined ? callbacks.onclick() : null)
      .on('dblclick', () =>
        callbacks.ondblclick !== undefined ? callbacks.ondblclick() : null)

    return {links, nodes}
  }
}
