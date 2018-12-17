/**
 * TODO
 * - Keep track of transformation to graph (translation and scale) when rerendering
 */

import * as d3 from 'd3'
import * as d3zoom from 'd3-zoom'

import {getLogger} from './logger'

const logger = getLogger('d3-graph')

export default class D3Graph {

  constructor() {
    this._LABEL_FONT_SIZE = 8
    this._TRANSITION_DURATION = 250
    this._PAN_MOVEMENT_OFFSET = 50

    document.d3Initialized = false
    this._width = null
    this._height = null
    this._host = null
    this._svg = null
    this._c10 = null
    this._g = null
    this._zoomHandler = null

    this._links = null
    this._nodes = null
    this._drag = null
    this._nodeTextLabels = null

    this._selectedNode = null
    this._mouseDownNode = null
  }

  init(host, dimensions) {
    if (host === null) {
      throw Error('Host not provided')
    }

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
    this._zoomHandler = d3zoom.zoom()
      .on('zoom', zoomActions)

    this._zoomHandler(this._svg)
  }

  /**
   * @param {Object} data Object containing nodes and links
   * @param {Object} callbacks Object containing callbacks
   * @return {undefined}
   */
  render(data, callbacks = {}) {
    if (data === null) {
      logger.log('No data for rendering')
      return
    }

    logger.debug('Drawing graph nodes and links')

    // Must be called before renderNodes
    this._enableDrag()

    this._renderLinks(data)
    this._renderNodes(data, callbacks)

    // this._enableClickToCenter()
    this._enableKeyboardPanning()
    this._enableNodeHighlightOnHover()
    this._disableDoubleClickZoom()
  }

  /**
   * @private
   * @param {Object} data Object containing nodes and links
   * @param {Object} callbacks Object containing callbacks
   * @returns {undefined}
   */
  _renderNodes(data, callbacks) {
    const nodes = this._g.selectAll('.node')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .on('click', ev =>
        callbacks.onclick !== undefined ? callbacks.onclick(ev) : null)
      .on('dblclick', ev =>
        callbacks.ondblclick !== undefined ? callbacks.ondblclick(ev) : null)

    nodes
      .append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 10)
      .attr('fill', (d, i) => d.color)
      .attr('fill_original', (d, i) => d.color)
      .attr('stroke', 'black')
      .call(this._drag)
      .on('dblclick.zoom', null)

    nodes
      .append('text')
      .text(d => d.name)
      .attr('x', d => d.x + this._LABEL_FONT_SIZE / 2)
      .attr('y', d => d.y + 15)
      .attr('font-size', this._LABEL_FONT_SIZE)
      .attr('fill', 'black')
      .call(this._drag)

    this._nodes = this._g.selectAll('.node')
    this._nodeTextLabels = this._nodes.selectAll('text')
  }

  /**
   * @private
   * @param {Object} data Object containing nodes and links
   * @returns {undefined}
   */
  _renderLinks(data) {
    this._links = this._g.selectAll('.link')
    this._links
      .data(data.links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('x1', function(l) {
        const sourceNode = data.nodes.filter(d => d.id == l.source)[0]
        d3.select(this).attr('y1', sourceNode.y)
        return sourceNode.x
      })
      .attr('x2', function(l) {
        const targetNode = data.nodes.filter(d => d.id == l.target)[0]
        d3.select(this).attr('y2', targetNode.y)
        return targetNode.x
      })
      .attr('fill', 'none')
      .attr('stroke', 'black')
  }

  /**
   * @private
   * @returns {undefined}
   */
  _enableDrag() {
    const that = this

    this._drag = d3.drag()
    this._drag
      .on('drag', function(d) {
        d.x += d3.event.dx
        d.y += d3.event.dy

        d3.select(this)
          .attr('cx', d.x)
          .attr('cy', d.y)

        that._links.each(function(l) {
          if (l.source === d.id)
            d3.select(this)
              .attr('x1', d.x)
              .attr('y1', d.y)
          else if (l.target === d.id)
            d3.select(this)
              .attr('x2', d.x)
              .attr('y2', d.y)
        })

        if (that._nodeTextLabels === null)
          logger.warn(
            'enableDrag called before this._nodeTextLabels has been initialized')
        else
          that._nodeTextLabels.each(function(n) {
            if (n.id == d.id)
              d3.select(this)
                .attr('x', d.x + that._LABEL_FONT_SIZE / 2)
                .attr('y', d.y + 15)
          })

        that._nodes.each(function(n) {
          if (n.id == d.id)
            d3.select(this).select('circle')
              .attr('cx', d.x)
              .attr('cy', d.y)
        })
      })
  }

  /**
   * @private
   * @return {undefined}
   */
  _enableClickToCenter() {
    const that = this
    this._nodes.on('click', function(d) {
      const {translation, scale} = that._getGraphTranslationAndScale()
      const x = translation[0] - d.x
      const y = translation[1] - d.y
      that._g
        .transition()
        .duration(that._TRANSITION_DURATION)
        .call(
          that._zoomHandler.transform,
          d3.zoomIdentity.translate(x, y).scale(scale)
        )
    })
  }

  _enableKeyboardPanning() {
    const keymap = {
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
    }

    const that = this
    d3.select('body')
      .on('keyup', function() {
        const {translation} = that._getGraphTranslationAndScale()
        let offsetRight = 0
        let offsetDown = 0

        switch (d3.event.keyCode) {
          case keymap.UP:
            offsetDown = translation[1] - that._PAN_MOVEMENT_OFFSET
            break
          case keymap.DOWN:
            offsetDown = translation[1] + that._PAN_MOVEMENT_OFFSET
            break
          case keymap.LEFT:
            offsetRight = translation[0] - that._PAN_MOVEMENT_OFFSET
            break
          case keymap.RIGHT:
            offsetRight = translation[0] + that._PAN_MOVEMENT_OFFSET
            break
          default:
            break
        }

        that._g
          .transition()
          .duration(that._TRANSITION_DURATION)
          .call(
            that._zoomHandler.transform,
            d3.zoomIdentity.translate(offsetRight, offsetDown)
          )
      })
  }

  _enableNodeHighlightOnHover() {
    this._nodes
      .on('mouseover', function(d) {
        d3.select(this)
          .style('stroke-width', '2px')
      })
      .on('mouseout', function(d) {
        d3.select(this)
          .style('stroke-width', '1px')
      })
  }

  /**
   * @private
   * @returns {undefined}
   */
  _disableDoubleClickZoom() {
    this._svg.on('dblclick.zoom', null)
  }

  /**
   * @return {{array, number}} A tuple of the x, y translation and the zoom scale
   */
  _getGraphTranslationAndScale() {
    const transformRaw = this._g.attr('transform')
    if (transformRaw === null) return {translation: [0, 0], scale: 1}
    const [translationRaw, scaleRaw] = transformRaw.split(' ')
    const translation = translationRaw
      .replace('translate(', '')
      .replace(')', '')
      .split(',')
      .map(Number)
    const scale = Number(scaleRaw.match(/\d(\.\d+)*/)[0])
    return {translation, scale}
  }

}
