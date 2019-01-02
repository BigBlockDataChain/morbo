import {IGraphNodeData} from '../../types'

export const NODE_CLICK_TYPE = 'nodeClick'
type NodeClickType           = 'nodeClick'
export interface INodeClickAction { readonly kind: NodeClickType, node: any }
export class NodeClickAction implements INodeClickAction {
  public readonly kind = NODE_CLICK_TYPE
  public constructor(public readonly node: any) {}
}

export const NODE_RIGHT_CLICK_TYPE = 'nodeRightClick'
type NodeRightClickType            = 'nodeRightClick'
export interface INodeRightClickAction { readonly kind: NodeRightClickType, node: any }
export class NodeRightClickAction implements INodeRightClickAction {
  public readonly kind = NODE_RIGHT_CLICK_TYPE
  public constructor(public readonly node: any) {}
}

export const NODE_DBL_CLICK_TYPE = 'nodeDblClick'
export type NodeDblClickType     = 'nodeDblClick'
export interface INodeDblClickAction { readonly kind: NodeDblClickType, node: any }
export class NodeDblClickAction implements INodeDblClickAction {
  public readonly kind = NODE_DBL_CLICK_TYPE
  public constructor(public readonly node: any) {}
}

export const NODE_DRAG_TYPE = 'nodeDrag'
export type NodeDragType    = 'nodeDrag'
export interface INodeDragAction { kind: NodeDragType, node: any }
export class NodeDragAction implements INodeDragAction {
  public readonly kind = NODE_DRAG_TYPE
  public constructor(public readonly node: any) {}
}

// NOTE Not implemented yet
// export const NODE_DBL_DRAG_TYPE = 'nodeDblDrag'
// export type NodeDblDragType     = 'nodeDblDrag'
// export interface INodeDblDragAction { kind: NodeDblDragType, node: any }
// export class NodeDblDragAction implements INodeDblDragAction {
//   public readonly kind = NODE_DBL_DRAG_TYPE
//   public constructor(public readonly node: any) {}
// }

export const NODE_HOVER_SHORT_TYPE = 'nodeHoverShort'
export type NodeHoverShortType     = 'nodeHoverShort'
export interface INodeHoverShortAction { kind: NodeHoverShortType, node: any }
export class NodeHoverShortAction implements INodeHoverShortAction {
  public readonly kind = NODE_HOVER_SHORT_TYPE
  public constructor(public readonly node: any) {}
}

// NOTE Not implemented yet
// export const NODE_HOVER_LONG_TYPE = 'nodeHoverLong'
// export type NodeHoverLongType     = 'nodeHoverLong'
// export interface INodeHoverLongAction { kind: NodeHoverLongType, node: any }
// export class NodeHoverLongAction implements INodeHoverLongAction {
//   public readonly kind = NODE_HOVER_LONG_TYPE
//   public constructor(public readonly node: any) {}
// }

export const NODE_HOVER_END_TYPE = 'nodeHoverEnd'
export type NodeHoverEndType     = 'nodeHoverEnd'
export interface INodeHoverEndAction { kind: NodeHoverEndType, node: any }
export class NodeHoverEndAction implements INodeHoverEndAction {
  public readonly kind = NODE_HOVER_END_TYPE
  public constructor(public readonly node: any) {}
}

export const BACKGROUND_CLICK_TYPE = 'backgroundClick'
export type BackgroundClickType    = 'backgroundClick'
export interface IBackgroundClickAction { kind: BackgroundClickType, position: IPosition }
export class BackgroundClickAction implements IBackgroundClickAction {
  public readonly kind = BACKGROUND_CLICK_TYPE
  public constructor(public readonly position: IPosition) {}
}

export const BACKGROUND_DBL_CLICK_TYPE = 'backgroundDblClick'
export type BackgroundDblClickType     = 'backgroundDblClick'
export interface IBackgroundDblClickAction {
  kind: BackgroundDblClickType,
  position: IPosition,
}
export class BackgroundDblClickAction implements IBackgroundDblClickAction {
  public readonly kind = BACKGROUND_DBL_CLICK_TYPE
  public constructor(public readonly position: IPosition) {}
}

export const ZOOM_TYPE = 'zoom'
export type ZoomType   = 'zoom'
export interface IZoomAction { kind: ZoomType }
export class ZoomAction implements IZoomAction {
  public readonly kind = ZOOM_TYPE
}

export type GraphAction
  = INodeClickAction
  | INodeRightClickAction
  | INodeDblClickAction
  | INodeDragAction
  // | INodeDblDragAction
  | INodeHoverShortAction
  // | INodeHoverLongAction
  | INodeHoverEndAction
  | IBackgroundClickAction
  | IBackgroundDblClickAction
  | IZoomAction

export const FOCUS_TYPE = 'focus'
export type FocusType   = 'focus'
export interface IFocusCommand { kind: FocusType, node: IGraphNodeData }
export class FocusCommand implements IFocusCommand {
  public readonly kind = FOCUS_TYPE
  public constructor(public readonly node: IGraphNodeData) {}
}

export const RESET_GRAPH_TYPE = 'resetGraph'
export type ResetGraphType   = 'resetGraph'
export interface IResetGraphCommand { kind: ResetGraphType }
export class ResetGraphCommand implements IResetGraphCommand {
  public readonly kind = RESET_GRAPH_TYPE
}

export type GraphCommand
  = IFocusCommand
  | IResetGraphCommand

interface IPosition { x: number, y: number }
