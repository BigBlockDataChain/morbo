/**
 * TODO
 * - Keep track of transformation to graph (translation and scale) when rerendering
 * - Use correct D3 types instead of `any`
 */

import * as d3 from 'd3'
import * as d3zoom from 'd3-zoom'

import {getLogger} from '../../logger'
import {El, IDimensions, IGraphData} from '../../types'

const logger = getLogger('d3-graph')

export default class D3Graph {

  private static readonly _LABEL_FONT_SIZE = 8
  private static readonly _TRANSITION_DURATION = 250
  private static readonly _PAN_MOVEMENT_OFFSET = 50

  private _width: number | null = null
  private _height: number | null = null
  private _host: El | null = null
  private _svg: any | null = null
  private _c10: any | null = null
  private _g: any | null = null
  private _zoomHandler: any| null = null

  private _links: any | null = null
  private _nodes: any | null = null
  private _drag: any | null = null
  private _nodeTextLabels: any| null = null

  private _selectedNode: any | null = null
  private _mouseDownNode: any | null = null

  public constructor() {
    (document as any).d3Initialized = false
  }

  public init(host: El, dimensions: IDimensions): void {
    if ((document as any).d3Initialized
        && dimensions.height === this._height
        && dimensions.width === this._width) {
      logger.debug('Nothing changed, skipping init')
      return
    }

    if ((document as any).d3Initialized)
      if (this._svg !== null) {
        logger.debug('Removing existing svg element')
        this._svg.remove()
        this._svg = null
      } else {
        logger.debug('Can not remove svg, it has not been set')
      }

    (document as any).d3Initialized = true
    this._host = host

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
  public render(data: IGraphData, callbacks: any = {}): void {
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
  private _renderNodes(data: IGraphData, callbacks: any): void {
    const nodes = this._g.selectAll('.node')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .on('click', (ev: Event) =>
        callbacks.onclick !== undefined ? callbacks.onclick(ev) : null)
      .on('dblclick', (ev: Event) =>
        callbacks.ondblclick !== undefined ? callbacks.ondblclick(ev) : null)

    nodes
      .append('circle')
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y)
      .attr('r', 10)
      .attr('fill', (d: any) => d.color)
      .attr('fill_original', (d: any) => d.color)
      .attr('stroke', 'black')
      .call(this._drag)
      .on('dblclick.zoom', null)

    nodes
      .append('text')
      .text((d: any) => d.name)
      .attr('x', (d: any) => d.x + D3Graph._LABEL_FONT_SIZE / 2)
      .attr('y', (d: any) => d.y + 15)
      .attr('font-size', D3Graph._LABEL_FONT_SIZE)
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
  private _renderLinks(data: IGraphData): void {
    this._links = this._g.selectAll('.link')
    this._links
      .data(data.links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('x1', (l: any, i: number, refs: any[]) => {
        const sourceNode = data.nodes.filter((d: any) => d.id === l.source)[0]
        d3.select(refs[i]).attr('y1', sourceNode.y)
        return sourceNode.x
      })
      .attr('x2', (l: any, i: number, refs: any[]) => {
        const targetNode = data.nodes.filter((d: any) => d.id === l.target)[0]
        d3.select(refs[i]).attr('y2', targetNode.y)
        return targetNode.x
      })
      .attr('fill', 'none')
      .attr('stroke', 'black')
  }

  /**
   * @private
   * @returns {undefined}
   */
  private _enableDrag(): void {
    this._drag = d3.drag()
    this._drag
      .on('drag', (d: any, i: number, refs: any[]) => {
        d.x += d3.event.dx
        d.y += d3.event.dy

        d3.select(refs[i])
          .attr('cx', d.x)
          .attr('cy', d.y)

        this._links.each((l: any, i_: number, refs_: any[]) => {
          if (l.source === d.id)
            d3.select(refs_[i_])
              .attr('x1', d.x)
              .attr('y1', d.y)
          else if (l.target === d.id)
            d3.select(refs_[i_])
              .attr('x2', d.x)
              .attr('y2', d.y)
        })

        if (this._nodeTextLabels === null)
          logger.warn(
            'enableDrag called before this._nodeTextLabels has been initialized')
        else
          this._nodeTextLabels.each((n: any, i_: number, refs_: any[]) => {
            if (n.id === d.id)
              d3.select(refs_[i_])
                .attr('x', d.x + D3Graph._LABEL_FONT_SIZE / 2)
                .attr('y', d.y + 15)
          })

        this._nodes.each((n: any, i_: number, refs_: any[]) => {
          if (n.id === d.id)
            d3.select(refs_[i_]).select('circle')
              .attr('cx', d.x)
              .attr('cy', d.y)
        })
      })
  }

  /**
   * @private
   * @return {undefined}
   */
  private _enableClickToCenter(): void {
    this._nodes.on('click', (d: any) => {
      const {translation, scale} = this._getGraphTranslationAndScale()
      const x = translation[0] - d.x
      const y = translation[1] - d.y
      this._g
        .transition()
        .duration(D3Graph._TRANSITION_DURATION)
        .call(
          this._zoomHandler.transform,
          d3.zoomIdentity.translate(x, y).scale(scale),
        )
    })
  }

  private _enableKeyboardPanning(): void {
    const keymap = {
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
    }

    d3.select('body')
      .on('keyup', () => {
        const {translation} = this._getGraphTranslationAndScale()
        let offsetRight = 0
        let offsetDown = 0

        switch (d3.event.keyCode) {
          case keymap.UP:
            offsetDown = translation[1] - D3Graph._PAN_MOVEMENT_OFFSET
            break
          case keymap.DOWN:
            offsetDown = translation[1] + D3Graph._PAN_MOVEMENT_OFFSET
            break
          case keymap.LEFT:
            offsetRight = translation[0] - D3Graph._PAN_MOVEMENT_OFFSET
            break
          case keymap.RIGHT:
            offsetRight = translation[0] + D3Graph._PAN_MOVEMENT_OFFSET
            break
          default:
            break
        }

        this._g
          .transition()
          .duration(D3Graph._TRANSITION_DURATION)
          .call(
            this._zoomHandler.transform,
            d3.zoomIdentity.translate(offsetRight, offsetDown),
          )
      })
  }

  private _enableNodeHighlightOnHover(): void {
    this._nodes
      .on('mouseover', (d: any, i: number, refs: any[]) => {
        d3.select(refs[i])
          .style('stroke-width', '2px')
      })
      .on('mouseout', (d: any, i: number, refs: any[]) => {
        d3.select(refs[i])
          .style('stroke-width', '1px')
      })
  }

  /**
   * @private
   * @returns {undefined}
   */
  private _disableDoubleClickZoom(): void {
    this._svg.on('dblclick.zoom', null)
  }

  /**
   * @private
   * @return {{array, number}} A tuple of the x, y translation and the zoom scale
   */
  private _getGraphTranslationAndScale(): {translation: number[], scale: number} {
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
