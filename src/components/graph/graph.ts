import * as d3 from 'd3'
import {Observable, Subject} from 'rxjs'

import {registerContextMenu, showContextMenu} from '@lib/context-menu'
import {getLogger} from '@lib/logger'
import {
  El,
  GraphNodeId,
  IDimensions,
  IGraphChildParentIndex,
  IGraphData,
  IGraphNodeData,
  ILinkTuple,
  IPosition,
} from '@lib/types'
import {assertNever, cartesianDistance} from '@lib/utils'
import * as graphTransform from './graph-transform'
import {GraphTransformType} from './graph-transform'
import {
  flattenGraphIndex,
  graphMetadataToList,
  makeChildParentIndex,
} from './graph-utils'
import {
  BackgroundClickAction,
  BackgroundDblClickAction,
  CreateNewNodeAction,
  DeleteNodeAction,
  EditNodeAction,
  FOCUS_TYPE,
  GraphAction,
  GraphCommand,
  NodeClickAction,
  NodeDblClickAction,
  NodeDragAction,
  NodeHoverEndAction,
  NodeHoverShortAction,
  NodeRightClickAction,
  RESET_GRAPH_TYPE,
  ZoomAction,
} from './types'

import './graph.css'

const logger = getLogger('d3-graph')

interface ITransform { translation: IPosition, scale: number }
interface ICorner { minX: number, maxX: number, minY: number, maxY: number }
interface IExtendedGraphData extends IGraphData {
  metadataItems: IGraphNodeData[]
  childParentIndex: IGraphChildParentIndex
  linkData: ILinkTuple[]
}

export default class GraphComponent {

  private static readonly _LABEL_FONT_SIZE = 20
  private static readonly _NODE_STROKE = 5
  private static readonly _NODE_STROKE_HOVER = 9
  private static readonly _NODE_STROKE_COLOR = 'black'
  private static readonly _NODE_STROKE_COLOR_SELECTED = 'purple'
  private static readonly _NODE_HEIGHT = 48
  private static readonly _NODE_WIDTH = 192

  private static readonly _LINK_STROKE_COLOR = 'black'
  private static readonly _LINK_STROKE = 9
  private static readonly _LINK_STROKE_HOVER = 16

  private static readonly _TRANSITION_DURATION = 250
  private static readonly _PAN_MOVEMENT_OFFSET = 50

  private static readonly _ZOOM_MIN = 0.25
  private static readonly _ZOOM_MAX = 1

  private static readonly _CONTEXT_MENU_NODE_KEY = 'graph.node'
  private static readonly _CONTEXT_MENU_BACKGROUND_KEY = 'graph.background'

  /*
   * This value is the time it takes in ms (milliseconds) for a single click
   * to be registered, correspondingly it is also the time remaining to click
   * a second time in order for a double click to be registered.
   */
  private static readonly _SINGLE_CLICK_DELAY: number = 300

  private _width: number = -1
  private _height: number = -1

  private _svg: any | null = null
  // @ts-ignore // no unused variable
  private _c10: any | null = null
  private _g: any | null = null
  private _gNodes: any | null = null
  private _gLinks: any | null = null
  private _zoomHandler: any | null = null

  private _links: any | null = null
  private _nodes: any | null = null
  private _drag: any | null = null

  private _selectedNode: GraphNodeId | null = null

  private _actionStream: Subject<GraphAction> | null = null

  private _lastClickWasSingle: boolean = false

  private _locationFocusedLocation: null | IPosition = null
  private _lastRightClickLocation: null | IPosition = null

  private _graphData: null | IExtendedGraphData = null
  private _dimensions: null | IDimensions = null

  private get _d3Initialized(): boolean { return (document as any).d3Initialized }
  private set _d3Initialized(value: boolean) { (document as any).d3Initialized = value }

  public constructor() {
    this._d3Initialized = false
  }

  /**
   * Initialize graph component.
   * Must be called prior to calling `render`.
   */
  public init(
    host: El,
    dimensions: IDimensions,
    actionStream: Subject<GraphAction>,
    commandStream: Observable<GraphCommand>,
  ): void {
    if (this._d3Initialized
        && dimensions.height === this._height
        && dimensions.width === this._width) {
      return
    }

    if (this._d3Initialized)
      if (this._svg !== null) {
        logger.debug('Removing existing svg element')
        this._svg.remove()
        this._svg = null
      } else {
        logger.debug('Can not remove svg, it has not been set')
      }

    graphTransform.initializeGraphTransform()

    this._d3Initialized = true
    this._height = dimensions.height
    this._width = dimensions.width
    // Used for node coloring
    this._c10 = d3.scaleOrdinal(d3.schemeCategory10)
    this._actionStream = actionStream
    this._svg = this._createSvg(host, dimensions)
    this._g = this._svg.append('g')
      .attr('class', 'everything')
    this._gLinks = this._g.append('g')
      .attr('class', 'links')
    this._gNodes = this._g.append('g')
      .attr('class', 'nodes')

    const zoomActions = () => {
      this._g.attr('transform', d3.event.transform)
      graphTransform.updateGraphTransform(this._graphTransformToString())
    }
    this._zoomHandler = d3.zoom()
      .scaleExtent([GraphComponent._ZOOM_MIN, GraphComponent._ZOOM_MAX])
      .on('zoom.a', zoomActions)
      .on('zoom.b', () => actionStream.next(new ZoomAction()))
    // Handle zooming on SVG
    this._zoomHandler(this._svg)

    const transform = graphTransform.getGraphTransform()
    if (transform !== null)
      this._svg
        .call(
          this._zoomHandler.transform,
          d3.zoomIdentity
            .translate(transform[0], transform[1])
            .scale(transform[2]),
        )

    commandStream.subscribe((cmd: GraphCommand) => this._handleCommandStream(cmd))

    this._registerContextMenus()
  }

  /**
   * Render graph.
   * Must be call after `init` has been called.
   */
  public render(dimensions: IDimensions, data: IGraphData): void {
    if (data === null) {
      logger.log('No data for rendering')
      return
    }

    if (this._graphData
        && this._graphData.index === data.index
        && this._graphData.metadata === data.metadata
        && this._dimensions
        && this._dimensions.height === dimensions.height
        && this._dimensions.width === dimensions.width) {
      logger.log('No data has changed, skipping render')
      return
    }

    this._dimensions = dimensions
    this._graphData = {
      ...data,
      metadataItems: graphMetadataToList(data.metadata),
      childParentIndex: makeChildParentIndex(data.index),
      linkData: flattenGraphIndex(data.index),
    }

    if (this._dimensions.width === 0 || this._dimensions.height === 0) {
      logger.log('Editor dimensions are too small. Skipping render')
    }

    // Must be called before `renderNodes`
    this._enableDrag()

    this._renderLinks()
    this._renderNodes()

    this._enableClickToCenter()
    this._enableKeyboardPanning()
    this._enableNodeHighlightOnHover()
    this._enableLinkHighlightOnHover()
    this._enableLinkClickJumpingToOppositeNode()
    this._disableDoubleClickZoom()

    // Focus graph on last clicked location
    this._focusGraph()
  }

  public _registerContextMenus(): void {
    registerContextMenu(GraphComponent._CONTEXT_MENU_NODE_KEY, [
      {
        label: 'New child note',
        click: () => setTimeout(() => {
          const {x: nodeX, y: nodeY} = this._graphData!.metadata[this._selectedNode!]
          const position = {
            x: nodeX + GraphComponent._NODE_WIDTH / 4,
            y: nodeY + GraphComponent._NODE_HEIGHT * 2,
          }
          this._actionStream!.next(
            new CreateNewNodeAction(position, this._selectedNode!))
        }, 50),
      },
      {type: 'separator'},
      {
        label: 'Edit',
        click: () => {
          this._actionStream!.next(new EditNodeAction(this._selectedNode!))
        },
      },
      {type: 'separator'},
      {
        label: 'Make Parent of...',
        enabled: false,
        click: () => {
          logger.log('Make parent of...')
        },
      },
      {
        label: 'Make Child of...',
        enabled: false,
        click: () => {
          logger.log('Make child of...')
        },
      },
      {type: 'separator'},
      {
        label: 'Delete',
        click: () => setTimeout(() => {
          this._actionStream!.next(new DeleteNodeAction(this._selectedNode!))
        }, 50),
      },
    ])
    registerContextMenu(GraphComponent._CONTEXT_MENU_BACKGROUND_KEY, [
      {
        label: 'New note',
        click: () => setTimeout(() => {
          this._actionStream!.next(
            new CreateNewNodeAction(this._lastRightClickLocation!, null))
        }, 50),
      },
    ])
  }

  private _createSvg(host: El, dimensions: IDimensions) {
    const svg = d3.select(host)
      .append('svg')
      .attr('id', 'graph')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .on('contextmenu', () => {
        const position = this._svgToGraphPosition({
          x: d3.event.clientX,
          y: d3.event.clientY,
        })
        this._locationFocusedLocation = null
        this._lastRightClickLocation = position
        this._setSelectedNode(null)
        showContextMenu(GraphComponent._CONTEXT_MENU_BACKGROUND_KEY)
      })
      .on('click', () => {
        this._setSelectedNode(null)
        d3.event.stopPropagation()
        const position = this._svgToGraphPosition({
          x: d3.event.clientX,
          y: d3.event.clientY,
        })
        this._lastClickWasSingle = true
        this._locationFocusedLocation = null
        setTimeout(() => {
          if (this._lastClickWasSingle) {
            this._actionStream!.next(new BackgroundClickAction(position))
          }
        }, GraphComponent._SINGLE_CLICK_DELAY)
      })
      .on('dblclick', () => {
        this._setSelectedNode(null)
        d3.event.stopPropagation()
        this._lastClickWasSingle = false
        const position = this._svgToGraphPosition({
          x: d3.event.clientX,
          y: d3.event.clientY,
        })
        this._actionStream!.next(new BackgroundDblClickAction(position))
      })
    return svg
  }

  private _renderNodes(): void {
    const existingNodes = this._gNodes.selectAll('.node')

    const newNodes = existingNodes
      // NOTE: Key-function provides D3 with information about which datum maps to which
      // element. This allows arrays in different orders to work as expected
      .data(this._graphData!.metadataItems, (d: IGraphNodeData) => d.id)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: IGraphNodeData) => {
        const x = d.x - GraphComponent._NODE_WIDTH / 2
        const y = d.y - GraphComponent._NODE_HEIGHT / 2
        return `translate(${x}, ${y}) scale(1)`
      })
      .on('click', (d: IGraphNodeData) => this._onNodeClick(d))
      .on('contextmenu', (d: IGraphNodeData) => this._onNodeContextMenu(d))
      .on('dblclick', (d: IGraphNodeData) => this._onNodeDblClick(d))
      .on('mouseover.action', (d: IGraphNodeData) => this._onNodeMouseOver(d))
      .on('mouseout.action', (d: IGraphNodeData) => this._onNodeMouseOut(d))
      .call(this._drag)

    // Node circles
    newNodes
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', GraphComponent._NODE_WIDTH)
      .attr('height', GraphComponent._NODE_HEIGHT)
      .attr('fill', 'white')
      .attr('stroke', (d: IGraphNodeData) => this._getNodeColor(d.id))
      .attr('stroke-width', GraphComponent._NODE_STROKE + 'px')

    newNodes
      .append('text')
      .attr('x', 16)
      .attr(
        'y', GraphComponent._NODE_HEIGHT / 2 + GraphComponent._LABEL_FONT_SIZE / 2 - 2)
      .attr('font-size', GraphComponent._LABEL_FONT_SIZE)
      .attr('width', GraphComponent._NODE_WIDTH)
      .attr('height', GraphComponent._NODE_HEIGHT)
      .text((d: IGraphNodeData) =>
        d.title.length > 17 ? d.title.substr(0, 17 - 3) + '...' : d.title)

    existingNodes
      // NOTE: Key-function provides D3 with information about which datum maps to which
      // element. This allows arrays in different orders to work as expected
      .data(this._graphData!.metadataItems, (d: IGraphNodeData) => d.id)
      .exit()
      .remove()

    this._nodes = this._g.selectAll('.node')
  }

  private _getNodeColor(nodeId: GraphNodeId): string {
    return this._selectedNode === nodeId
      ? GraphComponent._NODE_STROKE_COLOR_SELECTED
      : GraphComponent._NODE_STROKE_COLOR
  }

  private _renderLinks(): void {

    const existingLinks = this._gLinks.selectAll('.link')

    existingLinks
      // NOTE: Key-function provides D3 with information about which datum maps to which
      // element. This allows arrays in different orders to work as expected
      .data(this._graphData!.linkData, (l: ILinkTuple) => l.id)
      .enter()
      .append('line')
      .attr('class', (l: ILinkTuple) => 'link link-' + l.source + '-' + l.target)
      .attr('x1', (l: ILinkTuple, i: number, refs: any[]) => {
        const sourceNode = this._graphData!.metadataItems.filter(
          (d: IGraphNodeData) => d.id === l.source)[0]
        d3.select(refs[i]).attr('y1', sourceNode.y)
        return sourceNode.x
      })
      .attr('x2', (l: ILinkTuple, i: number, refs: any[]) => {
        const targetNode = this._graphData!.metadataItems.filter(
          (d: IGraphNodeData) => d.id === l.target)[0]
        d3.select(refs[i]).attr('y2', targetNode.y)
        return targetNode.x
      })
      .attr('fill', 'none')
      .attr('stroke', GraphComponent._LINK_STROKE_COLOR)
      .attr('stroke-width', GraphComponent._LINK_STROKE + 'px')

    existingLinks
      // NOTE: Key-function provides D3 with information about which datum maps to which
      // element. This allows arrays in different orders to work as expected
      .data(this._graphData!.linkData, (l: ILinkTuple) => l.id)
      .exit()
      .remove()

    this._links = this._g.selectAll('.link')
  }

  private _handleCommandStream(command: GraphCommand): void {
    switch (command.kind) {
      case FOCUS_TYPE:
        if (command.position !== undefined) {
          this._locationFocusedLocation = command.position
          this._focusGraph()
        } else if (command.nodeId !== undefined) {
          const node = this._graphData!.metadata[command.nodeId]
          this._locationFocusedLocation = {x: node.x, y: node.y}
          this._setSelectedNode(command.nodeId)
          this._focusGraph()
        } else {
          logger.warn('Focus comamnd does not contain a position or a nodeId')
        }
        break
      case RESET_GRAPH_TYPE:
        this._resetPosition()
        break
      default:
        assertNever(command)
    }
  }

  private _resetPosition(): void {
    this._svg
      .transition()
      .duration(GraphComponent._TRANSITION_DURATION)
      .call(
        this._zoomHandler.transform,
        d3.zoomIdentity.translate(0, 0).scale(1),
      )
  }

  /**
   * Center graph on _locationFocusedLocation
   */
  private _focusGraph(): void {
    // TODO: Rework _locationFocusedLocation maybe (so it doesn't have to get set for this
    //   method to work, maybe it can be an optional parameter to override the previous
    //   location otherwise it will set the graph to the existing value on the variable)
    if (!this._locationFocusedLocation) return

    const transform = this._getGraphTranslationAndScale()
    const position = this._graphToSVGPosition(this._locationFocusedLocation)
    const x = transform.translation.x + this._width / 2 - position.x
    const y = transform.translation.y + this._height / 2 - position.y

    this._svg
      .transition()
      .duration(GraphComponent._TRANSITION_DURATION)
      .call(
        this._zoomHandler.transform,
        d3.zoomIdentity.translate(x, y).scale(transform.scale),
      )
  }

  private _onNodeClick(d: IGraphNodeData): void {
    this._setSelectedNode(d.id)
    d3.event.stopPropagation()
    this._lastClickWasSingle = true
    setTimeout(() => {
      if (this._lastClickWasSingle) {
        this._actionStream!.next(new NodeClickAction(d.id))
      }
    }, GraphComponent._SINGLE_CLICK_DELAY)
  }

  private _onNodeDblClick(d: IGraphNodeData): void {
    d3.event.stopPropagation()
    this._lastClickWasSingle = false
    this._actionStream!.next(new NodeDblClickAction(d.id))
  }

  private _onNodeContextMenu(d: IGraphNodeData): void {
    this._setSelectedNode(d.id)
    // TODO make menu label a constant
    showContextMenu(GraphComponent._CONTEXT_MENU_NODE_KEY)
    d3.event.stopPropagation()
    this._actionStream!.next(new NodeRightClickAction(d.id))
  }

  private _onNodeMouseOver(d: IGraphNodeData): void {
    d3.event.stopPropagation()
    this._actionStream!.next(new NodeHoverShortAction(d.id))
  }

  private _onNodeMouseOut(d: IGraphNodeData): void {
    d3.event.stopPropagation()
    this._actionStream!.next(new NodeHoverEndAction(d.id))
  }

  // EXTENDED GRAPH FUNCTIONALITY //////////////////////////////////////////////

  /**
   * Jump to other side of the link on click
   */
  private _enableLinkClickJumpingToOppositeNode() {
    this._links
      .on('click', (d: ILinkTuple) => {
        d3.event.stopPropagation()

        const position = this._svgToGraphPosition({
          x: d3.event.clientX,
          y: d3.event.clientY,
        })
        const sourceNode = this._graphData!.metadata[d.source]
        const targetNode = this._graphData!.metadata[d.target]

        const distToSource = cartesianDistance(position, sourceNode)
        const distToTarget = cartesianDistance(position, targetNode)

        this._setSelectedNode(
          (distToSource < distToTarget) ? targetNode.id : sourceNode.id)

        this._locationFocusedLocation = (distToSource < distToTarget)
           ? {x: targetNode.x, y: targetNode.y}
           : {x: sourceNode.x, y: sourceNode.y}
        this._focusGraph()
      })
  }

  private _enableDrag(): void {
    this._drag = d3.drag()
    this._drag
      .on('drag', (d: IGraphNodeData, i: number, refs: any[]) => {
        // TODO: A refactor of this logic may be good. Reduce duplication and handle
        // updates in a nicer way regardless of whether a text label was used to drag a
        // node of node itself

        // NOTE: If node labels change such that they are not outside the node circle --
        // as it is currently -- then there is no need to handle dragging on the labels

        this._setSelectedNode(d.id)

        d.x += d3.event.dx
        d.y += d3.event.dy

        // Update link positions
        this._links.each((l: ILinkTuple, i_: number, refs_: any[]) => {
          if (l.source === d.id)
            d3.select(refs_[i_])
              .attr('x1', d.x)
              .attr('y1', d.y)
          else if (l.target === d.id)
            d3.select(refs_[i_])
              .attr('x2', d.x)
              .attr('y2', d.y)
        })

        // Update node position
        this._nodes.each((n: IGraphNodeData, i_: number, refs_: any[]) => {
          if (n.id === d.id)
            d3.select(refs_[i_])
              .attr('transform', () => {
                const x = d.x - GraphComponent._NODE_WIDTH / 2
                const y = d.y - GraphComponent._NODE_HEIGHT / 2
                return `translate(${x}, ${y}) scale(1)`
              })
        })

        this._actionStream!.next(new NodeDragAction(d.id, {x: d.x, y: d.y}))
      })
  }

  private _enableClickToCenter(): void {
    this._nodes.on('click.centerOnNode', (d: IGraphNodeData) => {
      this._locationFocusedLocation = {x: d.x, y: d.y}
      const transform = this._getGraphTranslationAndScale()
      const position = this._graphToSVGPosition(d)
      const x = transform.translation.x + this._width / 2 - position.x
      const y = transform.translation.y + this._height / 2 - position.y
      this._svg
        .transition()
        .duration(GraphComponent._TRANSITION_DURATION)
        .call(
          this._zoomHandler.transform,
          d3.zoomIdentity.translate(x, y).scale(transform.scale),
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
      .on('keydown', () => {
        const transform = this._getGraphTranslationAndScale()
        let offsetRight = transform.translation.x
        let offsetDown = transform.translation.y
        switch (d3.event.keyCode) {
          case keymap.DOWN:
            offsetDown = transform.translation.y - GraphComponent._PAN_MOVEMENT_OFFSET
            break
          case keymap.UP:
            offsetDown = transform.translation.y + GraphComponent._PAN_MOVEMENT_OFFSET
            break
          case keymap.RIGHT:
            offsetRight = transform.translation.x - GraphComponent._PAN_MOVEMENT_OFFSET
            break
          case keymap.LEFT:
            offsetRight = transform.translation.x + GraphComponent._PAN_MOVEMENT_OFFSET
            break
          default:
            break
        }

        this._svg
          .transition()
          .duration(GraphComponent._TRANSITION_DURATION / 5)
          .call(
            this._zoomHandler.transform,
            d3.zoomIdentity.translate(offsetRight, offsetDown).scale(transform.scale),
          )

        graphTransform.updateGraphTransform(this._graphTransformToString())
        this._actionStream!.next(new ZoomAction())
      })
  }

  private _enableNodeHighlightOnHover(): void {
    this._nodes
      .on('mouseover', (d: IGraphNodeData, i: number, refs: any[]) => {
        d3.select(refs[i])
          .select('rect')
          .attr('stroke-width', GraphComponent._NODE_STROKE_HOVER + 'px')
      })
      .on('mouseout', (d: IGraphNodeData, i: number, refs: any[]) => {
        d3.select(refs[i])
          .select('rect')
          .attr('stroke-width', GraphComponent._NODE_STROKE + 'px')
      })
  }

  private _enableLinkHighlightOnHover(): void {
    this._links
      .on('mouseover', (d: IGraphNodeData, i: number, refs: any[]) => {
        d3.select(refs[i])
          .attr('stroke-width', GraphComponent._LINK_STROKE_HOVER + 'px')
      })
      .on('mouseout', (d: IGraphNodeData, i: number, refs: any[]) => {
        d3.select(refs[i])
          .attr('stroke-width', GraphComponent._LINK_STROKE + 'px')
      })
  }

  private _disableDoubleClickZoom(): void {
    this._svg.on('dblclick.zoom', null)
  }

  // UTILITIES /////////////////////////////////////////////////////////////////

  private _setSelectedNode(id: GraphNodeId | null): void {
    if (this._selectedNode === id) return

    if (this._selectedNode !== null)
      this._nodes
        .filter((d: IGraphNodeData) => d.id === this._selectedNode)
        .selectAll('rect')
        .attr('stroke-width', GraphComponent._NODE_STROKE)
        .attr('stroke', GraphComponent._NODE_STROKE_COLOR)

    if (id !== null)
      this._nodes
        .filter((d: IGraphNodeData) => d.id === id)
        .selectAll('rect')
        .attr('stroke-width', GraphComponent._NODE_STROKE_HOVER)
        .attr('stroke', GraphComponent._NODE_STROKE_COLOR_SELECTED)

    logger.debug('Setting selected node to', id)
    this._selectedNode = id
  }

  private _getGraphTranslationAndScale(): ITransform {
    const transformRaw = this._g.attr('transform')
    const transform: ITransform = {translation: {x: 0, y: 0}, scale: 1}
    if (transformRaw === null) return transform
    const [translationRaw, scaleRaw] = transformRaw.split(' ')
    const translationValues = translationRaw
      .replace('translate(', '')
      .replace(')', '')
      .split(',')
      .map((v: string) => v === 'NaN' ? 0 : Number(v))
    transform.translation = {x: translationValues[0], y: translationValues[1]}
    const scaleValueRaw = scaleRaw.match(/\d(\.\d+)*/)
    transform.scale = scaleValueRaw !== null ? Number(scaleValueRaw[0]) : 1
    return transform
  }

  private _graphToSVGPosition(d: IPosition): IPosition {
    const corners = this._getGraphCornerPoints()
    const position = {
      x: this._width * (d.x - corners.minX) / (corners.maxX - corners.minX),
      y: this._height * (d.y - corners.minY) / (corners.maxY - corners.minY),
    }
    return position
  }

  private _svgToGraphPosition(d: IPosition): IPosition {
    const corners = this._getGraphCornerPoints()
    const position = {
      x: (d.x / this._width) * (corners.maxX - corners.minX) + corners.minX,
      y: (d.y / this._height) * (corners.maxY - corners.minY) + corners.minY,
    }
    return position
  }

  private _getGraphCornerPoints(): ICorner {
    const transform = this._getGraphTranslationAndScale()
    const corners: ICorner = {
      minX: -transform.translation.x / transform.scale,
      maxX: this._width / transform.scale - transform.translation.x / transform.scale,
      minY: -transform.translation.y / transform.scale,
      maxY: this._height / transform.scale - transform.translation.y / transform.scale,
    }
    return corners
  }

  private _graphTransformToString(): GraphTransformType {
    const transform = this._getGraphTranslationAndScale()
    return [transform.translation.x, transform.translation.y, transform.scale]
  }

}
