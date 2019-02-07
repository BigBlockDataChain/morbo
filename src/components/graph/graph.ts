import * as d3 from 'd3'
import {Observable, Subject, Subscription} from 'rxjs'

import {registerContextMenu, showContextMenu} from '@lib/context-menu'
import {getLogger} from '@lib/logger'
import {
  El,
  GraphNodeId,
  IBoundingBox,
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
  intersectLineWithRectange,
  makeChildParentIndex,
} from './graph-utils'
import * as graphTypes from './types'

import './graph.css'

const logger = getLogger('d3-graph')

interface ITransform { translation: IPosition, scale: number }
interface IHomeLocation extends IPosition { scale: number }
interface IExtendedGraphData extends IGraphData {
  metadataItems: IGraphNodeData[]
  childParentIndex: IGraphChildParentIndex
  linkData: ILinkTuple[]
}

enum GraphModeKind {
  SET_AS_PARENT = 'setAsParent',
  NORMAL = 'normal',
}

interface IGraphMode {
  kind: GraphModeKind.SET_AS_PARENT | GraphModeKind.NORMAL
}

class GraphMode {
  public static NORMAL: IGraphMode = {kind: GraphModeKind.NORMAL}
  public static SET_AS_PARENT: IGraphMode = {kind: GraphModeKind.SET_AS_PARENT}
}

export default class GraphComponent {

  private static readonly _LABEL_FONT_SIZE = 20
  private static readonly _NODE_STROKE = 5
  private static readonly _NODE_STROKE_HOVER = 9
  private static readonly _NODE_HEIGHT = 48
  private static readonly _NODE_WIDTH = 192

  private static readonly _LINK_STROKE = 9
  private static readonly _LINK_STROKE_HOVER = 16

  private static readonly _TRANSITION_DURATION = 250
  private static readonly _PAN_MOVEMENT_OFFSET = 50

  private static readonly _ZOOM_MIN = 0.25
  private static readonly _ZOOM_MAX = 1

  private static readonly _CONTEXT_MENU_NODE_KEY = 'graph.node'
  private static readonly _CONTEXT_MENU_LINK_KEY = 'graph.link'
  private static readonly _CONTEXT_MENU_BACKGROUND_KEY = 'graph.background'

  /*
   * This value is the time it takes in ms (milliseconds) for a single click
   * to be registered, correspondingly it is also the time remaining to click
   * a second time in order for a double click to be registered.
   */
  private static readonly _SINGLE_CLICK_DELAY: number = 300

  private _commandStreamSub: null | Subscription = null

  private _width: number = -1
  private _height: number = -1

  private _svg: any | null = null
  // @ts-ignore // no unused variable
  private _c10: any | null = null
  private _g: any | null = null
  private _gNewLink: any | null = null
  private _gNodes: any | null = null
  private _gLinks: any | null = null
  private _zoomHandler: any | null = null

  private _links: any | null = null
  private _nodes: any | null = null
  private _drag: any | null = null

  private _selectedNode: GraphNodeId | null = null
  private _homeNode: GraphNodeId | null = null
  private _lastSelectedLink: ILinkTuple | null = null

  private _actionStream: Subject<graphTypes.GraphAction> | null = null

  private _lastClickWasSingle: boolean = false

  private _lastFocusedLocation: null | IPosition = null
  private _lastRightClickLocation: null | IPosition = null

  private _graphData: null | IExtendedGraphData = null
  private _dimensions: null | IDimensions = null

  private _mode: IGraphMode = GraphMode.NORMAL
  private _startNode: null | GraphNodeId = null
  private _targetNode: null | GraphNodeId = null

  private _homeLocation: IHomeLocation = {x: 0, y: 0, scale: 1}

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
    actionStream: Subject<graphTypes.GraphAction>,
    commandStream: Observable<graphTypes.GraphCommand>,
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
    this._gNewLink = this._g.append('g')
      .attr('class', 'new-link')
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
      .on('zoom.b', () => actionStream.next(new graphTypes.ZoomAction()))
      .on('zoom.mode', () => this._handleZoomInMode())
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

    if (this._commandStreamSub == null)
      this._commandStreamSub = commandStream
        .subscribe((cmd: graphTypes.GraphCommand) => this._handleCommandStream(cmd))

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

    const dimensionsChanged
      =  this._dimensions
      && (this._dimensions!.height !== dimensions.height
          || this._dimensions!.width !== dimensions.width)

    this._dimensions = dimensions
    this._updateGraphData(data)

    if (this._dimensions.width === 0 || this._dimensions.height === 0) {
      logger.log('Editor dimensions are too small. Skipping render')
    }

    // Must be called before `renderNodes`
    this._enableDrag()

    this._renderLinks()
    this._renderNodes()

    // NOTE: Disable due to poor user experience when double clicking a node and expecting
    // to be able to edit a node
    // this._enableClickToCenter()
    this._enableKeyboardPanning()
    this._enableNodeHighlightOnHover()
    this._enableLinkHighlightOnHover()
    this._enableLinkClickJumpingToOppositeNode()
    this._disableDoubleClickZoom()

    // Focus graph
    if (this._selectedNode !== null && dimensionsChanged)
      this._lastFocusedLocation = {
        x: this._graphData!.metadata![this._selectedNode].x,
        y: this._graphData!.metadata![this._selectedNode].y,
      }

    this._focusGraph()
  }

  private _registerContextMenus(): void {
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
            new graphTypes.CreateNewNodeAction(position, this._selectedNode!))
        }, 50),
      },
      {type: 'separator'},
      {
        label: 'Edit',
        click: () => {
          this._actionStream!.next(new graphTypes.EditNodeAction(this._selectedNode!))
        },
      },
      {type: 'separator'},
      {
        label: 'Center screen',
        click: () => {
          this._lastFocusedLocation = {
            x: this._graphData!.metadata[this._selectedNode!].x,
            y: this._graphData!.metadata[this._selectedNode!].y,
          }
          this._focusGraph()
        },
      },
      {type: 'separator'},
      {
        label: 'Make Parent of...',
        click: () => this._changeMode(GraphMode.SET_AS_PARENT),
      },
      {type: 'separator'},
      {
        label: 'Delete',
        click: () => setTimeout(() => {
          this._actionStream!.next(new graphTypes.DeleteNodeAction(this._selectedNode!))
        }, 50),
      },
      {type: 'separator'},
      {
        label: 'Set here as home',
        click: () => {
          const node = this._graphData!.metadata![this._selectedNode!]
          this._homeNode = this._selectedNode
          const newHome = this._centreOnPoint(node)
          this._setHomeLocation({
            x: newHome.translation.x,
            y: newHome.translation.y,
            scale: newHome.scale,
          })
        },
      },
    ])
    registerContextMenu(GraphComponent._CONTEXT_MENU_LINK_KEY, [
      {
        label: 'Delete',
        click: () => {
          const {source, target} = this._lastSelectedLink!
          this._actionStream!.next(new graphTypes.DeleteLinkAction(source, target))
        },
      },
    ])
    registerContextMenu(GraphComponent._CONTEXT_MENU_BACKGROUND_KEY, [
      {
        label: 'New note',
        click: () => setTimeout(() => {
          this._actionStream!.next(
            new graphTypes.CreateNewNodeAction(this._lastRightClickLocation!, null))
        }, 50),
      },
      {type: 'separator'},
      {
        label: 'Set here as home',
        click: () => {
          const newHome = this._centreOnPoint(this._lastRightClickLocation!)
          this._setHomeLocation({
            x: newHome.translation.x,
            y: newHome.translation.y,
            scale: newHome.scale,
          })
        },
      },
    ])
  }

  private _createSvg(host: El, dimensions: IDimensions) {
    const svg = d3.select(host)
      .append('svg')
      .attr('id', 'graph')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .on('mousemove', () => this._onBackgroundMoveMove())
      .on('contextmenu', () => this._onBackgroundContextMenu())
      .on('click', () => this._onBackgroundClick())
      .on('dblclick', () => this._onBackgroundDblClick())
    return svg
  }

  private _renderNodes(): void {
    const existingNodes = this._gNodes.selectAll('.node')

    const nodeCircles: {[id: string]: IPosition} = {}
    this._graphData!.metadataItems.forEach((node: IGraphNodeData) => {
      const nodeId = node.id
      const parentId = this._graphData!.childParentIndex[nodeId]
      if (parentId === null) return
      const parent = this._graphData!.metadata[parentId]

      const line = {
        start: {x: node.x, y: node.y},
        end: {x: parent.x, y: parent.y},
      }

      const rect = {
        xMin: node.x - GraphComponent._NODE_WIDTH / 2,
        yMin: node.y - GraphComponent._NODE_HEIGHT / 2,
        xMax: node.x + GraphComponent._NODE_WIDTH / 2,
        yMax: node.y + GraphComponent._NODE_HEIGHT / 2,
      }

      nodeCircles[nodeId] = intersectLineWithRectange(line, rect)
    })

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
      .on('mouseover.action', (d: IGraphNodeData, i: number, refs: any[]) =>
          this._onNodeMouseOver(d, i, refs))
      .on('mouseout.action', (d: IGraphNodeData, i: number, refs: any[]) =>
          this._onNodeMouseOut(d, i, refs))
      .call(this._drag)

    newNodes
      // Add to only nodes with parents
      .filter((d: IGraphNodeData) => nodeCircles[d.id])
      .append('circle')
      .attr('cx', (d: IGraphNodeData) =>
        nodeCircles[d.id].x - d.x + GraphComponent._NODE_WIDTH / 2)
      .attr('cy', (d: IGraphNodeData) =>
        nodeCircles[d.id].y - d.y + GraphComponent._NODE_HEIGHT / 2)
      .attr('r', 16)
      .attr('fill', 'black')

    // Node circles
    newNodes
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', GraphComponent._NODE_WIDTH)
      .attr('height', GraphComponent._NODE_HEIGHT)
      .attr('stroke-width', GraphComponent._NODE_STROKE)

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

  /**
   * Update an rendered node with new metadata
   */
  private _updateRenderedNode(node: IGraphNodeData): void {
    this._nodes
      .filter((d: IGraphNodeData) => d.id === node.id)
      // NOTE: Key-function provides D3 with information about which datum maps to which
      // element. This allows arrays in different orders to work as expected
      .data([node], (d: IGraphNodeData) => d.id)
      .selectAll('text')
      .text((d: IGraphNodeData) => {
        return node.title.length > 17 ? node.title.substr(0, 17 - 3) + '...' : node.title
      })
  }

  private _renderLinks(): void {

    const existingLinks = this._gLinks.selectAll('.link')

    existingLinks
      // NOTE: Key-function provides D3 with information about which datum maps to which
      // element. This allows arrays in different orders to work as expected
      .data(this._graphData!.linkData, (l: ILinkTuple) => l.id)
      .enter()
      .append('line')
      .attr('class', 'link')
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
      .attr('stroke-width', GraphComponent._LINK_STROKE)
      .on('contextmenu', (l: ILinkTuple) => this._onLinkContextMenu(l))

    existingLinks
      // NOTE: Key-function provides D3 with information about which datum maps to which
      // element. This allows arrays in different orders to work as expected
      .data(this._graphData!.linkData, (l: ILinkTuple) => l.id)
      .exit()
      .remove()

    this._links = this._g.selectAll('.link')
  }

  private _handleCommandStream(command: graphTypes.GraphCommand): void {
    switch (command.kind) {
      case graphTypes.FOCUS_TYPE:
        if (command.position !== undefined) {
          this._lastFocusedLocation = command.position
          this._focusGraph()
        } else if (command.nodeId !== undefined) {
          const node = this._graphData!.metadata[command.nodeId]
          this._lastFocusedLocation = {x: node.x, y: node.y}
          this._setSelectedNode(command.nodeId)
          this._focusGraph()
        } else {
          logger.warn('Focus comamnd does not contain a position or a nodeId')
        }
        break
      case graphTypes.RESET_GRAPH_TYPE:
        this._resetPosition()
        break
      case graphTypes.EDIT_NODE_METADATA_TYPE:
        if (!this._graphData) {
          logger.log(
            'Graph data not set. Skipping update to graph data with new metadata')
          break
        }

        this._graphData.metadata[command.node.id] = command.node
        this._updateGraphData({
          index: this._graphData.index,
          metadata: this._graphData.metadata,
        })
        this._updateRenderedNode(command.node)
        break
      default:
        assertNever(command)
    }
  }

  private _handleZoomInMode(): void {
    switch (this._mode.kind) {
      case GraphModeKind.NORMAL:
        break

      case GraphModeKind.SET_AS_PARENT:
        this._updateNewLink()
        break

      default:
        assertNever(this._mode.kind)
    }
  }

  private _resetPosition(): void {
    this._svg
      .transition()
      .duration(GraphComponent._TRANSITION_DURATION)
      .call(
        this._zoomHandler.transform,
        d3.zoomIdentity
          .translate(this._homeLocation.x, this._homeLocation.y)
          .scale(this._homeLocation.scale),
      )
  }

  private _setHomeLocation(location: IHomeLocation): void {
    logger.trace('Setting home location', location)
    this._homeLocation = location
  }

  /**
   * Center graph on _lastFocusedLocation
   */
  private _focusGraph(): void {
    // TODO: Rework _lastFocusedLocation maybe (so it doesn't have to get set for this
    //   method to work, maybe it can be an optional parameter to override the previous
    //   location otherwise it will set the graph to the existing value on the variable)
    if (!this._lastFocusedLocation) return

    const transform = this._getGraphTranslationAndScale()
    const position = this._graphToSVGPosition(this._lastFocusedLocation)
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

  private _onBackgroundMoveMove(): void {
    switch (this._mode.kind) {
      case GraphModeKind.NORMAL:
        break

      case GraphModeKind.SET_AS_PARENT:
        this._updateNewLink()
        break

      default:
        assertNever(this._mode.kind)
    }
  }

  private _onBackgroundContextMenu(): void {
    switch (this._mode.kind) {
      case GraphModeKind.NORMAL:
        const position = this._svgToGraphPosition({
          x: d3.event.clientX,
          y: d3.event.clientY,
        })
        this._lastFocusedLocation = null
        this._lastRightClickLocation = position
        this._setSelectedNode(null)
        showContextMenu(GraphComponent._CONTEXT_MENU_BACKGROUND_KEY)
        break

      case GraphModeKind.SET_AS_PARENT:
        break

      default:
        assertNever(this._mode.kind)
    }
  }

  private _onBackgroundClick(): void {
    switch (this._mode.kind) {
      case GraphModeKind.NORMAL:
        this._setSelectedNode(null)
        d3.event.stopPropagation()
        const position = this._svgToGraphPosition({
          x: d3.event.clientX,
          y: d3.event.clientY,
        })
        this._lastClickWasSingle = true
        this._lastFocusedLocation = null
        setTimeout(() => {
          if (this._lastClickWasSingle) {
            this._actionStream!.next(new graphTypes.BackgroundClickAction(position))
          }
        }, GraphComponent._SINGLE_CLICK_DELAY)
        break

      case GraphModeKind.SET_AS_PARENT:
        break

      default:
        assertNever(this._mode.kind)
    }
  }

  private _onBackgroundDblClick(): void {
    switch (this._mode.kind) {
      case GraphModeKind.NORMAL:
        this._setSelectedNode(null)
        d3.event.stopPropagation()
        this._lastClickWasSingle = false
        const position = this._svgToGraphPosition({
          x: d3.event.clientX,
          y: d3.event.clientY,
        })
        this._actionStream!.next(new graphTypes.BackgroundDblClickAction(position))
        break

      case GraphModeKind.SET_AS_PARENT:
        break

      default:
        assertNever(this._mode.kind)
    }
  }

  private _onLinkContextMenu(l: ILinkTuple): void {
    switch (this._mode.kind) {
      case GraphModeKind.NORMAL:
        d3.event.stopPropagation()
        this._lastSelectedLink = l
        showContextMenu(GraphComponent._CONTEXT_MENU_LINK_KEY)
        break

      case GraphModeKind.SET_AS_PARENT:
        break

      default:
        assertNever(this._mode.kind)
    }
  }

  private _onNodeClick(d: IGraphNodeData): void {
    switch (this._mode.kind) {
      case GraphModeKind.NORMAL:
        this._setSelectedNode(d.id)
        d3.event.stopPropagation()
        this._lastClickWasSingle = true
        setTimeout(() => {
          if (this._lastClickWasSingle) {
            this._actionStream!.next(new graphTypes.NodeClickAction(d.id))
          }
        }, GraphComponent._SINGLE_CLICK_DELAY)
        break

      case GraphModeKind.SET_AS_PARENT:
        if (d.id === this._selectedNode) return

        // Node has a parent
        if (this._graphData!.childParentIndex[d.id] !== null) return

        this._actionStream!
          .next(new graphTypes.SetNodeParentAction(this._startNode!, d.id))
        this._changeMode(GraphMode.NORMAL)
        this._handleSetAsParentExit()
        break

      default:
        assertNever(this._mode.kind)
    }
  }

  private _onNodeDblClick(d: IGraphNodeData): void {
    switch (this._mode.kind) {
      case GraphModeKind.NORMAL:
        d3.event.stopPropagation()
        this._lastClickWasSingle = false
        this._actionStream!.next(new graphTypes.NodeDblClickAction(d.id))
        break

      case GraphModeKind.SET_AS_PARENT:
        break

      default:
        assertNever(this._mode.kind)
    }
  }

  private _onNodeContextMenu(d: IGraphNodeData): void {
    switch (this._mode.kind) {
      case GraphModeKind.NORMAL:
        this._setSelectedNode(d.id)
        showContextMenu(GraphComponent._CONTEXT_MENU_NODE_KEY)
        d3.event.stopPropagation()
        this._actionStream!.next(new graphTypes.NodeRightClickAction(d.id))
        break

      case GraphModeKind.SET_AS_PARENT:
        break

      default:
        assertNever(this._mode.kind)
    }
  }

  private _onNodeMouseOver(d: IGraphNodeData, i: number, refs: any[]): void {
    switch (this._mode.kind) {
      case GraphModeKind.NORMAL:
        d3.event.stopPropagation()
        this._actionStream!.next(new graphTypes.NodeHoverShortAction(d.id))
        break

      case GraphModeKind.SET_AS_PARENT:
        if (d.id === this._startNode) return

        // Node has a parent
        if (this._graphData!.childParentIndex[d.id] !== null) return

        this._targetNode = d.id
        d3.select(refs[i])
          .classed('valid-target', true)
        break

      default:
        assertNever(this._mode.kind)
    }
  }

  private _onNodeMouseOut(d: IGraphNodeData, i: number, refs: any[]): void {
    switch (this._mode.kind) {
      case GraphModeKind.NORMAL:
        d3.event.stopPropagation()
        this._actionStream!.next(new graphTypes.NodeHoverEndAction(d.id))
        break

      case GraphModeKind.SET_AS_PARENT:
        if (d.id !== this._targetNode) return

        this._targetNode = null
        d3.select(refs[i])
          .classed('valid-target', false)
        break

      default:
        assertNever(this._mode.kind)
    }
  }

  private _changeMode(mode: IGraphMode): void {
    switch (mode.kind) {
      case GraphModeKind.NORMAL:
        this._mode = GraphMode.NORMAL
        break
      case GraphModeKind.SET_AS_PARENT:
        this._mode = GraphMode.SET_AS_PARENT
        this._handleModeChangeToSetAsParent()
        break
      default:
        assertNever(mode.kind)
    }
  }

  /**
   * Assumes _selectedNode is the parent node.
   */
  private _handleModeChangeToSetAsParent(): void {
    this._startNode = this._selectedNode!
    const node = this._graphData!.metadata[this._startNode]
    const position = {x: node.x, y: node.y}
    this._gNewLink
    .selectAll('.new-link')
      .data([null])
      .enter()
      .append('line')
      .attr('class', 'link new-link')
      .attr('x1', position.x)
      .attr('y1', position.y)
      .attr('x2', position.x)
      .attr('y2', position.y)
      .attr('stroke-width', GraphComponent._LINK_STROKE_HOVER)
  }

  private _handleSetAsParentExit(): void {
    this._gNodes
      .select('.valid-target')
      .classed('valid-target', false)

    this._startNode = null
    this._targetNode = null
    this._gNewLink.select('.new-link').remove()
  }

  // EXTENDED GRAPH FUNCTIONALITY //////////////////////////////////////////////

  /**
   * Jump to other side of the link on click
   */
  private _enableLinkClickJumpingToOppositeNode() {
    this._links
      .on('click', (d: ILinkTuple) => {
        switch (this._mode.kind) {
          case GraphModeKind.NORMAL:
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

            this._lastFocusedLocation = (distToSource < distToTarget)
              ? {x: targetNode.x, y: targetNode.y}
              : {x: sourceNode.x, y: sourceNode.y}
            this._focusGraph()
            break

          case GraphModeKind.SET_AS_PARENT:
            break

          default:
            assertNever(this._mode.kind)
        }
      })
  }

  private _enableDrag(): void {
    this._drag = d3.drag()
    this._drag
      .on('drag', (d: IGraphNodeData, i: number, refs: any[]) => {
        switch (this._mode.kind) {
          case GraphModeKind.NORMAL:
            this._setSelectedNode(d.id)

            d.x += d3.event.dx
            d.y += d3.event.dy

            const {translation} = this._centreOnPoint(d)
            if (d.id === this._homeNode)
              this._setHomeLocation({
                x: translation.x,
                y: translation.y,
                scale: this._homeLocation.scale,
              })

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
              if (n.id === d.id) {
                d3.select(refs_[i_])
                  .attr('transform', () => {
                    const x = d.x - GraphComponent._NODE_WIDTH / 2
                    const y = d.y - GraphComponent._NODE_HEIGHT / 2
                    return `translate(${x}, ${y}) scale(1)`
                  })

                const nodes: IGraphNodeData[] = []
                const hasParent: boolean[] = []
                const parentId = this._graphData!.childParentIndex[d.id]
                const childIds = this._graphData!.index[d.id]
                if (parentId !== null) {
                  nodes.push(this._graphData!.metadata[parentId])
                  hasParent.push(true)
                }
                if (childIds !== null) {
                  for (const k of childIds) {
                    nodes.push(this._graphData!.metadata[k])
                    hasParent.push(false)
                  }
                }

                for (let j = 0; j < nodes.length; j++) {
                  let line: any
                  if (hasParent[j]) line = {start: d, end: nodes[j]}
                  else line = {start: nodes[j], end: d}

                  const rect = {
                    xMin: line.start.x - GraphComponent._NODE_WIDTH / 2,
                    yMin: line.start.y - GraphComponent._NODE_HEIGHT / 2,
                    xMax: line.start.x + GraphComponent._NODE_WIDTH / 2,
                    yMax: line.start.y + GraphComponent._NODE_HEIGHT / 2,
                  }

                  const intersection = intersectLineWithRectange(line, rect)

                  const x = d3.select(refs_[line.start.id])
                  console.log(refs_, line.start.id)
                  x
                    .select('circle')
                    .attr('cx', () =>
                      intersection.x - line.start.x + GraphComponent._NODE_WIDTH / 2)
                      .attr('cy', () =>
                        intersection.y - line.start.y + GraphComponent._NODE_HEIGHT / 2)
                }
              }
            })

            this._actionStream!
              .next(new graphTypes.NodeDragAction(d.id, {x: d.x, y: d.y}))
            break

          case GraphModeKind.SET_AS_PARENT:
            break

          default:
            assertNever(this._mode.kind)
        }
      })
  }

  // private _enableClickToCenter(): void {
  //   this._nodes.on('click.centerOnNode', (d: IGraphNodeData) => {
  //     this._lastFocusedLocation = {x: d.x, y: d.y}
  //     const transform = this._getGraphTranslationAndScale()
  //     const position = this._graphToSVGPosition(d)
  //     const x = transform.translation.x + this._width / 2 - position.x
  //     const y = transform.translation.y + this._height / 2 - position.y
  //     this._svg
  //       .transition()
  //       .duration(GraphComponent._TRANSITION_DURATION)
  //       .call(
  //         this._zoomHandler.transform,
  //         d3.zoomIdentity.translate(x, y).scale(transform.scale),
  //       )
  //   })
  // }

  private _enableKeyboardPanning(): void {
    const keymap = {
      ESC: 27,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
    }

    d3.select('body').on('keydown', () => {
      const event = d3.event
      switch (this._mode.kind) {
        case GraphModeKind.NORMAL:
          const transform = this._getGraphTranslationAndScale()
          let offsetRight = transform.translation.x
          let offsetDown = transform.translation.y
          switch (event.keyCode) {
            case keymap.DOWN:
              offsetDown = transform.translation.y - GraphComponent._PAN_MOVEMENT_OFFSET
              break
            case keymap.UP:
              offsetDown = transform.translation.y + GraphComponent._PAN_MOVEMENT_OFFSET
              break
            case keymap.RIGHT:
              offsetRight
                = transform.translation.x - GraphComponent._PAN_MOVEMENT_OFFSET
              break
            case keymap.LEFT:
              offsetRight
                = transform.translation.x + GraphComponent._PAN_MOVEMENT_OFFSET
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
          this._actionStream!.next(new graphTypes.ZoomAction())
          break

        case GraphModeKind.SET_AS_PARENT:
          if (event.keyCode !== keymap.ESC) return

          this._changeMode(GraphMode.NORMAL)
          this._handleSetAsParentExit()
          break

        default:
          assertNever(this._mode.kind)
      }
    })
  }

  private _enableNodeHighlightOnHover(): void {
    this._nodes
      .on('mouseover', (d: IGraphNodeData, i: number, refs: any[]) => {
        if (this._mode !== GraphMode.NORMAL) return

        d3.select(refs[i])
          .select('rect')
          .attr('stroke-width', GraphComponent._NODE_STROKE_HOVER)
      })
      .on('mouseout', (d: IGraphNodeData, i: number, refs: any[]) => {
        if (this._mode !== GraphMode.NORMAL) return

        d3.select(refs[i])
          .select('rect')
          .attr('stroke-width', GraphComponent._NODE_STROKE)
      })
  }

  private _enableLinkHighlightOnHover(): void {
    this._links
      .on('mouseover', (d: IGraphNodeData, i: number, refs: any[]) => {
        if (this._mode !== GraphMode.NORMAL) return

        d3.select(refs[i])
          .attr('stroke-width', GraphComponent._LINK_STROKE_HOVER)
      })
      .on('mouseout', (d: IGraphNodeData, i: number, refs: any[]) => {
        if (this._mode !== GraphMode.NORMAL) return

        d3.select(refs[i])
          .attr('stroke-width', GraphComponent._LINK_STROKE)
      })
  }

  private _disableDoubleClickZoom(): void {
    this._svg.on('dblclick.zoom', null)
  }

  // UTILITIES /////////////////////////////////////////////////////////////////

  /**
   * Updates _graphData field with updated data
   */
  private _updateGraphData(data: IGraphData): void {
    this._graphData = {
      ...data,
      metadataItems: graphMetadataToList(data.metadata),
      childParentIndex: makeChildParentIndex(data.index),
      linkData: flattenGraphIndex(data.index),
    }
  }

  private _updateNewLink(): void {
    const nodeStart = this._graphData!.metadata[this._startNode!]
    const positionStart = {x: nodeStart.x, y: nodeStart.y}

    const newLinkEl = this._gNewLink.select('.new-link')
      .attr('x1', positionStart.x)
      .attr('y1', positionStart.y)

    if (this._targetNode !== null) {
      const nodeEnd = this._graphData!.metadata[this._targetNode]
      const positionEnd = {x: nodeEnd.x, y: nodeEnd.y}
      newLinkEl
        .attr('x2', positionEnd.x)
        .attr('y2', positionEnd.y)
    } else {
      // Prevents link from jumping when zooming (b/c clientX and clientY are undefined
      // then)
      if (d3.event.clientX && d3.event.clientY) {
        const positionEnd = this._svgToGraphPosition(
          {x: d3.event.clientX, y: d3.event.clientY})
        newLinkEl
          .attr('x2', positionEnd.x)
          .attr('y2', positionEnd.y)
      }
    }
  }

  private _setSelectedNode(id: GraphNodeId | null): void {
    if (this._selectedNode === id) return

    if (this._selectedNode !== null)
      this._nodes
        .filter((d: IGraphNodeData) => d.id === this._selectedNode)
        .classed('selected', false)
        .select('rect')
        .attr('stroke-width', GraphComponent._NODE_STROKE)

    if (id !== null)
      this._nodes
        .filter((d: IGraphNodeData) => d.id === id)
        .classed('selected', true)
        .select('rect')
        .attr('stroke-width', GraphComponent._NODE_STROKE_HOVER)

    logger.debug('Setting selected node to', id)
    this._selectedNode = id
  }

  private _getGraphTranslationAndScale(): ITransform {
    const transformRaw = this._g.attr('transform')
    const transform: ITransform = {translation: {x: 0, y: 0}, scale: 1}
    if (transformRaw === null || transformRaw.match(/Nan/)) return transform
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
    const box = this._getGraphBoundingBox()
    return {
      x: this._width === 0
        ? 0
        : this._width * (d.x - box.xMin) / (box.xMax - box.xMin),
      y: this._height === 0
        ? 0
        : this._height * (d.y - box.yMin) / (box.yMax - box.yMin),
    }
  }

  private _svgToGraphPosition(d: IPosition): IPosition {
    const box = this._getGraphBoundingBox()
    return {
      x: this._width === 0
        ? 0
        : (d.x / this._width) * (box.xMax - box.xMin) + box.xMin,
      y: this._height === 0
        ? 0
        : (d.y / this._height) * (box.yMax - box.yMin) + box.yMin,
    }
  }

  private _getGraphBoundingBox(): IBoundingBox {
    const transform = this._getGraphTranslationAndScale()
    return {
      xMin: -transform.translation.x / transform.scale,
      xMax: this._width / transform.scale - transform.translation.x / transform.scale,
      yMin: -transform.translation.y / transform.scale,
      yMax: this._height / transform.scale - transform.translation.y / transform.scale,
    }
  }

  private _graphTransformToString(): GraphTransformType {
    const transform = this._getGraphTranslationAndScale()
    return [transform.translation.x, transform.translation.y, transform.scale]
  }

  /**
   * Returns transform of the graph with the given point at the centre
   */
  private _centreOnPoint(d: IPosition): ITransform {
    const transform = this._getGraphTranslationAndScale()
    d = this._graphToSVGPosition(d)
    const x = transform.translation.x + this._width / 2 - d.x
    const y = transform.translation.y + this._height / 2 - d.y
    return {translation: {x, y}, scale: transform.scale}
  }
}
